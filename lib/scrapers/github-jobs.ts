/**
 * GitHub Jobs Scraper - Tier 1 (Hourly)
 * Parses job listings from GitHub markdown repos like speedyapply/2026-SWE-College-Jobs
 */

import { createHash } from 'crypto';
import { JobScraper, ScrapedJob, ScraperResult } from './types';
import { GITHUB_JOB_REPOS } from './config';

const stripHtml = (value: string) => value.replace(/<[^>]+>/g, '').trim();

const extractHref = (value: string) => {
  const matches = [...value.matchAll(/href="([^"]+)"/g)];
  return matches.length ? matches[matches.length - 1][1] : undefined;
};

const parseAge = (value: string): Date | null => {
  const match = value.match(/(\d+)\s*d/i);
  if (!match) return null;
  const days = Number(match[1]);
  if (Number.isNaN(days)) return null;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
};

const buildSourceId = (source: string, input: string) =>
  `${source}|${createHash('sha256').update(input).digest('hex').slice(0, 16)}`;

function parseSalary(salaryStr: string): { min: number | null; max: number | null; interval: string | null } {
  // Parse hourly salary like "$62/hr" or "$125/hr"
  const hourlyMatch = salaryStr.match(/\$(\d+)\/hr/i);
  if (hourlyMatch) {
    const hourly = Number(hourlyMatch[1]);
    const annual = hourly * 40 * 52;
    return { min: annual, max: annual, interval: 'hourly' };
  }

  // Parse yearly salary like "$193k/yr" or "$150k/yr"
  const yearlyMatch = salaryStr.match(/\$(\d+)k\/yr/i);
  if (yearlyMatch) {
    const yearly = Number(yearlyMatch[1]) * 1000;
    return { min: yearly, max: yearly, interval: 'yearly' };
  }

  return { min: null, max: null, interval: null };
}

interface FileMetadata {
  jobType: 'internship' | 'new-grad';
  region: 'usa' | 'international';
}

function parseJobsFromMarkdown(markdown: string, meta: FileMetadata): ScrapedJob[] {
  const lines = markdown.split(/\r?\n/);
  const jobs: ScrapedJob[] = [];

  let currentTableHasSalary = false;
  let currentCategory: 'faang' | 'quant' | 'other' = 'other';

  for (const line of lines) {
    // Detect section markers from HTML comments
    if (line.includes('TABLE_FAANG_START')) { currentCategory = 'faang'; continue; }
    if (line.includes('TABLE_QUANT_START')) { currentCategory = 'quant'; continue; }
    if (line.includes('TABLE_START')) { currentCategory = 'other'; continue; }

    // Check for table header to determine format
    const normalizedLine = line.toLowerCase();
    if (normalizedLine.includes('company') && normalizedLine.includes('position') && normalizedLine.includes('salary')) {
      currentTableHasSalary = true;
      continue;
    }
    if (normalizedLine.includes('company') && normalizedLine.includes('position') && normalizedLine.includes('posting') && !normalizedLine.includes('salary')) {
      currentTableHasSalary = false;
      continue;
    }

    // Skip non-table lines
    if (!line.trim().startsWith('|')) continue;
    // Skip separator rows
    if (line.includes('---') || line.match(/^\|[\s\-:]+\|/)) continue;

    const trimmed = line.trim();
    const lineToParse = trimmed.endsWith('|') ? trimmed.slice(0, -1) : trimmed;
    const columns = lineToParse
      .slice(1)
      .split('|')
      .map((column) => column.trim());

    if (columns.length === 0) continue;
    if (columns[0]?.toLowerCase() === 'company' || columns[0]?.toLowerCase().includes('company')) continue;

    let company: string;
    let role: string;
    let location: string | null;
    let postingUrl: string | undefined;
    let datePosted: Date | null;
    let salary = { min: null as number | null, max: null as number | null, interval: null as string | null };

    if (currentTableHasSalary && columns.length >= 6) {
      company = stripHtml(columns[0] || '');
      role = stripHtml(columns[1] || '');
      location = stripHtml(columns[2] || '') || null;
      salary = parseSalary(columns[3] || '');
      postingUrl = extractHref(columns[4] || '');
      datePosted = parseAge(columns[5] ?? '');
    } else if (columns.length >= 5) {
      company = stripHtml(columns[0] || '');
      role = stripHtml(columns[1] || '');
      location = stripHtml(columns[2] || '') || null;
      postingUrl = extractHref(columns[3] || '');
      datePosted = parseAge(columns[4] ?? '');
    } else if (columns.length >= 4) {
      company = stripHtml(columns[0] || '');
      role = stripHtml(columns[1] || '');
      location = stripHtml(columns[2] || '') || null;
      postingUrl = extractHref(columns[3] || '');
      datePosted = null;
    } else {
      continue;
    }

    if (!company || !role || company.length === 0 || role.length === 0) continue;

    const sourceId = buildSourceId(
      'github',
      `${company}|${role}|${location ?? ''}|${postingUrl ?? ''}`
    );

    // Build tags from file metadata and section category
    const tags: string[] = [meta.jobType, meta.region, currentCategory, '2026-swe'];

    jobs.push({
      sourceId,
      company,
      role,
      location,
      url: postingUrl ?? null,
      description: null,
      datePosted,
      source: 'github',
      tags,
      salaryMin: salary.min,
      salaryMax: salary.max,
      salaryInterval: salary.interval,
    });
  }

  return jobs;
}

export class GitHubJobsScraper implements JobScraper {
  name = 'GitHub Jobs';
  tier = 1 as const;
  enabled = true;

  async scrape(): Promise<ScraperResult> {
    const errors: string[] = [];
    const allJobs: ScrapedJob[] = [];

    for (const repo of GITHUB_JOB_REPOS) {
      const url = `https://raw.githubusercontent.com/${repo.owner}/${repo.repo}/main/${repo.file}`;

      try {
        console.log(`[GitHub] Fetching ${repo.file} from ${repo.owner}/${repo.repo}...`);

        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Rezoomind Job Scraper',
            'Accept': 'text/plain',
          },
          signal: AbortSignal.timeout(30000),
        });

        if (!response.ok) {
          const errorMsg = `Failed to fetch ${repo.file} from ${repo.owner}/${repo.repo}: ${response.status} ${response.statusText}`;
          console.error(`[GitHub] ${errorMsg}`);
          errors.push(errorMsg);
          continue;
        }

        const markdown = await response.text();

        if (!markdown || markdown.trim().length === 0) {
          const errorMsg = `Empty response from ${repo.file}`;
          console.warn(`[GitHub] ${errorMsg}`);
          errors.push(errorMsg);
          continue;
        }

        const meta: FileMetadata = { jobType: repo.jobType, region: repo.region };
        const jobs = parseJobsFromMarkdown(markdown, meta);

        allJobs.push(...jobs);
        console.log(`[GitHub] ${repo.owner}/${repo.repo}/${repo.file}: Found ${jobs.length} jobs`);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        const errorMsg = `Error scraping ${repo.file} from ${repo.owner}/${repo.repo}: ${message}`;
        console.error(`[GitHub] ${errorMsg}`);
        errors.push(errorMsg);
        continue;
      }
    }

    console.log(`[GitHub] Total jobs scraped: ${allJobs.length} from ${GITHUB_JOB_REPOS.length} files`);

    return {
      jobs: allJobs,
      source: 'github',
      scrapedAt: new Date(),
      totalFound: allJobs.length,
      errors,
    };
  }
}
