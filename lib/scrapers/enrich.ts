import type { ScrapedJob } from './types';

type EnrichOptions = {
  maxPages: number;
  concurrency: number;
  timeoutMs: number;
  cacheHours: number;
  maxBodyBytes: number;
};

export type EnrichStats = {
  attempted: number;
  updated: number;
  skipped: number;
  errors: number;
  cacheHits: number;
};

type CacheEntry = {
  date: Date | null;
  cachedAt: number;
};

const postedDateCache = new Map<string, CacheEntry>();

const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const defaultOptions = (): EnrichOptions => ({
  maxPages: toNumber(process.env.JOB_POSTED_MAX_PAGES, 200),
  concurrency: toNumber(process.env.JOB_POSTED_CONCURRENCY, 6),
  timeoutMs: toNumber(process.env.JOB_POSTED_TIMEOUT_MS, 2500),
  cacheHours: toNumber(process.env.JOB_POSTED_CACHE_HOURS, 6),
  maxBodyBytes: toNumber(process.env.JOB_POSTED_MAX_BODY_BYTES, 1_500_000),
});

const normalizeTags = (tags: string[]) => Array.from(new Set(tags));

const setDateSourceTag = (job: ScrapedJob, source: 'company' | 'repo'): ScrapedJob => {
  const existing = job.tags ?? [];
  const cleaned = existing.filter((tag) => tag !== 'date:company' && tag !== 'date:repo');
  return { ...job, tags: normalizeTags([...cleaned, source === 'company' ? 'date:company' : 'date:repo']) };
};

const isReasonableDate = (date: Date) => {
  const now = Date.now();
  const time = date.getTime();
  if (Number.isNaN(time)) return false;
  if (time > now + 7 * 24 * 60 * 60 * 1000) return false;
  if (time < now - 400 * 24 * 60 * 60 * 1000) return false;
  return true;
};

const parseDateValue = (value: string | number | undefined): Date | null => {
  if (!value) return null;
  if (typeof value === 'number') {
    const ts = value > 1e12 ? value : value * 1000;
    const date = new Date(ts);
    return isReasonableDate(date) ? date : null;
  }
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return null;
  const date = new Date(parsed);
  return isReasonableDate(date) ? date : null;
};

const findDateInJsonLd = (node: unknown): Date | null => {
  if (!node) return null;
  if (Array.isArray(node)) {
    for (const item of node) {
      const date = findDateInJsonLd(item);
      if (date) return date;
    }
    return null;
  }
  if (typeof node !== 'object') return null;

  const obj = node as Record<string, unknown>;

  if (Array.isArray(obj['@graph'])) {
    const date = findDateInJsonLd(obj['@graph']);
    if (date) return date;
  }

  const typeValue = obj['@type'];
  const types = Array.isArray(typeValue) ? typeValue : typeValue ? [typeValue] : [];
  const isJobPosting = types.some((type) =>
    typeof type === 'string' && type.toLowerCase().includes('jobposting')
  );

  if (isJobPosting) {
    const candidates = [
      obj.datePosted,
      obj.datePublished,
      obj.dateCreated,
      obj.postedDate,
      obj.publicationDate,
    ];
    for (const candidate of candidates) {
      const date = parseDateValue(candidate as string | number | undefined);
      if (date) return date;
    }
  }

  return null;
};

const extractDateFromJsonLd = (html: string): Date | null => {
  const scriptRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = scriptRegex.exec(html))) {
    const raw = match[1]?.trim();
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      const date = findDateInJsonLd(parsed);
      if (date) return date;
    } catch {
      continue;
    }
  }
  return null;
};

