import { createHash, createHmac } from 'crypto';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GitHubJobsScraper, ScrapedJob, enrichJobsWithPostedDate, enrichJobsWithDescription, toDbJob } from '@/lib/scrapers';
import { sendJobAlertEmail } from '@/lib/email/resend';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type ClientJob = {
  id: string;
  company: string;
  role: string;
  location: string | null;
  url: string | null;
  description: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_interval: string | null;
  source: string;
  tags: string[];
  date_posted: string | null;
  created_at: string;
};

const toClientJob = (job: ScrapedJob, scrapedAt: Date): ClientJob => ({
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

const legacySourceIdFor = (job: ScrapedJob): string => {
  const input = `${job.company}|${job.role}|${job.location ?? ''}|`;
  return `github|${createHash('sha256').update(input).digest('hex').slice(0, 16)}`;
};

/**
 * GET /api/jobs/ensure-sync
 * Syncs jobs from GitHub directly (no HTTP self-call).
 *
 * - Default (no params): only syncs when DB has 0 jobs
 * - ?force=true: always syncs, but with a 1-minute cooldown
 *
 * Called by the jobs page on load for background refresh.
 */
export async function GET(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Use anon key for initial read (count check), service key for writes
  const { searchParams } = new URL(request.url);
  const force = searchParams.get('force') === 'true';
  const returnJobs = searchParams.get('returnJobs') === 'true';

  if (!supabaseUrl || !anonKey) {
    if (!returnJobs) {
      return NextResponse.json(
        { ok: false, error: 'Server not configured for jobs' },
        { status: 503 }
      );
    }

    const scraper = new GitHubJobsScraper();
    const result = await scraper.scrape();
    const shouldEnrich = process.env.JOB_POSTED_ENRICH !== 'false';
    if (shouldEnrich) {
      const { jobs: enrichedJobs, stats } = await enrichJobsWithPostedDate(result.jobs);
      result.jobs = enrichedJobs;
      console.log('[ensure-sync] Posted-date enrichment', stats);
    }
    const shouldDescEnrich = process.env.JOB_DESC_ENRICH !== 'false';
    if (shouldDescEnrich) {
      const { jobs: enrichedJobs, stats } = await enrichJobsWithDescription(result.jobs);
      result.jobs = enrichedJobs;
      console.log('[ensure-sync] Description enrichment', stats);
    }
    const scrapedAt = result.scrapedAt ?? new Date();

    return NextResponse.json({
      ok: true,
      triggered: true,
      fetched: result.jobs.length,
      jobs: result.jobs.map((job) => toClientJob(job, scrapedAt)),
      lastSync: scrapedAt.toISOString(),
      message: 'Scrape completed without database.',
      errors: result.errors.length > 0 ? result.errors : undefined,
    });
  }

  const readClient = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const { count, error: countError } = await readClient
      .from('job_postings')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      if (!returnJobs) {
        console.error('[ensure-sync] Count error:', countError);
        return NextResponse.json(
          { ok: false, error: countError.message },
          { status: 500 }
        );
      }
    }

    const skipDbWrites = Boolean(countError);
    const jobCount = skipDbWrites ? 0 : (count ?? 0);

    // Default behavior: only sync when DB is empty
    if (jobCount > 0 && !force) {
      return NextResponse.json({
        ok: true,
        triggered: false,
        count: jobCount,
        message: 'Jobs already present, no sync needed.',
      });
    }

    // Cooldown: if force=true but last sync was within 1 minute, skip
    if (force && jobCount > 0) {
      const { data: latest } = await readClient
        .from('job_postings')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (latest) {
        const lastSyncAge = Date.now() - new Date(latest.created_at).getTime();
        const COOLDOWN_MS = 1 * 60 * 1000; // 1 minute
        if (lastSyncAge < COOLDOWN_MS) {
          return NextResponse.json({
            ok: true,
            triggered: false,
            count: jobCount,
            lastSync: latest.created_at,
            message: 'Recently synced, skipping.',
          });
        }
      }
    }

    let writeClient: ReturnType<typeof createClient> | null = null;
    if (!skipDbWrites) {
      // Use service role key for writes if available, otherwise anon key
      const writeKey = serviceKey || anonKey;
      writeClient = createClient(supabaseUrl, writeKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
    }

    // Scrape jobs directly — no HTTP self-call
    console.log('[ensure-sync] Starting GitHub scrape...');
    const scraper = new GitHubJobsScraper();
    const result = await scraper.scrape();

    if (result.jobs.length === 0) {
      console.warn('[ensure-sync] No jobs found from GitHub');
      return NextResponse.json({
        ok: true,
        triggered: true,
        count: jobCount,
        fetched: 0,
        message: 'Scrape returned no jobs.',
        errors: result.errors.length > 0 ? result.errors : undefined,
        jobs: returnJobs ? [] : undefined,
      });
    }

    console.log(`[ensure-sync] Scraped ${result.jobs.length} jobs from GitHub`);

    let newJobs = result.jobs;
    let upsertedCount = 0;

    const shouldEnrich = process.env.JOB_POSTED_ENRICH !== 'false';
    const shouldDescEnrich = process.env.JOB_DESC_ENRICH !== 'false';

    if (writeClient) {
      const queryClient = readClient;
      const batchSize = 100;

      const fetchExistingIds = async (ids: string[]) => {
        const found = new Set<string>();
        for (let i = 0; i < ids.length; i += batchSize) {
          const chunk = ids.slice(i, i + batchSize);
          const { data } = await queryClient
            .from('job_postings')
            .select('source_id')
            .in('source_id', chunk);
          if (data) {
            data.forEach((row) => found.add(row.source_id));
          }
        }
        return found;
      };

      const newIds = result.jobs.map((job) => job.sourceId);
      const legacyIds = result.jobs.map(legacySourceIdFor);

      const existingNewIds = await fetchExistingIds(newIds);
      const existingLegacyIds = await fetchExistingIds(legacyIds);

      const total = result.jobs.length || 1;
      const newMatchRate = existingNewIds.size / total;
      const legacyMatchRate = existingLegacyIds.size / total;
      const shouldMigrate = total >= 50 && legacyMatchRate >= 0.3 && newMatchRate <= 0.1;

      let existingSourceIds = existingNewIds;

      if (shouldMigrate) {
        const syncSecret = process.env.JOBS_SYNC_SECRET || '';
        if (syncSecret) {
          console.warn('[ensure-sync] Detected legacy job IDs. Clearing and reseeding from GitHub.');
          const { error: clearError } = await writeClient.rpc('clear_github_jobs', {
            sync_secret: syncSecret,
          });

          if (clearError) {
            console.error('[ensure-sync] Legacy clear failed:', clearError);
          } else {
            existingSourceIds = new Set();
          }
        } else {
          console.warn('[ensure-sync] Legacy IDs detected but JOBS_SYNC_SECRET is missing; skipping auto-clear.');
        }
      }

      newJobs = result.jobs.filter(
        (job) => !existingSourceIds.has(job.sourceId)
      );

      if (shouldEnrich) {
        const priority = [
          ...newJobs,
          ...result.jobs.filter((job) => existingSourceIds.has(job.sourceId)),
        ];
        const { jobs: enrichedJobs, stats } = await enrichJobsWithPostedDate(priority);
        const enrichedMap = new Map(enrichedJobs.map((job) => [job.sourceId, job]));
        result.jobs = result.jobs.map((job) => enrichedMap.get(job.sourceId) ?? job);
        newJobs = newJobs.map((job) => enrichedMap.get(job.sourceId) ?? job);
        console.log('[ensure-sync] Posted-date enrichment', stats);
      }
      if (shouldDescEnrich) {
        const { jobs: enrichedJobs, stats } = await enrichJobsWithDescription(result.jobs);
        const enrichedMap = new Map(enrichedJobs.map((job) => [job.sourceId, job]));
        result.jobs = result.jobs.map((job) => enrichedMap.get(job.sourceId) ?? job);
        newJobs = newJobs.map((job) => enrichedMap.get(job.sourceId) ?? job);
        console.log('[ensure-sync] Description enrichment', stats);
      }

      // UPSERT all jobs in batches
      const upsertBatchSize = 50;

      for (let i = 0; i < result.jobs.length; i += upsertBatchSize) {
        const batch = result.jobs.slice(i, i + upsertBatchSize);
        const dbBatch = batch.map(toDbJob);

        const { error } = await writeClient
          .from('job_postings')
          .upsert(dbBatch, { onConflict: 'source_id' });

        if (!error) {
          upsertedCount += batch.length;
        } else {
          console.error('[ensure-sync] Upsert error:', error);
        }
      }
    } else if (shouldEnrich) {
      const { jobs: enrichedJobs, stats } = await enrichJobsWithPostedDate(result.jobs);
      result.jobs = enrichedJobs;
      console.log('[ensure-sync] Posted-date enrichment', stats);
    }
    if (!writeClient && shouldDescEnrich) {
      const { jobs: enrichedJobs, stats } = await enrichJobsWithDescription(result.jobs);
      result.jobs = enrichedJobs;
      console.log('[ensure-sync] Description enrichment', stats);
    }

    console.info('[ensure-sync]', {
      fetched: result.jobs.length,
      upserted: upsertedCount,
      newJobs: newJobs.length,
    });

    // Send email alerts for new jobs
    let emailed = 0;
    const signingSecret = process.env.EMAIL_SIGNING_SECRET;

    if (signingSecret && newJobs.length > 0 && writeClient) {
      const { data: subscribers } = await writeClient
        .from('email_subscribers')
        .select('email, interests')
        .eq('status', 'active');

      if (subscribers && subscribers.length > 0) {
        const origin =
          request.headers.get('origin') ??
          process.env.APP_URL ??
          'http://localhost:3000';
        const maxEmails = 50;
        const maxJobsPerEmail = 8;

        for (const subscriber of subscribers) {
          if (emailed >= maxEmails) break;

          const interestList = Array.isArray(subscriber.interests)
            ? (subscriber.interests as string[]).map((v) =>
                String(v).toLowerCase()
              )
            : [];

          const matches = newJobs.filter((job) => {
            if (interestList.length === 0) return true;
            const haystack =
              `${job.role} ${job.company} ${job.location ?? ''}`.toLowerCase();
            return interestList.some((interest) =>
              haystack.includes(interest.toLowerCase())
            );
          });

          if (matches.length === 0) continue;

          const unsubscribeToken = createHmac('sha256', signingSecret)
            .update(subscriber.email)
            .digest('hex');
          const unsubscribeUrl = `${origin}/api/unsubscribe?token=${unsubscribeToken}`;

          await sendJobAlertEmail(
            subscriber.email,
            matches.slice(0, maxJobsPerEmail).map((job) => ({
              title: job.role,
              company: job.company,
              location: job.location ?? undefined,
              url: job.url ?? undefined,
            })),
            unsubscribeUrl
          );

          emailed += 1;
        }
      }
    }

    return NextResponse.json({
      ok: true,
      triggered: true,
      count: upsertedCount,
      fetched: result.jobs.length,
      upserted: upsertedCount,
      newJobs: newJobs.length,
      emailed,
      lastSync: new Date().toISOString(),
      message: `Sync completed. Fetched ${result.jobs.length} jobs, upserted ${upsertedCount}.`,
      errors: result.errors.length > 0 ? result.errors : undefined,
      jobs: returnJobs ? result.jobs.map((job) => toClientJob(job, result.scrapedAt)) : undefined,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[ensure-sync] Error:', err);
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
