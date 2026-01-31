/**
 * Unified interfaces for all job scrapers
 */

export interface ScrapedJob {
  sourceId: string;          // Unique ID: "{source}|{url_hash}"
  company: string;
  role: string;
  location: string | null;
  url: string | null;
  description: string | null;
  datePosted: Date | null;
  source: string;            // e.g., "remotive", "themuse", "usajobs"
  tags: string[];
  salaryMin: number | null;
  salaryMax: number | null;
  salaryInterval: string | null;
}

export interface ScraperResult {
  jobs: ScrapedJob[];
  source: string;
  scrapedAt: Date;
  totalFound: number;
  errors: string[];
}

export interface ScraperStats {
  scrapersRun: string[];
  totalFound: number;
  newJobs: number;
  duplicates: number;
  errors: string[];
  duration: number;
}

export interface OrchestratorResult {
  jobs: ScrapedJob[];
  stats: ScraperStats;
}

export interface JobScraper {
  name: string;
  tier: 1 | 2 | 3;           // Determines frequency
  enabled: boolean;
  scrape(): Promise<ScraperResult>;
}

// Database job format (snake_case for Supabase)
export interface DbJob {
  source_id: string;
  company: string;
  role: string;
  location: string | null;
  url: string | null;
  description: string | null;
  date_posted: string | null;
  source: string;
  tags: string[];
  salary_min: number | null;
  salary_max: number | null;
  salary_interval: string | null;
}

// Convert ScrapedJob to database format
export function toDbJob(job: ScrapedJob): DbJob {
  return {
    source_id: job.sourceId,
    company: job.company.slice(0, 200),
    role: job.role.slice(0, 200),
    location: job.location?.slice(0, 200) ?? null,
    url: job.url?.slice(0, 500) ?? null,
    description: job.description?.slice(0, 5000) ?? null,
    date_posted: job.datePosted?.toISOString() ?? null,
    source: job.source,
    tags: job.tags,
    salary_min: job.salaryMin,
    salary_max: job.salaryMax,
    salary_interval: job.salaryInterval,
  };
}
