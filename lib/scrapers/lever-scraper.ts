/**
 * Lever Scraper - Tier 1 (Hourly)
 * Pulls jobs directly from the Lever postings API for configured companies.
 * No auth required. Descriptions included inline.
 */

import { createHash } from 'crypto';
import { JobScraper, ScrapedJob, ScraperResult } from './types';
import { LEVER_COMPANIES } from './config';
import { inferJobType, inferRegion } from './ats-helpers';

const BASE_URL = 'https://api.lever.co/v0/postings';

interface LeverPosting {
  id: string;
  text: string;
  categories: {
    location?: string;
    commitment?: string;
  };
  hostedUrl: string;
  descriptionPlain: string;
  createdAt: number;
}

function toScrapedJob(posting: LeverPosting, companyName: string): ScrapedJob {
  const description = posting.descriptionPlain?.slice(0, 8000) ?? null;
  const jobType = inferJobType(posting.text);
  const region = inferRegion(posting.categories?.location ?? null);

  return {
    sourceId: `lever|${createHash('sha256').update(posting.id).digest('hex').slice(0, 16)}`,
    company: companyName,
    role: posting.text,
    location: posting.categories?.location ?? null,
    url: posting.hostedUrl,
    description,
    jobKeywords: null,
    descriptionFetchedAt: description ? new Date() : null,
    datePosted: posting.createdAt ? new Date(posting.createdAt) : null,
    source: 'lever',
    tags: ['lever', jobType, region],
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
    const url = `${BASE_URL}/${slug}?mode=json`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Rezoomind Job Scraper' },
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const msg = `[Lever] ${name} (${slug}): ${response.status} ${response.statusText}`;
      console.warn(msg);
      return { jobs: [], error: msg };
    }

    const data: LeverPosting[] = await response.json();
    const jobs = (Array.isArray(data) ? data : []).map((p) => toScrapedJob(p, name));
    console.log(`[Lever] ${name}: ${jobs.length} jobs`);
    return { jobs };
  } catch (err) {
    const msg = `[Lever] ${name} (${slug}): ${err instanceof Error ? err.message : 'Unknown error'}`;
    console.error(msg);
    return { jobs: [], error: msg };
  }
}

export class LeverScraper implements JobScraper {
  name = 'Lever';
  tier = 1 as const;
  // Disabled: LEVER_COMPANIES is empty until fresh slugs are sourced.
  enabled = false;

  async scrape(): Promise<ScraperResult> {
    const results = await Promise.allSettled(
      LEVER_COMPANIES.map(({ slug, name }) => fetchCompanyJobs(slug, name)),
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

    console.log(`[Lever] Total: ${allJobs.length} jobs from ${LEVER_COMPANIES.length} companies`);

    return {
      jobs: allJobs,
      source: 'lever',
      scrapedAt: new Date(),
      totalFound: allJobs.length,
      errors,
    };
  }
}