const extractDateFromMeta = (html: string): Date | null => {
  const metaRegex =
    /<meta[^>]+(?:property|name)=["'](article:published_time|og:published_time|date|dc\.date|dc\.date\.issued|pubdate|dateposted|date_published)["'][^>]*content=["']([^"']+)["'][^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = metaRegex.exec(html))) {
    const candidate = match[2];
    const date = parseDateValue(candidate);
    if (date) return date;
  }
  return null;
};

const extractDateFromAttributes = (html: string): Date | null => {
  const dataMatch = html.match(/data-posted-at=["'](\d{10,13})["']/i);
  if (dataMatch) {
    const date = parseDateValue(Number(dataMatch[1]));
    if (date) return date;
  }

  const timeMatch = html.match(/<time[^>]+datetime=["']([^"']+)["'][^>]*>/i);
  if (timeMatch) {
    const date = parseDateValue(timeMatch[1]);
    if (date) return date;
  }

  const jsonLikeMatch = html.match(/"datePosted"\s*:\s*"([^"]+)"/i);
  if (jsonLikeMatch) {
    const date = parseDateValue(jsonLikeMatch[1]);
    if (date) return date;
  }

  return null;
};

const extractPostedDate = (html: string): Date | null => {
  return (
    extractDateFromJsonLd(html) ||
    extractDateFromMeta(html) ||
    extractDateFromAttributes(html)
  );
};

export async function enrichJobsWithPostedDate(
  jobs: ScrapedJob[],
  options: Partial<EnrichOptions> = {}
): Promise<{ jobs: ScrapedJob[]; stats: EnrichStats }> {
  const settings = { ...defaultOptions(), ...options };
  const stats: EnrichStats = {
    attempted: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    cacheHits: 0,
  };

  if (settings.maxPages <= 0 || jobs.length === 0) {
    return {
      jobs: jobs.map((job) => setDateSourceTag(job, job.tags?.includes('date:company') ? 'company' : 'repo')),
      stats,
    };
  }

  const ttlMs = settings.cacheHours * 60 * 60 * 1000;
  const jobsWithUrls = jobs.filter((job) => job.url);
  const queue = jobsWithUrls.slice(0, settings.maxPages);
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

      const cached = postedDateCache.get(job.url);
      if (cached && Date.now() - cached.cachedAt < ttlMs) {
        stats.cacheHits += 1;
        if (cached.date) {
          updates.set(job.sourceId, setDateSourceTag({ ...job, datePosted: cached.date }, 'company'));
          stats.updated += 1;
        } else {
          updates.set(job.sourceId, setDateSourceTag(job, 'repo'));
        }
        continue;
      }

      try {
        const response = await fetch(job.url, {
          headers: { 'User-Agent': 'Rezoomind Job Enricher' },
          cache: 'no-store',
          signal: AbortSignal.timeout(settings.timeoutMs),
        });

        if (!response.ok) {
          postedDateCache.set(job.url, { date: null, cachedAt: Date.now() });
          stats.skipped += 1;
          continue;
        }

        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('text/html')) {
          postedDateCache.set(job.url, { date: null, cachedAt: Date.now() });
          stats.skipped += 1;
          continue;
        }

        const lengthHeader = response.headers.get('content-length');
        if (lengthHeader && Number(lengthHeader) > settings.maxBodyBytes) {
          postedDateCache.set(job.url, { date: null, cachedAt: Date.now() });
          stats.skipped += 1;
          continue;
        }

        const html = await response.text();
        const truncated = html.length > settings.maxBodyBytes ? html.slice(0, settings.maxBodyBytes) : html;
        const postedDate = extractPostedDate(truncated);

        postedDateCache.set(job.url, { date: postedDate, cachedAt: Date.now() });

        if (postedDate) {
          updates.set(job.sourceId, setDateSourceTag({ ...job, datePosted: postedDate }, 'company'));
          stats.updated += 1;
        } else {
          updates.set(job.sourceId, setDateSourceTag(job, 'repo'));
        }
      } catch {
        stats.errors += 1;
        postedDateCache.set(job.url, { date: null, cachedAt: Date.now() });
      }
    }
  };

  const workerCount = Math.max(1, Math.min(settings.concurrency, queue.length));
  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  const updatedJobs = jobs.map((job) => {
    const updated = updates.get(job.sourceId);
    if (updated) return updated;
    return setDateSourceTag(job, job.tags?.includes('date:company') ? 'company' : 'repo');
  });

  return { jobs: updatedJobs, stats };
}
