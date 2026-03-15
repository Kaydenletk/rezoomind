/**
 * JSearch API Scraper - Tier 2 (4x daily)
 * Fetches job listings from JSearch (RapidAPI) for additional coverage
 */

import { createHash } from 'crypto';
import { JobScraper, ScrapedJob, ScraperResult } from './types';
import { SEARCH_TERMS } from './config';

const JSEARCH_HOST = 'jsearch.p.rapidapi.com';
const JSEARCH_BASE_URL = `https://${JSEARCH_HOST}/search`;

interface JSearchJob {
     job_id: string;
     employer_name: string;
     job_title: string;
     job_city: string | null;
     job_state: string | null;
     job_country: string | null;
     job_apply_link: string | null;
     job_description: string | null;
     job_posted_at_datetime_utc: string | null;
     job_is_remote: boolean;
     job_min_salary: number | null;
     job_max_salary: number | null;
     job_salary_period: string | null;
     job_employment_type: string | null;
     employer_logo: string | null;
}

interface JSearchResponse {
     status: string;
     data: JSearchJob[];
     parameters: Record<string, string>;
}

function buildLocation(job: JSearchJob): string | null {
     if (job.job_is_remote) return 'Remote';
     const parts = [job.job_city, job.job_state, job.job_country].filter(Boolean);
     return parts.length > 0 ? parts.join(', ') : null;
}

function buildSourceId(jobId: string): string {
     const hash = createHash('sha256').update(jobId).digest('hex').slice(0, 16);
     return `jsearch|${hash}`;
}

function mapSalaryInterval(period: string | null): string | null {
     if (!period) return null;
     const lower = period.toLowerCase();
     if (lower.includes('year') || lower === 'yearly') return 'yearly';
     if (lower.includes('hour') || lower === 'hourly') return 'hourly';
     if (lower.includes('month') || lower === 'monthly') return 'monthly';
     return period;
}

function buildTags(job: JSearchJob): string[] {
     const tags: string[] = ['jsearch'];
     if (job.job_is_remote) tags.push('remote');
     if (job.job_employment_type) {
          const type = job.job_employment_type.toLowerCase();
          if (type.includes('intern')) tags.push('internship');
          else if (type.includes('full')) tags.push('full-time');
          else if (type.includes('part')) tags.push('part-time');
          else if (type.includes('contract')) tags.push('contract');
     }
     return tags;
}

function toScrapedJob(job: JSearchJob): ScrapedJob {
     return {
          sourceId: buildSourceId(job.job_id),
          company: job.employer_name,
          role: job.job_title,
          location: buildLocation(job),
          url: job.job_apply_link,
          description: job.job_description?.slice(0, 5000) ?? null,
          datePosted: job.job_posted_at_datetime_utc
               ? new Date(job.job_posted_at_datetime_utc)
               : null,
          source: 'jsearch',
          tags: buildTags(job),
          salaryMin: job.job_min_salary,
          salaryMax: job.job_max_salary,
          salaryInterval: mapSalaryInterval(job.job_salary_period),
     };
}

export class JSearchScraper implements JobScraper {
     name = 'JSearch API';
     tier = 2 as const;
     enabled: boolean;

     private apiKey: string | undefined;

     constructor() {
          this.apiKey = process.env.JSEARCH_API_KEY;
          this.enabled = !!this.apiKey;
     }

     async scrape(): Promise<ScraperResult> {
          const errors: string[] = [];
          const allJobs: ScrapedJob[] = [];

          if (!this.apiKey) {
               return {
                    jobs: [],
                    source: 'jsearch',
                    scrapedAt: new Date(),
                    totalFound: 0,
                    errors: ['JSEARCH_API_KEY is not configured'],
               };
          }

          // Use a subset of search terms to stay within rate limits
          const searchQueries = SEARCH_TERMS.slice(0, 3);

          for (const query of searchQueries) {
               try {
                    console.log(`[JSearch] Searching: "${query}"...`);

                    const params = new URLSearchParams({
                         query,
                         page: '1',
                         num_pages: '1',
                         date_posted: 'week',
                         remote_jobs_only: 'false',
                         employment_types: 'INTERN,FULLTIME',
                    });

                    const response = await fetch(`${JSEARCH_BASE_URL}?${params}`, {
                         headers: {
                              'x-rapidapi-key': this.apiKey,
                              'x-rapidapi-host': JSEARCH_HOST,
                         },
                         cache: 'no-store',
                         signal: AbortSignal.timeout(15000),
                    });

                    if (!response.ok) {
                         const errorMsg = `JSearch API error for "${query}": ${response.status} ${response.statusText}`;
                         console.error(`[JSearch] ${errorMsg}`);
                         errors.push(errorMsg);
                         continue;
                    }

                    const data: JSearchResponse = await response.json();

                    if (!data.data || !Array.isArray(data.data)) {
                         console.warn(`[JSearch] No data returned for "${query}"`);
                         continue;
                    }

                    const jobs = data.data
                         .filter((job) => job.employer_name && job.job_title)
                         .map(toScrapedJob);

                    allJobs.push(...jobs);
                    console.log(`[JSearch] "${query}": Found ${jobs.length} jobs`);

                    // Rate limit: small delay between requests
                    await new Promise((resolve) => setTimeout(resolve, 500));
               } catch (error) {
                    const message = error instanceof Error ? error.message : 'Unknown error';
                    const errorMsg = `JSearch error for "${query}": ${message}`;
                    console.error(`[JSearch] ${errorMsg}`);
                    errors.push(errorMsg);
               }
          }

          console.log(`[JSearch] Total jobs scraped: ${allJobs.length}`);

          return {
               jobs: allJobs,
               source: 'jsearch',
               scrapedAt: new Date(),
               totalFound: allJobs.length,
               errors,
          };
     }
}
