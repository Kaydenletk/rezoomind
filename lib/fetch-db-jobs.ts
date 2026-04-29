/**
 * Reads job postings from the application's primary store (`prisma.job_postings`).
 * The DB is populated by the orchestrator pipeline (Greenhouse / Lever / Ashby /
 * GitHub aggregators) on an hourly cron. Reading from it gives the homepage
 * roughly 3× the volume of GitHub-only fetching, with all source diversity.
 */
import { prisma } from "@/lib/prisma";
import { inferCategory, type JobCategory } from "@/lib/job-category";

export interface DbFeedJob {
  id: string;
  company: string;
  role: string;
  location: string;
  url: string;
  /** ISO timestamp from `date_posted`; empty string when unknown. */
  datePosted: string;
  category: JobCategory;
  tags: string[];
  source: string;
}

export interface DbFeedResult {
  jobs: DbFeedJob[];
  total: number;
  newGradTotal: number;
}

const FEED_LIMIT = 200;

function normalizeTags(tags: string[], role: string): string[] {
  const tagSet = new Set(tags.map((t) => t.toLowerCase()));
  // Backfill level tags from the role title when the upstream source omitted them.
  if (!tagSet.has("new-grad") && /\bnew[\s-]?grad/i.test(role)) tagSet.add("new-grad");
  if (!tagSet.has("internship") && /\bintern(ship)?\b/i.test(role)) tagSet.add("internship");
  return Array.from(tagSet);
}

/**
 * Fetch the freshest N jobs for the public landing feed.
 * Sorts by `date_posted` desc and falls back to `created_at` when the upstream
 * never supplied a posting date (some sources do not).
 */
export async function fetchDbJobs(limit = FEED_LIMIT): Promise<DbFeedResult> {
  try {
    const [rows, total, newGradTotal] = await Promise.all([
      prisma.job_postings.findMany({
        take: limit,
        orderBy: [
          { date_posted: { sort: "desc", nulls: "last" } },
          { created_at: "desc" },
        ],
        select: {
          source_id: true,
          company: true,
          role: true,
          location: true,
          url: true,
          date_posted: true,
          tags: true,
          source: true,
        },
      }),
      prisma.job_postings.count(),
      prisma.job_postings.count({
        where: {
          OR: [
            { tags: { has: "new-grad" } },
            { role: { contains: "new grad", mode: "insensitive" } },
          ],
        },
      }),
    ]);

    const jobs: DbFeedJob[] = rows.map((row) => {
      const tags = normalizeTags(row.tags ?? [], row.role);
      return {
        id: row.source_id,
        company: row.company,
        role: row.role,
        location: row.location ?? "",
        url: row.url ?? "",
        datePosted: row.date_posted ? row.date_posted.toISOString() : "",
        category: inferCategory(row.role, tags),
        tags,
        source: row.source,
      };
    });

    return { jobs, total, newGradTotal };
  } catch {
    return { jobs: [], total: 0, newGradTotal: 0 };
  }
}
