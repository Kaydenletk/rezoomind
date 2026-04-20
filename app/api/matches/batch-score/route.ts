import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { batchMatchJobs } from "@/lib/matching/batch-match";
import { generateEmbedding } from "@/lib/ai/embeddings";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const MAX_BATCH = 80;

interface BatchScoreDetails {
  skillMatch: number;
  experienceMatch: number;
  reasons: string[];
  missingSkills: string[];
}

function emptyResponse() {
  return NextResponse.json({ ok: true, scores: {}, details: {} });
}

function clampScore(n: number): number {
  const rounded = Math.round(n);
  if (rounded < 0) return 0;
  if (rounded > 100) return 100;
  return rounded;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const body = await request.json().catch(() => null);
    const rawIds = Array.isArray(body?.jobIds) ? body.jobIds : null;
    if (!rawIds || rawIds.length === 0) return emptyResponse();

    const jobIds: string[] = rawIds
      .filter((id: unknown): id is string => typeof id === "string" && id.length > 0)
      .slice(0, MAX_BATCH);
    if (jobIds.length === 0) return emptyResponse();

    const resume = await prisma.resume.findUnique({
      where: { userId },
      select: { resume_text: true, embedding: true },
    });
    if (!resume?.resume_text) return emptyResponse();

    const jobs = await prisma.job_postings.findMany({
      where: { id: { in: jobIds }, description: { not: null } },
      select: {
        id: true,
        source_id: true,
        company: true,
        role: true,
        location: true,
        description: true,
        tags: true,
        embedding: true,
      },
    });
    if (jobs.length === 0) return emptyResponse();

    let embedding = resume.embedding;
    if (!embedding || embedding.length === 0) {
      embedding = await generateEmbedding(resume.resume_text);
      await prisma.resume.update({ where: { userId }, data: { embedding } });
    }

    const { results, generatedEmbeddings } = await batchMatchJobs(
      { text: resume.resume_text, embedding },
      jobs.map((j) => ({
        ...j,
        tags: j.tags ?? [],
        embedding: j.embedding ?? [],
      })),
    );

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

    const scores: Record<string, number> = {};
    const details: Record<string, BatchScoreDetails> = {};
    for (const r of results) {
      scores[r.jobId] = clampScore(r.overallScore);
      details[r.jobId] = {
        skillMatch: clampScore(r.skillMatch),
        experienceMatch: clampScore(r.experienceMatch),
        reasons: r.reasons ?? [],
        missingSkills: r.missingSkills ?? [],
      };
    }

    return NextResponse.json({ ok: true, scores, details });
  } catch (error) {
    console.error("[batch-score] error:", error);
    return emptyResponse();
  }
}
