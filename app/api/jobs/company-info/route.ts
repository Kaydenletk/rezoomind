import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchCompanyData } from '@/lib/enrichment/company-data';

export const dynamic = 'force-dynamic';

/**
 * GET /api/jobs/company-info?company=CompanyName
 * Returns enriched company data (funding, leadership, H1B sponsorship, etc.)
 * Caches results in the CompanyData model (re-enriches if > 30 days old)
 */
export async function GET(request: Request) {
     try {
          const { searchParams } = new URL(request.url);
          const companyName = searchParams.get('company');

          if (!companyName || companyName.trim().length < 2) {
               return NextResponse.json(
                    { error: 'Company name is required (min 2 characters)' },
                    { status: 400 }
               );
          }

          const normalizedName = companyName.trim();

          // Check cache
          const cached = await prisma.companyData.findUnique({
               where: { companyName: normalizedName },
          });

          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

          if (cached && cached.lastEnriched > thirtyDaysAgo) {
               return NextResponse.json({
                    ok: true,
                    source: 'cache',
                    data: {
                         companyName: cached.companyName,
                         industry: cached.industry,
                         employeeCount: cached.employeeCount,
                         funding: cached.funding,
                         leadership: cached.leadership,
                         h1bSponsorship: cached.h1bSponsorship,
                         website: cached.website,
                         logoUrl: cached.logoUrl,
                         lastEnriched: cached.lastEnriched,
                    },
               });
          }

          // Fetch fresh data
          console.log(`[company-info] Enriching data for: ${normalizedName}`);
          const companyData = await fetchCompanyData(normalizedName);

          // Upsert to cache
          await prisma.companyData.upsert({
               where: { companyName: normalizedName },
               create: {
                    companyName: normalizedName,
                    industry: companyData.industry,
                    employeeCount: companyData.employeeCount,
                    funding: companyData.funding,
                    leadership: companyData.leadership as any,
                    h1bSponsorship: companyData.h1bSponsorship,
                    website: companyData.website,
                    logoUrl: companyData.logoUrl,
                    lastEnriched: new Date(),
               },
               update: {
                    industry: companyData.industry,
                    employeeCount: companyData.employeeCount,
                    funding: companyData.funding,
                    leadership: companyData.leadership as any,
                    h1bSponsorship: companyData.h1bSponsorship,
                    website: companyData.website,
                    logoUrl: companyData.logoUrl,
                    lastEnriched: new Date(),
               },
          });

          return NextResponse.json({
               ok: true,
               source: 'fresh',
               data: companyData,
          });
     } catch (error: any) {
          console.error('[company-info] Error:', error);
          return NextResponse.json(
               { ok: false, error: error.message || 'Failed to fetch company data' },
               { status: 500 }
          );
     }
}
