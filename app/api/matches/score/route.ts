import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateEmbedding } from '@/lib/ai/embeddings';
import { computeVectorMatchScore } from '@/lib/matching/vector-matching';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
     const session = await getServerSession(authOptions);

     if (!session?.user) {
          return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
     }

     const userId = session.user.id;

     try {
          const { jobId } = await request.json();

          if (!jobId) {
               return NextResponse.json(
                    { ok: false, error: 'jobId is required' },
                    { status: 400 }
               );
          }

          // Fetch user's resume
          const resume = await prisma.resume.findUnique({
               where: { userId },
               select: { resume_text: true, embedding: true },
          });

          if (!resume?.resume_text) {
               return NextResponse.json(
                    { ok: false, error: 'No resume uploaded. Please upload your resume first.' },
                    { status: 400 }
               );
          }

          // Fetch job posting
          const job = await prisma.job_postings.findUnique({
               where: jobId.includes("|") ? { source_id: jobId } : { id: jobId },
               select: {
                    id: true,
                    source_id: true,
                    company: true,
                    role: true,
                    description: true,
                    embedding: true,
                    tags: true,
                    location: true,
               },
          });

          if (!job) {
               return NextResponse.json(
                    { ok: false, error: 'Job not found' },
                    { status: 404 }
               );
          }

          // Generate embeddings if not cached
          let resumeEmbedding = resume.embedding;
          if (!resumeEmbedding || resumeEmbedding.length === 0) {
               resumeEmbedding = await generateEmbedding(resume.resume_text);
               // Cache the embedding
               await prisma.resume.update({
                    where: { userId },
                    data: { embedding: resumeEmbedding },
               });
          }

          const jobText = [job.role, job.company, job.description, job.location, ...(job.tags || [])]
               .filter(Boolean)
               .join(' ');

          let jobEmbedding = job.embedding;
          if (!jobEmbedding || jobEmbedding.length === 0) {
               jobEmbedding = await generateEmbedding(jobText);
               // Cache the embedding
               await prisma.job_postings.update({
                    where: { id: jobId },
                    data: { embedding: jobEmbedding },
               });
          }

          // Compute match score
          const result = computeVectorMatchScore(
               resumeEmbedding,
               jobEmbedding,
               resume.resume_text,
               job.description || jobText
          );

          const missingSkills =
               result.reasons
                    .find((reason) => reason.startsWith("Missing skills:"))
                    ?.replace("Missing skills:", "")
                    .split(",")
                    .map((skill) => skill.trim())
                    .filter(Boolean) ?? [];

          return NextResponse.json({
               ok: true,
               jobId: job.id,
               jobSourceId: job.source_id,
               company: job.company,
               role: job.role,
               skillMatch: result.skillMatch,
               experienceMatch: result.experienceMatch,
               overallScore: result.overallScore,
               reasons: result.reasons,
               missingSkills,
               scoreSource: "ai",
          });
     } catch (error: unknown) {
          console.error('[api/matches/score] POST error:', error);
          return NextResponse.json(
               { ok: false, error: error instanceof Error ? error.message : 'Failed to compute match score' },
               { status: 500 }
          );
     }
}
