/**
 * Greenhouse Scraper - Tier 1 (Hourly)
 * Pulls jobs directly from the Greenhouse boards API for configured companies.
 * No auth required. Descriptions included inline via ?content=true.
 */

import { createHash } from 'crypto';
import { JobScraper, ScrapedJob, ScraperResult } from './types';
import { GREENHOUSE_COMPANIES } from './config';
import { inferJobType, inferRegion, stripHtml } from './ats-helpers';

const BASE_URL = 'https://boards-api.greenhouse.io/v1/boards';

interface GreenhouseJob {
  id: number;
  title: string;
  location: { name: string } | null;
  absolute_url: string;
  content?: string;
  updated_at: string;
}

interface GreenhouseResponse {
  jobs: GreenhouseJob[];
}

function toScrapedJob(job: GreenhouseJob, companyName: string): ScrapedJob {
  const description = job.content ? stripHtml(job.content).slice(0, 8000) : null;
  const jobType = inferJobType(job.title);
  const region = inferRegion(job.location?.name ?? null);

  return {
    sourceId: `greenhouse|${createHash('sha256').update(String(job.id)).digest('hex').slice(0, 16)}`,
    company: companyName,
    role: job.title,
    location: job.location?.name ?? null,
    url: job.absolute_url,
    description,
    jobKeywords: null,
    descriptionFetchedAt: description ? new Date() : null,
    datePosted: job.updated_at ? new Date(job.updated_at) : null,
    source: 'greenhouse',
    tags: ['greenhouse', jobType, region],
    salaryMin: null,
    salaryMax: null,
    salaryInterval: null,
  };
}

async function fetchCompanyJobs(
  slug: string,
  name: string,
): Promise<{ jobs: ScrapedJob[]; error?: string }> {
  try {
    const url = `${BASE_URL}/${slug}/jobs?content=true`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Rezoomind Job Scraper' },
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const msg = `[Greenhouse] ${name} (${slug}): ${response.status} ${response.statusText}`;
      console.warn(msg);
      return { jobs: [], error: msg };
    }

    const data: GreenhouseResponse = await response.json();
    const jobs = (data.jobs ?? []).map((j) => toScrapedJob(j, name));
    console.log(`[Greenhouse] ${name}: ${jobs.length} jobs`);
    return { jobs };
  } catch (err) {
    const msg = `[Greenhouse] ${name} (${slug}): ${err instanceof Error ? err.message : 'Unknown error'}`;
    console.error(msg);
    return { jobs: [], error: msg };
  }
}

export class GreenhouseScraper implements JobScraper {
  name = 'Greenhouse';
  tier = 1 as const;
  enabled = true;

  async scrape(): Promise<ScraperResult> {
    const results = await Promise.allSettled(
      GREENHOUSE_COMPANIES.map(({ slug, name }) => fetchCompanyJobs(slug, name)),
    );

    const allJobs: ScrapedJob[] = [];
    const errors: string[] = [];

    for (const result of results) {
      if (result.status === 'fulfilled') {
        allJobs.push(...result.value.jobs);
        if (result.value.error) errors.push(result.value.error);
      } else {
        errors.push(result.reason?.message ?? 'Unknown failure');
      }
    }

    console.log(`[Greenhouse] Total: ${allJobs.length} jobs from ${GREENHOUSE_COMPANIES.length} companies`);

    return {
      jobs: allJobs,
      source: 'greenhouse',
      scrapedAt: new Date(),
      totalFound: allJobs.length,
      errors,
    };
  }
}
