/**
 * Ashby Scraper - Tier 1 (Hourly)
 * Pulls jobs from Ashby's public GraphQL API for configured companies.
 * No auth required. Operation name verified live: ApiJobBoardWithTeams.
 */

import { createHash } from 'crypto';
import { JobScraper, ScrapedJob, ScraperResult } from './types';
import { ASHBY_COMPANIES } from './config';
import { inferJobType, inferRegion, stripHtml } from './ats-helpers';

const ASHBY_GQL_URL = 'https://jobs.ashbyhq.com/api/non-user-graphql';
const OPERATION_NAME = 'ApiJobBoardWithTeams';
const QUERY = `
  query ApiJobBoardWithTeams($organizationHostedJobsPageName: String!) {
    jobBoard: jobBoardWithTeams(organizationHostedJobsPageName: $organizationHostedJobsPageName) {
      jobPostings {
        id
        title
        locationName
        jobPostingUrl
        descriptionHtml
        publishedDate
      }
    }
  }
`;

interface AshbyJobPosting {
  id: string;
  title: string;
  locationName: string | null;
  jobPostingUrl: string;
  descriptionHtml: string | null;
  publishedDate: string | null;
}

interface AshbyResponse {
  data?: {
    jobBoard?: {
      jobPostings: AshbyJobPosting[];
    };
  };
  errors?: Array<{ message: string }>;
}

function toScrapedJob(posting: AshbyJobPosting, companyName: string): ScrapedJob {
  const description = posting.descriptionHtml
    ? stripHtml(posting.descriptionHtml).slice(0, 8000)
    : null;
  const jobType = inferJobType(posting.title);
  const region = inferRegion(posting.locationName);

  return {
    sourceId: `ashby|${createHash('sha256').update(posting.id).digest('hex').slice(0, 16)}`,
    company: companyName,
    role: posting.title,
    location: posting.locationName,
    url: posting.jobPostingUrl,
    description,
    jobKeywords: null,
    descriptionFetchedAt: description ? new Date() : null,
    datePosted: posting.publishedDate ? new Date(posting.publishedDate) : null,
    source: 'ashby',
    tags: ['ashby', jobType, region],
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
    const response = await fetch(ASHBY_GQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Rezoomind Job Scraper',
      },
      body: JSON.stringify({
        operationName: OPERATION_NAME,
        query: QUERY,
        variables: { organizationHostedJobsPageName: slug },
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const msg = `[Ashby] ${name} (${slug}): ${response.status} ${response.statusText}`;
      console.warn(msg);
      return { jobs: [], error: msg };
    }

    const data: AshbyResponse = await response.json();

    if (data.errors?.length) {
      const msg = `[Ashby] ${name} (${slug}): GraphQL error — ${data.errors[0].message}`;
      console.warn(msg);
      return { jobs: [], error: msg };
    }

    const postings = data.data?.jobBoard?.jobPostings ?? [];
    const jobs = postings.map((p) => toScrapedJob(p, name));
    console.log(`[Ashby] ${name}: ${jobs.length} jobs`);
    return { jobs };
  } catch (err) {
    const msg = `[Ashby] ${name} (${slug}): ${err instanceof Error ? err.message : 'Unknown error'}`;
    console.error(msg);
    return { jobs: [], error: msg };
  }
}

export class AshbyScraper implements JobScraper {
  name = 'Ashby';
  tier = 1 as const;
  enabled = true;

  async scrape(): Promise<ScraperResult> {
    const results = await Promise.allSettled(
      ASHBY_COMPANIES.map(({ slug, name }) => fetchCompanyJobs(slug, name)),
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

    console.log(`[Ashby] Total: ${allJobs.length} jobs from ${ASHBY_COMPANIES.length} companies`);

    return {
      jobs: allJobs,
      source: 'ashby',
      scrapedAt: new Date(),
      totalFound: allJobs.length,
      errors,
    };
  }
}
