/**
 * Company Data Enrichment Service
 * Fetches company information from APIs and Gemini fallback
 */

import { generateGeminiJson } from "@/lib/ai/client";

export interface CompanyInfo {
     companyName: string;
     industry: string | null;
     employeeCount: string | null;
     funding: string | null;
     leadership: Array<{ name: string; title: string }>;
     h1bSponsorship: boolean | null;
     website: string | null;
     logoUrl: string | null;
}

/**
 * Try to fetch company data from Clearbit API (if key available)
 */
async function fetchFromClearbit(companyName: string): Promise<Partial<CompanyInfo> | null> {
     const apiKey = process.env.CLEARBIT_API_KEY;
     if (!apiKey) return null;

     try {
          // Use Clearbit Company Name to Domain API
          const response = await fetch(
               `https://company.clearbit.com/v1/domains/find?name=${encodeURIComponent(companyName)}`,
               {
                    headers: { Authorization: `Bearer ${apiKey}` },
                    signal: AbortSignal.timeout(5000),
               }
          );

          if (!response.ok) return null;

          const domainData = await response.json();
          if (!domainData.domain) return null;

          // Fetch full company data
          const companyResponse = await fetch(
               `https://company.clearbit.com/v2/companies/find?domain=${domainData.domain}`,
               {
                    headers: { Authorization: `Bearer ${apiKey}` },
                    signal: AbortSignal.timeout(5000),
               }
          );

          if (!companyResponse.ok) return null;

          const data = await companyResponse.json();

          return {
               industry: data.category?.industry || null,
               employeeCount: data.metrics?.employeesRange || null,
               funding: data.metrics?.raised ? `$${(data.metrics.raised / 1_000_000).toFixed(0)}M` : null,
               website: data.url || null,
               logoUrl: data.logo || null,
          };
     } catch {
          return null;
     }
}

/**
 * Fetch company data using Gemini as a fallback
 */
async function fetchFromGemini(companyName: string): Promise<Partial<CompanyInfo>> {
     try {
          return await generateGeminiJson<Partial<CompanyInfo>>({
               systemPrompt: `You are a company research assistant. Given a company name, provide factual information about it. 
Return a JSON object with these fields (use null for unknown):
{
  "industry": "string - primary industry",
  "employeeCount": "string - approximate employee range like '1,001-5,000'",
  "funding": "string - total funding raised like '$1.2B' or 'Public company'",
  "leadership": [{"name": "string", "title": "string"}] - up to 3 key leaders,
  "h1bSponsorship": boolean - whether the company is known to sponsor H1B visas,
  "website": "string - company website URL",
  "logoUrl": null
}
Only return the JSON, no other text.`,
               prompt: `Tell me about the company: ${companyName}`,
               temperature: 0.2,
               maxOutputTokens: 800,
          });
     } catch (error) {
          console.error(`[CompanyData] Gemini enrichment failed for "${companyName}":`, error);
          return {};
     }
}

/**
 * Fetch company data, trying Clearbit first, then falling back to Gemini
 */
export async function fetchCompanyData(companyName: string): Promise<CompanyInfo> {
     const result: CompanyInfo = {
          companyName,
          industry: null,
          employeeCount: null,
          funding: null,
          leadership: [],
          h1bSponsorship: null,
          website: null,
          logoUrl: null,
     };

     // Try Clearbit first
     const clearbitData = await fetchFromClearbit(companyName);
     if (clearbitData) {
          Object.assign(result, clearbitData);
     }

     // Fill gaps with Gemini
     const missingFields = !result.industry || !result.funding || !result.employeeCount;
     if (missingFields) {
          const aiData = await fetchFromGemini(companyName);

          // Only fill empty fields
          if (!result.industry && aiData.industry) result.industry = aiData.industry;
          if (!result.employeeCount && aiData.employeeCount) result.employeeCount = aiData.employeeCount;
          if (!result.funding && aiData.funding) result.funding = aiData.funding;
          if (result.leadership.length === 0 && aiData.leadership) result.leadership = aiData.leadership;
          if (result.h1bSponsorship === null && aiData.h1bSponsorship !== undefined) {
               result.h1bSponsorship = aiData.h1bSponsorship;
          }
          if (!result.website && aiData.website) result.website = aiData.website;
     }

     return result;
}
