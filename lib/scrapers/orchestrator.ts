/**
 * Scraper Orchestrator
 * Coordinates all scrapers with tier-based scheduling and deduplication
 */

import { createHash } from 'crypto';
import {
  JobScraper,
  ScrapedJob,
  ScraperResult,
  ScraperStats,
  OrchestratorResult,
} from './types';
import { shouldRunAtHour } from './config';
import { GitHubJobsScraper } from './github-jobs';

export class ScraperOrchestrator {
  private scrapers: JobScraper[];

  constructor() {
    this.scrapers = [
      // Only GitHub scraper - fetches from speedyapply/2026-SWE-College-Jobs
      new GitHubJobsScraper(),
    ];
  }

  /**
   * Run all scrapers that should execute at the current hour
   */
  async runScrapersForHour(currentHour: number): Promise<OrchestratorResult> {
    const startTime = Date.now();
    const errors: string[] = [];

    // Filter scrapers to those that should run at this hour
    const scrapersToRun = this.scrapers.filter(
      (s) => s.enabled && shouldRunAtHour(s.tier, currentHour)
    );

    console.log(`[Orchestrator] Hour ${currentHour}: Running ${scrapersToRun.length} scrapers`);
    console.log(`[Orchestrator] Scrapers: ${scrapersToRun.map((s) => s.name).join(', ')}`);

    // Run all eligible scrapers in parallel
    const results = await Promise.allSettled(
      scrapersToRun.map(async (scraper) => {
        try {
          console.log(`[Orchestrator] Starting ${scraper.name}...`);
          const result = await scraper.scrape();
          console.log(`[Orchestrator] ${scraper.name}: ${result.jobs.length} jobs, ${result.errors.length} errors`);
          return result;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          console.error(`[Orchestrator] ${scraper.name} failed:`, message);
          throw error;
        }
      })
    );

    // Collect all jobs from successful scrapers
    const allJobs: ScrapedJob[] = [];
    const scrapersRun: string[] = [];

    results.forEach((result, index) => {
      const scraperName = scrapersToRun[index].name;

      if (result.status === 'fulfilled') {
        scrapersRun.push(scraperName);
        allJobs.push(...result.value.jobs);

        if (result.value.errors.length > 0) {
          errors.push(...result.value.errors.map((e) => `${scraperName}: ${e}`));
        }
      } else {
        errors.push(`${scraperName}: ${result.reason?.message || 'Failed'}`);
      }
    });

    console.log(`[Orchestrator] Total jobs before deduplication: ${allJobs.length}`);

    // Deduplicate across sources
    const deduplicatedJobs = this.deduplicateJobs(allJobs);

    console.log(`[Orchestrator] Total jobs after deduplication: ${deduplicatedJobs.length}`);

    const duration = Date.now() - startTime;

    return {
      jobs: deduplicatedJobs,
      stats: {
        scrapersRun,
        totalFound: allJobs.length,
        newJobs: 0, // Will be set by the API route after DB check
        duplicates: allJobs.length - deduplicatedJobs.length,
        errors,
        duration,
      },
    };
  }

  /**
   * Deduplicate jobs across sources using fingerprinting
   */
  private deduplicateJobs(jobs: ScrapedJob[]): ScrapedJob[] {
    const seen = new Map<string, ScrapedJob>();

    for (const job of jobs) {
      // Create fingerprint from company + role + location
      const fingerprint = this.createFingerprint(job);

      if (!seen.has(fingerprint)) {
        seen.set(fingerprint, job);
      } else {
        // Prefer job with more data (description, salary)
        const existing = seen.get(fingerprint)!;
        if (this.hasMoreData(job, existing)) {
          seen.set(fingerprint, job);
        }
      }
    }

    return Array.from(seen.values());
  }

  /**
   * Create a fingerprint for deduplication
   */
  private createFingerprint(job: ScrapedJob): string {
    const normalized = [
      this.normalizeString(job.company),
      this.normalizeString(job.role),
      this.normalizeString(job.location || 'unknown'),
    ].join('|');

    return createHash('sha256').update(normalized).digest('hex').slice(0, 16);
  }

  /**
   * Normalize string for fingerprinting
   */
  private normalizeString(str: string): string {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .trim();
  }

  /**
   * Check if job A has more data than job B
   */
  private hasMoreData(jobA: ScrapedJob, jobB: ScrapedJob): boolean {
    let scoreA = 0;
    let scoreB = 0;

    // Score based on data completeness
    if (jobA.description) scoreA += 3;
    if (jobB.description) scoreB += 3;

    if (jobA.salaryMin !== null) scoreA += 2;
    if (jobB.salaryMin !== null) scoreB += 2;

    if (jobA.url) scoreA += 1;
    if (jobB.url) scoreB += 1;

    if (jobA.datePosted) scoreA += 1;
    if (jobB.datePosted) scoreB += 1;

    // Prefer newer date if scores are equal
    if (scoreA === scoreB && jobA.datePosted && jobB.datePosted) {
      return jobA.datePosted > jobB.datePosted;
    }

    return scoreA > scoreB;
  }

  /**
   * Get list of all scrapers with their tiers
   */
  getScraperInfo(): Array<{ name: string; tier: number; enabled: boolean }> {
    return this.scrapers.map((s) => ({
      name: s.name,
      tier: s.tier,
      enabled: s.enabled,
    }));
  }
}
