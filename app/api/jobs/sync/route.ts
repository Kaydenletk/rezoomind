import { createHash, createHmac } from "crypto";
import { NextResponse } from "next/server";

import { createClient } from '@supabase/supabase-js';
import { enrichJobsWithPostedDate, enrichJobsWithDescription, type ScrapedJob } from '@/lib/scrapers';
import { sendJobAlertEmail } from "@/lib/email/resend";

export const dynamic = "force-dynamic";

// GitHub file configs with metadata
const GITHUB_JOB_FILES = [
  { file: 'README.md', jobType: 'internship', region: 'usa' },
  { file: 'NEW_GRAD_USA.md', jobType: 'new-grad', region: 'usa' },
  { file: 'INTERN_INTL.md', jobType: 'internship', region: 'international' },
  { file: 'NEW_GRAD_INTL.md', jobType: 'new-grad', region: 'international' },
] as const;

const GITHUB_REPO_OWNER = 'speedyapply';
const GITHUB_REPO_NAME = '2026-SWE-College-Jobs';
const GITHUB_BASE_URL = `https://raw.githubusercontent.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/main`;

type JobRecord = {
  company: string;
  role: string;
  location?: string;
  url?: string;
  description?: string | null;
  jobKeywords?: string[] | null;
  descriptionFetchedAt?: Date | null;
  datePosted?: Date;
  tags: string[];
  sourceId: string;
  source: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryInterval?: string;
};

const toScrapedJob = (job: JobRecord): ScrapedJob => ({
  sourceId: job.sourceId,
  company: job.company,
  role: job.role,
  location: job.location ?? null,
  url: job.url ?? null,
  description: job.description ?? null,
  jobKeywords: job.jobKeywords ?? null,
  descriptionFetchedAt: job.descriptionFetchedAt ?? null,
  datePosted: job.datePosted ?? null,
  source: job.source,
  tags: job.tags,
  salaryMin: job.salaryMin ?? null,
  salaryMax: job.salaryMax ?? null,
  salaryInterval: job.salaryInterval ?? null,
});

const fromScrapedJob = (job: ScrapedJob): JobRecord => ({
  sourceId: job.sourceId,
  company: job.company,
  role: job.role,
  location: job.location ?? undefined,
  url: job.url ?? undefined,
  description: job.description ?? null,
  jobKeywords: job.jobKeywords ?? null,
  descriptionFetchedAt: job.descriptionFetchedAt ?? null,
  datePosted: job.datePosted ?? undefined,
  source: job.source,
  tags: job.tags,
  salaryMin: job.salaryMin ?? undefined,
  salaryMax: job.salaryMax ?? undefined,
  salaryInterval: job.salaryInterval ?? undefined,
});

