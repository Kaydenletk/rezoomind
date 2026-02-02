import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * GET /api/jobs/ensure-sync
 * Triggers a non-destructive UPSERT sync from GitHub.
 *
 * - Default (no params): only syncs when DB has 0 jobs (backward compat)
 * - ?force=true: always syncs, but with a 5-minute cooldown to avoid hammering GitHub
 *
 * Called by the jobs page on load for background refresh.
 */
export async function GET(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Use anon key for reads (ensure-sync only does SELECT queries)
  // Service role key may be invalid, and anon key works fine with public SELECT policy
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const syncSecret = process.env.JOBS_SYNC_SECRET;

  if (!url || !key) {
    return NextResponse.json(
      { ok: false, error: 'Server not configured for jobs' },
      { status: 503 }
    );
  }

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { searchParams } = new URL(request.url);
  const force = searchParams.get('force') === 'true';

  try {
    const { count, error: countError } = await supabase
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

    // Cooldown: if force=true but last sync was within 5 minutes, skip
    if (force && jobCount > 0) {
      const { data: latest } = await supabase
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

    if (!syncSecret) {
      console.warn('[ensure-sync] JOBS_SYNC_SECRET not set, cannot trigger sync');
      return NextResponse.json({
        ok: true,
        triggered: false,
        count: jobCount,
        message: 'Sync not configured. Set JOBS_SYNC_SECRET for automatic fetch.',
      });
    }

    // Trigger sync by calling our own sync API (same origin)
    const base =
      process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

    const syncUrl = `${base}/api/jobs/sync`;
    console.log('[ensure-sync] Triggering sync...', syncUrl);

    const response = await fetch(syncUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-sync-secret': syncSecret,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[ensure-sync] Sync failed:', result);
      return NextResponse.json({
        ok: false,
        triggered: true,
        error: result.error ?? 'Sync failed',
      }, { status: 502 });
    }

    return NextResponse.json({
      ok: true,
      triggered: true,
      count: result.upserted ?? result.fetched ?? 0,
      fetched: result.fetched ?? 0,
      lastSync: new Date().toISOString(),
      message: `Sync completed. Fetched ${result.fetched ?? 0} jobs, upserted ${result.upserted ?? 0}.`,
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
