import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ScraperOrchestrator, enrichJobsWithPostedDate, enrichJobsWithDescription } from '@/lib/scrapers';

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
      const existingJobs = await prisma.job_postings.findMany({
        where: { source_id: { in: chunk } },
        select: { source_id: true }
      });

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

    // Batch insert new jobs (using an upsert loop)
    let insertedCount = 0;
    for (const job of descEnrichedJobs) {
      // Map ScrapedJob to the Prisma schema expectation
      const row: any = {
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
      }

      try {
        await prisma.job_postings.upsert({
          where: { source_id: job.sourceId },
          update: row,
          create: row,
        });
        insertedCount++;
      } catch (upsertError) {
        console.error(`[scrape-jobs] Insert error for ${job.sourceId}:`, upsertError);
      }
    }

    console.log(`[scrape-jobs] Inserted ${insertedCount} jobs`);

    // Record daily dashboard snapshot
    try {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      const [usaIntern, usaNewGrad, intlIntern, intlNewGrad] = await Promise.all([
        prisma.job_postings.count({ where: { tags: { hasEvery: ["internship", "usa"] } } }),
        prisma.job_postings.count({ where: { tags: { hasEvery: ["new-grad", "usa"] } } }),
        prisma.job_postings.count({ where: { tags: { hasEvery: ["internship", "international"] } } }),
        prisma.job_postings.count({ where: { tags: { hasEvery: ["new-grad", "international"] } } }),
      ]);

      // Skip snapshot if all counts are zero (scraper hasn't populated jobs yet)
      if (usaIntern + usaNewGrad + intlIntern + intlNewGrad === 0) {
        console.warn("Skipping dashboard snapshot: all counts are zero");
      } else {
      await prisma.dashboardSnapshot.upsert({
        where: { date: today },
        update: {
          usa_internships: usaIntern,
          usa_new_grad: usaNewGrad,
          intl_internships: intlIntern,
          intl_new_grad: intlNewGrad,
        },
        create: {
          date: today,
          usa_internships: usaIntern,
          usa_new_grad: usaNewGrad,
          intl_internships: intlIntern,
          intl_new_grad: intlNewGrad,
        },
      });
      }
    } catch (snapErr) {
      console.error("Dashboard snapshot failed:", snapErr);
    }

    // Update stats
    result.stats.newJobs = insertedCount;

    const duration = (Date.now() - startTime) / 1000;

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

    console.error('[scrape-jobs] Error:', err);

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
