import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { GitHubJobsScraper, type ScrapedJob } from "@/lib/scrapers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const toClientJob = (job: ScrapedJob, scrapedAt: Date) => ({
  id: job.sourceId,
  company: job.company,
  role: job.role,
  location: job.location,
  url: job.url,
  description: job.description,
  salary_min: job.salaryMin,
  salary_max: job.salaryMax,
  salary_interval: job.salaryInterval,
  source: job.source,
  tags: job.tags,
  date_posted: job.datePosted?.toISOString() ?? null,
  created_at: scrapedAt.toISOString(),
});

export async function GET() {
  try {
    const scraper = new GitHubJobsScraper();
    const result = await scraper.scrape();
    const jobs = result.jobs;

    try {
      const existingJobs = await prisma.job_postings.findMany({
        where: {
          source_id: {
            in: jobs.map((job) => job.sourceId),
          },
        },
        select: {
          source_id: true,
          description: true,
        },
      });

      const dbDescriptions = new Map(
        existingJobs
          .filter((job) => typeof job.description === "string" && job.description.length > 0)
          .map((job) => [job.source_id, job.description])
      );

      jobs.forEach((job) => {
        if (!job.description && dbDescriptions.has(job.sourceId)) {
          job.description = dbDescriptions.get(job.sourceId) ?? null;
        }
      });
    } catch {
      // Allow the jobs feed to work even if DB enrichment is unavailable.
    }

    return NextResponse.json({
      ok: true,
      data: jobs.map((job) => toClientJob(job, result.scrapedAt)),
      count: jobs.length,
      source: "github-repo",
      errors: result.errors.length > 0 ? result.errors : undefined,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to load jobs from GitHub.",
      },
      { status: 500 }
    );
  }
}
