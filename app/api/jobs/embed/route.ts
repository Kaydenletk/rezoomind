import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateEmbeddingsBatch } from '@/lib/ai/embeddings';
import { extractKeywords } from '@/lib/matching/keywords';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minute timeout for batch processing

/**
 * POST /api/jobs/embed
 * Batch-generates embeddings for job postings that don't have them yet.
 * Protected by JOBS_SYNC_SECRET for admin/cron use.
 */
export async function POST(request: Request) {
     try {
          // Auth check
          const { searchParams } = new URL(request.url);
          const secret = searchParams.get('secret') || request.headers.get('authorization')?.replace('Bearer ', '');

          if (secret !== process.env.JOBS_SYNC_SECRET) {
               return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
          }

          const body = await request.json().catch(() => ({}));
          const limit = Math.min(body.limit || 50, 200);

          // Find jobs missing embeddings (that have descriptions)
          const jobs = await prisma.job_postings.findMany({
               where: {
                    embedding: { equals: [] },
                    description: { not: null },
               },
               select: {
                    id: true,
                    company: true,
                    role: true,
                    description: true,
                    location: true,
                    tags: true,
               },
               take: limit,
               orderBy: { created_at: 'desc' },
          });

          if (jobs.length === 0) {
               return NextResponse.json({
                    ok: true,
                    message: 'No jobs need embedding',
                    processed: 0,
               });
          }

          console.log(`[jobs/embed] Processing ${jobs.length} jobs...`);

          // Build text for each job
          const texts = jobs.map((job) =>
               [job.role, job.company, job.description, job.location, ...(job.tags || [])]
                    .filter(Boolean)
                    .join(' ')
          );

          // Generate embeddings in batch
          const embeddings = await generateEmbeddingsBatch(texts);

          // Update each job with its embedding and extracted keywords
          let updated = 0;
          for (let i = 0; i < jobs.length; i++) {
               const job = jobs[i];
               const embedding = embeddings[i];
               if (!embedding) continue;

               // Also extract keywords if missing
               const jobKeywords = extractKeywords(
                    [job.role, job.description, ...(job.tags || [])].filter(Boolean).join(' '),
                    120
               );

               await prisma.job_postings.update({
                    where: { id: job.id },
                    data: {
                         embedding,
                         job_keywords: jobKeywords,
                    },
               });
               updated++;
          }

          console.log(`[jobs/embed] Updated ${updated}/${jobs.length} jobs`);

          return NextResponse.json({
               ok: true,
               processed: updated,
               total: jobs.length,
          });
     } catch (error: any) {
          console.error('[jobs/embed] Error:', error);
          return NextResponse.json(
               { ok: false, error: error.message || 'Failed to generate embeddings' },
               { status: 500 }
          );
     }
}
