import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ScraperOrchestrator, enrichJobsWithPostedDate, enrichJobsWithDescription, toDbJob } from '@/lib/scrapers';

export const maxDuration = 60; // Vercel Hobby allows up to 60s
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const startTime = Date.now();

  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.error('[scrape-jobs] Unauthorized cron attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const currentHour = new Date().getUTCHours();
    console.log(`[scrape-jobs] Starting scrape at UTC hour ${currentHour} - ${new Date().toISOString()}`);

    const orchestrator = new ScraperOrchestrator();
    const result = await orchestrator.runScrapersForHour(currentHour);

    if (result.jobs.length === 0) {
      console.log('[scrape-jobs] No jobs found');
      return NextResponse.json({
        success: true,
        hour: currentHour,
        stats: result.stats,
        newJobs: 0,
      });
    }

    // Fetch existing source_ids to avoid duplicates
    const sourceIds = result.jobs.map((j) => j.sourceId);

    // Batch check for existing jobs (in chunks of 100 to avoid query limits)
    const existingIds = new Set<string>();
    for (let i = 0; i < sourceIds.length; i += 100) {
      const chunk = sourceIds.slice(i, i + 100);
      const { data: existingJobs } = await supabase
        .from('job_postings')
        .select('source_id')
        .in('source_id', chunk);

      if (existingJobs) {
        existingJobs.forEach((job) => existingIds.add(job.source_id));
      }
    }

    const newJobs = result.jobs.filter((j) => !existingIds.has(j.sourceId));

    console.log(`[scrape-jobs] Found ${newJobs.length} new jobs (${existingIds.size} existing)`);

    const shouldEnrich = process.env.JOB_POSTED_ENRICH !== 'false';
    const { jobs: enrichedNewJobs, stats } = shouldEnrich
      ? await enrichJobsWithPostedDate(newJobs)
      : { jobs: newJobs, stats: null };
    if (stats) {
      console.log('[scrape-jobs] Posted-date enrichment', stats);
    }
    const shouldDescEnrich = process.env.JOB_DESC_ENRICH !== 'false';
    const { jobs: descEnrichedJobs, stats: descStats } = shouldDescEnrich
      ? await enrichJobsWithDescription(enrichedNewJobs)
      : { jobs: enrichedNewJobs, stats: null };
    if (descStats) {
      console.log('[scrape-jobs] Description enrichment', descStats);
    }

    // Batch insert new jobs (in chunks of 50)
    let insertedCount = 0;
    for (let i = 0; i < descEnrichedJobs.length; i += 50) {
      const chunk = descEnrichedJobs.slice(i, i + 50);
      const dbJobs = chunk.map(toDbJob);

      const { error } = await supabase.from('job_postings').insert(dbJobs);

      if (error) {
        console.error(`[scrape-jobs] Insert error:`, error);
      } else {
        insertedCount += chunk.length;
      }
    }

    console.log(`[scrape-jobs] Inserted ${insertedCount} jobs`);

    // Update stats
    result.stats.newJobs = insertedCount;

    const duration = (Date.now() - startTime) / 1000;

    // Log success to scraper_logs table
    try {
      const { error: logError } = await supabase.from('scraper_logs').insert({
        status: 'success',
        scraped: result.jobs.length,
        saved: insertedCount,
        duplicates: existingIds.size,
        duration_seconds: duration,
        sources: result.stats.scrapersRun,
      });
      if (logError) {
        console.error('[scrape-jobs] Failed to log to scraper_logs:', logError);
      } else {
        console.log('[scrape-jobs] Logged success to scraper_logs');
      }
    } catch (logError) {
      console.error('[scrape-jobs] Failed to log to scraper_logs:', logError);
    }

    return NextResponse.json({
      success: true,
      hour: currentHour,
      stats: result.stats,
      scraped: result.jobs.length,
      saved: insertedCount,
      duplicates: existingIds.size,
      duration: `${duration.toFixed(2)}s`,
      sources: result.stats.scrapersRun,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const duration = (Date.now() - startTime) / 1000;
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    const errorStack = err instanceof Error ? err.stack : undefined;

    console.error('[scrape-jobs] Error:', err);

    // Log error to scraper_logs table
    try {
      await supabase.from('scraper_logs').insert({
        status: 'error',
        error_message: errorMessage,
        error_stack: errorStack,
        duration_seconds: duration,
      });
    } catch (logError) {
      console.error('[scrape-jobs] Failed to log error to scraper_logs:', logError);
    }

    return NextResponse.json(
      {
        error: errorMessage,
        duration: `${duration.toFixed(2)}s`,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
