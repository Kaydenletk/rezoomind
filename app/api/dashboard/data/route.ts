import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { batchMatchJobs } from "@/lib/matching/batch-match";
import { generateEmbedding } from "@/lib/ai/embeddings";

export const dynamic = "force-dynamic";
export const maxDuration = 10;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    // 1. Fetch user's resume
    const resume = await prisma.resume.findUnique({
      where: { userId },
      select: { resume_text: true, embedding: true, resume_keywords: true },
    });

    // 2. Fetch recent jobs (with descriptions)
    const jobs = await prisma.job_postings.findMany({
      where: { description: { not: null } },
      orderBy: [{ date_posted: "desc" }, { created_at: "desc" }],
      take: 100,
      select: {
        id: true,
        source_id: true,
        company: true,
        role: true,
        location: true,
        url: true,
        description: true,
        tags: true,
        embedding: true,
        date_posted: true,
        created_at: true,
        salary_min: true,
        salary_max: true,
        salary_interval: true,
      },
    });

    // 3. If no resume, return jobs without scores
    if (!resume?.resume_text) {
      return NextResponse.json({
        ok: true,
        hasResume: false,
        matchRows: jobs.slice(0, 50).map((j) => ({
          match_score: null,
          skills_match: null,
          experience_match: null,
          match_reasons: null,
          missing_skills: null,
          is_saved: false,
          is_applied: false,
          job_postings: j,
        })),
      });
    }

    // 4. Ensure resume has embedding (lazy generation)
    let embedding = resume.embedding;
    if (!embedding || embedding.length === 0) {
      embedding = await generateEmbedding(resume.resume_text);
      await prisma.resume.update({
        where: { userId },
        data: { embedding },
      });
    }

    // 5. Batch match
    const { results: matches, generatedEmbeddings } = await batchMatchJobs(
      { text: resume.resume_text, embedding },
      jobs.map((j) => ({
        ...j,
        tags: j.tags ?? [],
        embedding: j.embedding ?? [],
      })),
    );

    // 6. Persist any newly generated job embeddings (fire-and-forget)
    if (generatedEmbeddings.length > 0) {
      Promise.allSettled(
        generatedEmbeddings.map((ge) =>
          prisma.job_postings.update({
            where: { id: ge.jobId },
            data: { embedding: ge.embedding },
          }),
        ),
      ).catch(() => {});
    }

    // 7. Build response — map matches back to job data
    const jobMap = new Map(jobs.map((j) => [j.id, j]));
    const matchRows = matches.slice(0, 50).map((m) => ({
      match_score: m.overallScore,
      skills_match: m.skillMatch,
      experience_match: m.experienceMatch,
      match_reasons: m.reasons,
      missing_skills: m.missingSkills,
      is_saved: false,
      is_applied: false,
      job_postings: jobMap.get(m.jobId) ?? null,
    }));

    return NextResponse.json({ ok: true, hasResume: true, matchRows });
  } catch (error: any) {
    console.error("[dashboard/data] Error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