const stripMarkup = (value: string) => {
  if (!value) return "";
  let text = value;
  text = text.replace(/<br\s*\/?>/gi, " ");
  text = text.replace(/&nbsp;/gi, " ");
  text = text.replace(/&amp;/gi, "&");
  text = text.replace(/&quot;/gi, "\"");
  text = text.replace(/&#39;/gi, "'");
  text = text.replace(/<[^>]+>/g, " ");
  text = text.replace(/!\[[^\]]*]\([^)]+\)/g, " ");
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  text = text.replace(/`([^`]+)`/g, "$1");
  text = text.replace(/\*\*([^*]+)\*\*/g, "$1");
  text = text.replace(/\*([^*]+)\*/g, "$1");
  return text.replace(/\s+/g, " ").trim();
};

const extractLinks = (value: string): string[] => {
  if (!value) return [];
  const links: string[] = [];

  for (const match of value.matchAll(/\[\s*!\[[^\]]*]\([^)]+\)\s*]\((https?:\/\/[^)\s]+)\)/g)) {
    links.push(match[1]);
  }

  for (const match of value.matchAll(/href="([^"]+)"/g)) {
    links.push(match[1]);
  }

  const withoutImages = value.replace(/!\[[^\]]*]\([^)]+\)/g, "");
  for (const match of withoutImages.matchAll(/\[[^\]]+]\((https?:\/\/[^)\s]+)\)/g)) {
    links.push(match[1]);
  }

  for (const match of value.matchAll(/<\s*(https?:\/\/[^>\s]+)\s*>/g)) {
    links.push(match[1]);
  }

  for (const match of value.matchAll(/https?:\/\/[^\s)]+/g)) {
    links.push(match[0]);
  }

  const seen = new Set<string>();
  return links
    .map((link) => link.replace(/[),.;]+$/g, ""))
    .filter((link) => {
      if (seen.has(link)) return false;
      seen.add(link);
      return true;
    });
};

const isLikelyImageUrl = (url: string) =>
  /\.(png|jpe?g|gif|svg)(\?|$)/i.test(url) ||
  /img\.shields\.io|camo\.githubusercontent\.com/i.test(url);

const pickFirstJobUrl = (value: string) => {
  const links = extractLinks(value);
  return links.find((link) => !isLikelyImageUrl(link));
};

const parsePostedDate = (value: string) => {
  if (!value) return undefined;
  const normalized = stripMarkup(value).toLowerCase();
  if (!normalized) return undefined;

  if (normalized.includes("today") || normalized.includes("just")) {
    return new Date();
  }
  if (normalized.includes("yesterday")) {
    return new Date(Date.now() - 24 * 60 * 60 * 1000);
  }

  const relativeMatch = normalized.match(/(\d+)\s*(d|day|days)\b/);
  if (relativeMatch) {
    const days = Number(relativeMatch[1]);
    if (!Number.isNaN(days)) {
      return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    }
  }

  const parsed = Date.parse(normalized);
  if (!Number.isNaN(parsed)) {
    return new Date(parsed);
  }

  return undefined;
};

const parseSalary = (salaryStr: string) => {
  const hourlyMatch = salaryStr.match(/\$(\d+)\/hr/i);
  if (hourlyMatch) {
    const hourly = Number(hourlyMatch[1]);
    const annual = hourly * 40 * 52;
    return { min: annual, max: annual, interval: 'hourly' };
  }
  const yearlyMatch = salaryStr.match(/\$(\d+)k\/yr/i);
  if (yearlyMatch) {
    const yearly = Number(yearlyMatch[1]) * 1000;
    return { min: yearly, max: yearly, interval: 'yearly' };
  }
  return { min: undefined as number | undefined, max: undefined as number | undefined, interval: undefined as string | undefined };
};

const buildSourceId = (input: string) =>
  `github|${createHash("sha256").update(input).digest("hex").slice(0, 16)}`;

const parseJobsFromMarkdown = (markdown: string, meta: { jobType: string; region: string; file: string }) => {
  const lines = markdown.split(/\r?\n/);
  const jobs: JobRecord[] = [];

  let currentTableHasSalary = false;
  let currentCategory: 'faang' | 'quant' | 'other' = 'other';

  for (const line of lines) {
    // Detect section markers from HTML comments
    if (line.includes('TABLE_FAANG_START')) { currentCategory = 'faang'; continue; }
    if (line.includes('TABLE_QUANT_START')) { currentCategory = 'quant'; continue; }
    if (line.includes('TABLE_START')) { currentCategory = 'other'; continue; }

    const heading = line.trim().toLowerCase();
    if (heading.startsWith("#")) {
      if (heading.includes("faang")) currentCategory = "faang";
      else if (heading.includes("quant")) currentCategory = "quant";
      else if (heading.includes("other") || heading.includes("all")) currentCategory = "other";
    }

    const normalizedLine = line.toLowerCase();
    if (normalizedLine.includes("company") && normalizedLine.includes("position") && normalizedLine.includes("salary")) {
      currentTableHasSalary = true;
      continue;
    }
    if (normalizedLine.includes("company") && normalizedLine.includes("position") && normalizedLine.includes("posting") && !normalizedLine.includes("salary")) {
      currentTableHasSalary = false;
      continue;
    }

    if (!line.trim().startsWith("|")) continue;
    if (line.includes("---") || line.match(/^\|[\s\-:]+\|/)) continue;

    const trimmed = line.trim();
    const lineToParse = trimmed.endsWith("|") ? trimmed.slice(0, -1) : trimmed;
    const columns = lineToParse
      .slice(1)
      .split("|")
      .map((column) => column.trim());

    if (columns.length === 0) continue;
    if (columns[0]?.toLowerCase() === "company" || columns[0]?.toLowerCase().includes("company")) continue;

    let company: string;
    let role: string;
    let location: string | undefined;
    let postingUrl: string | undefined;
    let datePosted: Date | undefined;
    let salary = { min: undefined as number | undefined, max: undefined as number | undefined, interval: undefined as string | undefined };

    if (currentTableHasSalary && columns.length >= 6) {
      company = stripMarkup(columns[0] || "");
      role = stripMarkup(columns[1] || "");
      location = stripMarkup(columns[2] || "") || undefined;
      salary = parseSalary(columns[3] || "");
      postingUrl = pickFirstJobUrl(columns[4] || "");
      datePosted = parsePostedDate(columns[5] ?? "");
    } else if (columns.length >= 5) {
      company = stripMarkup(columns[0] || "");
      role = stripMarkup(columns[1] || "");
      location = stripMarkup(columns[2] || "") || undefined;
      postingUrl = pickFirstJobUrl(columns[3] || "");
      datePosted = parsePostedDate(columns[4] ?? "");
    } else if (columns.length >= 4) {
      company = stripMarkup(columns[0] || "");
      role = stripMarkup(columns[1] || "");
      location = stripMarkup(columns[2] || "") || undefined;
      postingUrl = pickFirstJobUrl(columns[3] || "");
      datePosted = undefined;
    } else {
      continue;
    }

    if (!company || !role || company.length === 0 || role.length === 0) continue;

    const fallbackUrl =
      postingUrl ??
      pickFirstJobUrl(columns[1] || "") ??
      pickFirstJobUrl(columns[0] || "");

    const applyKey = fallbackUrl ?? meta.file;
    const sourceId = buildSourceId(
      `${company}|${role}|${location ?? ""}|${applyKey}`
    );

    const tags: string[] = [meta.jobType, meta.region, currentCategory, '2026-swe', 'date:repo'];

    jobs.push({
      company,
      role,
      location,
      url: fallbackUrl,
      datePosted,
      tags,
      sourceId,
      source: "github",
      salaryMin: salary.min,
      salaryMax: salary.max,
      salaryInterval: salary.interval,
    });
  }

  return jobs;
};

// GET method for manual sync (uses CRON_SECRET for auth)
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  return syncJobs(request);
}

export async function POST(request: Request) {
  const secret = process.env.JOBS_SYNC_SECRET;
  const provided = request.headers.get("x-sync-secret");

  if (!secret || !provided || provided !== secret) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const action = request.headers.get("x-action");

  if (action === "clear-and-sync") {
    return syncJobs(request, true, true);
  }
  if (action === "clear") {
    return syncJobs(request, true, false);
  }

  return syncJobs(request, false, false);
}

// DELETE method for clearing all GitHub jobs via RPC
export async function DELETE(request: Request) {
  const secret = process.env.JOBS_SYNC_SECRET;
  const provided = request.headers.get("x-sync-secret");

  if (!secret || !provided || provided !== secret) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  try {
    const { data: rpcResult, error: rpcError } = await supabase.rpc('clear_github_jobs', {
      sync_secret: process.env.JOBS_SYNC_SECRET || ''
    });

    if (rpcError) {
      console.error('[jobs:sync] RPC delete error:', rpcError);
      return NextResponse.json({ ok: false, error: rpcError.message }, { status: 500 });
    }

    const deleted = rpcResult?.deleted || 0;
    console.log(`[jobs:sync] Deleted ${deleted} jobs via RPC`);

    return NextResponse.json({
      ok: true,
      deleted,
      message: 'All GitHub jobs cleared. Ready for fresh sync.'
    });
  } catch (error) {
    console.error('[jobs:sync] Delete failed:', error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Clear failed' },
      { status: 500 }
    );
  }
}

async function syncJobs(request: Request, clearFirst = false, clearAndSync = false) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const supabase = createClient(url!, key!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  let deletedCount = 0;

  if (clearFirst) {
    try {
      const { data: rpcResult, error: rpcError } = await supabase.rpc('clear_github_jobs', {
        sync_secret: process.env.JOBS_SYNC_SECRET || ''
      });

      if (rpcError) {
        console.error('[jobs:sync] RPC clear error:', rpcError);
        return NextResponse.json({
          ok: false,
          error: `Clear failed: ${rpcError.message}`,
          hint: rpcError.hint
        }, { status: 500 });
      }

      deletedCount = rpcResult?.deleted || 0;
      console.log(`[jobs:sync] Deleted ${deletedCount} jobs via RPC.`);

      if (!clearAndSync) {
        return NextResponse.json({
          ok: true,
          deleted: deletedCount,
          message: `Cleared ${deletedCount} jobs. Ready for fresh sync.`
        });
      }
    } catch (error) {
      console.error('[jobs:sync] Clear error:', error);
      return NextResponse.json({
        ok: false,
        error: error instanceof Error ? error.message : 'Clear failed'
      }, { status: 500 });
    }
  }

  try {
    const allJobs: JobRecord[] = [];
    const fetchErrors: string[] = [];

    for (const fileConfig of GITHUB_JOB_FILES) {
      const fetchUrl = `${GITHUB_BASE_URL}/${fileConfig.file}`;

      try {
        console.log(`[jobs:sync] Fetching ${fileConfig.file}...`);

        const response = await fetch(fetchUrl, {
          headers: {
            'User-Agent': 'Rezoomind Job Scraper',
            'Accept': 'text/plain',
          },
          cache: 'no-store',
          signal: AbortSignal.timeout(30000),
        });

        if (!response.ok) {
          const errorMsg = `Failed to fetch ${fileConfig.file}: ${response.status} ${response.statusText}`;
          console.error(`[jobs:sync] ${errorMsg}`);
          fetchErrors.push(errorMsg);
          continue;
        }

        const markdown = await response.text();

        if (!markdown || markdown.trim().length === 0) {
          console.warn(`[jobs:sync] Empty response from ${fileConfig.file}`);
          continue;
        }

        const meta = { jobType: fileConfig.jobType, region: fileConfig.region, file: fileConfig.file };
        const jobs = parseJobsFromMarkdown(markdown, meta);
        allJobs.push(...jobs);
        console.log(`[jobs:sync] Found ${jobs.length} jobs in ${fileConfig.file}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        const errorMsg = `Error fetching ${fileConfig.file}: ${message}`;
        console.error(`[jobs:sync] ${errorMsg}`);
        fetchErrors.push(errorMsg);
        continue;
      }
    }

    if (allJobs.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "No jobs found in any files",
          errors: fetchErrors
        },
        { status: 404 }
      );
    }

    console.log(`[jobs:sync] Total jobs fetched: ${allJobs.length} from ${GITHUB_JOB_FILES.length} files`);

    let jobs = allJobs;
    const shouldEnrich = process.env.JOB_POSTED_ENRICH !== 'false';
    let scrapedJobs = allJobs.map(toScrapedJob);
    if (shouldEnrich) {
      const { jobs: enrichedJobs, stats } = await enrichJobsWithPostedDate(scrapedJobs);
      scrapedJobs = enrichedJobs;
      console.log('[jobs:sync] Posted-date enrichment', stats);
    }
    const shouldDescEnrich = process.env.JOB_DESC_ENRICH !== 'false';
    if (shouldDescEnrich) {
      const { jobs: enrichedJobs, stats } = await enrichJobsWithDescription(scrapedJobs);
      scrapedJobs = enrichedJobs;
      console.log('[jobs:sync] Description enrichment', stats);
    }
    jobs = scrapedJobs.map(fromScrapedJob);

    // Identify truly new jobs (for email notifications only)
    const { data: existingJobs } = await supabase
      .from('job_postings')
      .select('source_id');

    const existingSourceIds = new Set(
      (existingJobs || []).map((job) => job.source_id)
    );

    const newJobs = jobs.filter((job) => !existingSourceIds.has(job.sourceId));

    // UPSERT all jobs — refreshes created_at on existing records, inserts new ones
    let upsertedCount = 0;
    const batchSize = 50;

    for (let i = 0; i < jobs.length; i += batchSize) {
      const batch = jobs.slice(i, i + batchSize);
      const payload = batch.map((job) => {
        const row: Record<string, unknown> = {
          source_id: job.sourceId,
          company: job.company,
          role: job.role,
          location: job.location,
          url: job.url,
          date_posted: job.datePosted?.toISOString(),
          source: job.source,
          tags: job.tags,
          salary_min: job.salaryMin,
          salary_max: job.salaryMax,
          salary_interval: job.salaryInterval,
        };

        if (job.description) {
          row.description = job.description;
          row.job_keywords = job.jobKeywords ?? null;
          row.description_fetched_at = job.descriptionFetchedAt?.toISOString() ?? null;
        } else if (job.jobKeywords && job.jobKeywords.length > 0) {
          row.job_keywords = job.jobKeywords;
        }

        return row;
      });

      const { error } = await supabase
        .from('job_postings')
        .upsert(payload, { onConflict: 'source_id' });

      if (!error) {
        upsertedCount += batch.length;
      } else {
        console.error('[jobs:sync] Upsert error:', error);
      }
    }
    console.info("[jobs:sync]", {
      fetched: jobs.length,
      upserted: upsertedCount,
      newJobs: newJobs.length,
    });

    const signingSecret = process.env.EMAIL_SIGNING_SECRET;
    if (!signingSecret) {
      return NextResponse.json({
        ok: true,
        deleted: deletedCount,
        fetched: jobs.length,
        upserted: upsertedCount,
        emailed: 0,
      });
    }

    if (newJobs.length === 0) {
      return NextResponse.json({
        ok: true,
        deleted: deletedCount,
        fetched: jobs.length,
        upserted: upsertedCount,
        emailed: 0,
      });
    }

    const { data: subscribers } = await supabase
      .from('email_subscribers')
      .select('email, interests')
      .eq('status', 'active');

    if (!subscribers) {
      return NextResponse.json({
        ok: true,
        deleted: deletedCount,
        fetched: jobs.length,
        upserted: upsertedCount,
        emailed: 0,
      });
    }

    const origin =
      request.headers.get("origin") ?? process.env.APP_URL ?? "http://localhost:3000";
    const maxEmails = 50;
    const maxJobs = 8;
    let emailed = 0;

    for (const subscriber of subscribers) {
      if (emailed >= maxEmails) break;

      const interestList = Array.isArray(subscriber.interests)
        ? (subscriber.interests as string[]).map((value) => String(value).toLowerCase())
        : [];

      const matches = newJobs.filter((job) => {
        if (interestList.length === 0) return true;
        const haystack = `${job.role} ${job.company} ${job.location ?? ""}`.toLowerCase();
        return interestList.some((interest) => haystack.includes(interest.toLowerCase()));
      });

      if (matches.length === 0) continue;

      const unsubscribeToken = createHmac("sha256", signingSecret)
        .update(subscriber.email)
        .digest("hex");
      const unsubscribeUrl = `${origin}/api/unsubscribe?token=${unsubscribeToken}`;

      await sendJobAlertEmail(
        subscriber.email,
        matches.slice(0, maxJobs).map((job) => ({
          title: job.role,
          company: job.company,
          location: job.location,
          url: job.url,
        })),
        unsubscribeUrl
      );

      emailed += 1;
    }

    console.info("[jobs:sync]", {
      emailed,
      newJobs: newJobs.length,
    });

    return NextResponse.json({
      ok: true,
      deleted: deletedCount,
      fetched: jobs.length,
      upserted: upsertedCount,
      emailed,
      filesProcessed: GITHUB_JOB_FILES.length,
      errors: fetchErrors.length > 0 ? fetchErrors : undefined,
    });
  } catch (error) {
    console.error("[jobs:sync] failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json({ ok: false, error: "Sync failed" }, { status: 500 });
  }
}
