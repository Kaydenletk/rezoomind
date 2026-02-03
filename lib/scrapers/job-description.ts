import type { ScrapedJob } from "./types";
import { buildJobKeywords } from "@/lib/matching/keywords";

type DescriptionOptions = {
  maxPages: number;
  concurrency: number;
  timeoutMs: number;
  cacheHours: number;
  maxBodyBytes: number;
  maxDescriptionChars: number;
};

export type DescriptionStats = {
  attempted: number;
  updated: number;
  skipped: number;
  errors: number;
  cacheHits: number;
};

type CacheEntry = {
  description: string | null;
  keywords: string[];
  cachedAt: number;
};

const descriptionCache = new Map<string, CacheEntry>();

const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const defaultOptions = (): DescriptionOptions => ({
  maxPages: toNumber(process.env.JOB_DESC_MAX_PAGES, 120),
  concurrency: toNumber(process.env.JOB_DESC_CONCURRENCY, 4),
  timeoutMs: toNumber(process.env.JOB_DESC_TIMEOUT_MS, 2500),
  cacheHours: toNumber(process.env.JOB_DESC_CACHE_HOURS, 6),
  maxBodyBytes: toNumber(process.env.JOB_DESC_MAX_BODY_BYTES, 1_500_000),
  maxDescriptionChars: toNumber(process.env.JOB_DESC_MAX_CHARS, 8000),
});

const normalizeHtmlText = (html: string) => {
  let text = html;
  text = text.replace(/<script[\s\S]*?<\/script>/gi, " ");
  text = text.replace(/<style[\s\S]*?<\/style>/gi, " ");
  text = text.replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");
  text = text.replace(/<!--[\s\S]*?-->/g, " ");
  text = text.replace(/<(header|footer|nav|form|svg)[\s\S]*?<\/\1>/gi, " ");
  text = text.replace(/<(br|hr|p|div|li|h[1-6])[^>]*>/gi, "\n");
  text = text.replace(/<\/(p|div|li|h[1-6])>/gi, "\n");
  text = text.replace(/<[^>]+>/g, " ");
  text = text.replace(/&nbsp;/gi, " ");
  text = text.replace(/&amp;/gi, "&");
  text = text.replace(/&quot;/gi, '"');
  text = text.replace(/&#39;/gi, "'");
  text = text.replace(/\s+/g, " ");
  return text.trim();
};

export async function enrichJobsWithDescription(
  jobs: ScrapedJob[],
  options: Partial<DescriptionOptions> = {}
): Promise<{ jobs: ScrapedJob[]; stats: DescriptionStats }> {
  const settings = { ...defaultOptions(), ...options };
  const stats: DescriptionStats = {
    attempted: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    cacheHits: 0,
  };

  if (settings.maxPages <= 0 || jobs.length === 0) {
    return { jobs, stats };
  }

  const ttlMs = settings.cacheHours * 60 * 60 * 1000;
  const queue = jobs.filter((job) => job.url && !job.description).slice(0, settings.maxPages);
  const updates = new Map<string, ScrapedJob>();
  let index = 0;

  const worker = async () => {
    while (index < queue.length) {
      const job = queue[index++];
      if (!job.url) {
        stats.skipped += 1;
        continue;
      }

      stats.attempted += 1;

      const cached = descriptionCache.get(job.url);
      if (cached && Date.now() - cached.cachedAt < ttlMs) {
        stats.cacheHits += 1;
        if (cached.description) {
          updates.set(job.sourceId, {
            ...job,
            description: cached.description,
            jobKeywords: cached.keywords,
            descriptionFetchedAt: new Date(cached.cachedAt),
          });
          stats.updated += 1;
        }
        continue;
      }

      try {
        const response = await fetch(job.url, {
          headers: { "User-Agent": "Rezoomind Job Enricher" },
          cache: "no-store",
          signal: AbortSignal.timeout(settings.timeoutMs),
        });

        if (!response.ok) {
          descriptionCache.set(job.url, { description: null, keywords: [], cachedAt: Date.now() });
          stats.skipped += 1;
          continue;
        }

        const contentType = response.headers.get("content-type") || "";
        if (!contentType.includes("text/html")) {
          descriptionCache.set(job.url, { description: null, keywords: [], cachedAt: Date.now() });
          stats.skipped += 1;
          continue;
        }

        const lengthHeader = response.headers.get("content-length");
        if (lengthHeader && Number(lengthHeader) > settings.maxBodyBytes) {
          descriptionCache.set(job.url, { description: null, keywords: [], cachedAt: Date.now() });
          stats.skipped += 1;
          continue;
        }

        const body = await response.arrayBuffer();
        if (body.byteLength > settings.maxBodyBytes) {
          descriptionCache.set(job.url, { description: null, keywords: [], cachedAt: Date.now() });
          stats.skipped += 1;
          continue;
        }

        const html = new TextDecoder("utf-8").decode(body);
        const cleaned = normalizeHtmlText(html);
        if (!cleaned) {
          descriptionCache.set(job.url, { description: null, keywords: [], cachedAt: Date.now() });
          stats.skipped += 1;
          continue;
        }

        const description = cleaned.slice(0, settings.maxDescriptionChars);
        const jobKeywords = buildJobKeywords({
          role: job.role,
          company: job.company,
          location: job.location,
          tags: job.tags,
          description,
        });

        descriptionCache.set(job.url, {
          description,
          keywords: jobKeywords,
          cachedAt: Date.now(),
        });

        updates.set(job.sourceId, {
          ...job,
          description,
          jobKeywords,
          descriptionFetchedAt: new Date(),
        });
        stats.updated += 1;
      } catch {
        stats.errors += 1;
      }
    }
  };

  const workers = Array.from({ length: settings.concurrency }, () => worker());
  await Promise.all(workers);

  const updatedJobs = jobs.map((job) => updates.get(job.sourceId) ?? job);
  return { jobs: updatedJobs, stats };
}
