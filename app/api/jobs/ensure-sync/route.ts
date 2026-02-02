import { createHmac } from 'crypto';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GitHubJobsScraper, toDbJob } from '@/lib/scrapers';
import { sendJobAlertEmail } from '@/lib/email/resend';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

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

  if (!supabaseUrl || !anonKey) {
    return NextResponse.json(
      { ok: false, error: 'Server not configured for jobs' },
      { status: 503 }
    );
  }

  // Use anon key for initial read (count check), service key for writes
  const readClient = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { searchParams } = new URL(request.url);
  const force = searchParams.get('force') === 'true';

  try {
    const { count, error: countError } = await readClient
      .from('job_postings')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('[ensure-sync] Count error:', countError);
      return NextResponse.json(
        { ok: false, error: countError.message },
        { status: 500 }
      );
    }

    const jobCount = count ?? 0;

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

    // Use service role key for writes if available, otherwise anon key
    const writeKey = serviceKey || anonKey;
    const writeClient = createClient(supabaseUrl, writeKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

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
      });
    }

    console.log(`[ensure-sync] Scraped ${result.jobs.length} jobs from GitHub`);

    // Identify truly new jobs (for email notifications)
    const { data: existingJobs } = await writeClient
      .from('job_postings')
      .select('source_id');

    const existingSourceIds = new Set(
      (existingJobs || []).map((job) => job.source_id)
    );

    const newJobs = result.jobs.filter(
      (job) => !existingSourceIds.has(job.sourceId)
    );

    // UPSERT all jobs in batches
    let upsertedCount = 0;
    const batchSize = 50;

    for (let i = 0; i < result.jobs.length; i += batchSize) {
      const batch = result.jobs.slice(i, i + batchSize);
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

    console.info('[ensure-sync]', {
      fetched: result.jobs.length,
      upserted: upsertedCount,
      newJobs: newJobs.length,
    });

    // Send email alerts for new jobs
    let emailed = 0;
    const signingSecret = process.env.EMAIL_SIGNING_SECRET;

    if (signingSecret && newJobs.length > 0) {
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
