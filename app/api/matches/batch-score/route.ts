import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateGeminiJson, hasGeminiKey } from "@/lib/ai/client";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

interface JobInput {
  company: string;
  role: string;
  location: string;
  category: string;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const body = await request.json().catch(() => null);
    if (!body?.jobs || !Array.isArray(body.jobs) || body.jobs.length === 0) {
      return NextResponse.json({ ok: true, scores: {} });
    }

    const jobs: JobInput[] = body.jobs.slice(0, 80);

    // Fetch resume
    const resume = await prisma.resume.findUnique({
      where: { userId },
      select: { resume_text: true },
    });

    if (!resume?.resume_text) {
      return NextResponse.json({ ok: true, scores: {} });
    }

    if (!hasGeminiKey()) {
      return NextResponse.json({ ok: true, scores: {} });
    }

    // Build job list for prompt
    const jobLines = jobs
      .map((j, i) => `${i + 1} | ${j.company} | ${j.role} | ${j.location} | ${j.category}`)
      .join("\n");

    const resumeText = resume.resume_text.slice(0, 4000);

    const prompt = `Given this candidate's resume and a list of internship/new-grad openings, score each job 0-100 for how well the resume matches.

Scoring criteria:
- Technical skill alignment (frameworks, languages, tools mentioned or implied by the role)
- Role type fit (backend/frontend/fullstack/ML/data vs candidate experience)
- Industry relevance
- Experience level appropriateness

Be realistic: most relevant jobs score 50-80. Only perfect matches score 85+. Completely unrelated roles score below 30.

Resume:
---
${resumeText}
---

Jobs (format: number | company | role | location | category):
${jobLines}

Return a JSON array: [{"i":1,"s":72},{"i":2,"s":65},...]
Where "i" is the job number and "s" is the score 0-100.`;

    const results = await generateGeminiJson<Array<{ i: number; s: number }>>({
      prompt,
      systemPrompt:
        "You are an expert ATS recruiter. Score job-resume matches accurately. Return only the JSON array requested.",
      temperature: 0,
      maxOutputTokens: 2048,
    });

    // Map results to composite keys
    const scores: Record<string, number> = {};
    if (Array.isArray(results)) {
      for (const { i, s } of results) {
        const job = jobs[i - 1]; // 1-indexed
        if (!job) continue;
        const key = `${job.company.toLowerCase().trim()}|${job.role.toLowerCase().trim()}`;
        scores[key] = Math.max(0, Math.min(100, Math.round(s)));
      }
    }

    return NextResponse.json({ ok: true, scores });
  } catch (error: any) {
    console.error("[batch-score] error:", error);
    return NextResponse.json({ ok: true, scores: {} });
  }
}
