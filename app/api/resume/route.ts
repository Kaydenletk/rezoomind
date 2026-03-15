import { NextResponse } from "next/server";
import { z } from "zod";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { parseResumeFromUrl } from "@/lib/resume/parse-resume";
import { getResumeKeywords, rankJobMatches } from "@/lib/job-matching-resume";

const resumeSchema = z.object({
  resumeText: z.string().optional().nullable(),
  fileUrl: z.string().optional().nullable(),
});

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const data = await prisma.resume.findUnique({
      where: { userId },
      select: { resume_text: true, file_url: true, created_at: true }
    });

    return NextResponse.json({ ok: true, resume: data ?? null });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = resumeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid resume payload" }, { status: 400 });
  }

  const resumeText = parsed.data.resumeText?.trim() || null;
  const fileUrl = parsed.data.fileUrl?.trim() || null;

  if (!resumeText && !fileUrl) {
    return NextResponse.json(
      { ok: false, error: "Provide a resume PDF or paste your resume text." },
      { status: 400 }
    );
  }

  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  let parsedText: string | null = null;
  let parsedAt: string | null = null;

  if (fileUrl) {
    try {
      // NOTE: For local dev, this would need to point to a publicly accessible URL,
      // or we'd just pass the raw buffer if uploaded locally.
      const parsedResume = await parseResumeFromUrl(fileUrl);
      parsedText = parsedResume.text;
      parsedAt = new Date().toISOString();
    } catch (error) {
      if (!resumeText) {
        const message = error instanceof Error ? error.message : "Unable to parse resume file.";
        return NextResponse.json({ ok: false, error: message }, { status: 400 });
      }
    }
  }

  const finalResumeText = parsedText ?? resumeText;
  if (!finalResumeText) {
    return NextResponse.json(
      { ok: false, error: "Provide a resume PDF/DOCX or paste your resume text." },
      { status: 400 }
    );
  }

  const resumeKeywords = getResumeKeywords(finalResumeText, null);

  let data;
  try {
    data = await prisma.resume.upsert({
      where: { userId },
      update: {
        resume_text: finalResumeText,
        file_url: fileUrl,
        resume_keywords: resumeKeywords,
        parsed_at: parsedAt,
      },
      create: {
        userId,
        resume_text: finalResumeText,
        file_url: fileUrl,
        resume_keywords: resumeKeywords,
        parsed_at: parsedAt,
      }
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  try {
    const preferences = await prisma.interest.findUnique({
      where: { userId },
      select: { roles: true, locations: true, keywords: true }
    });

    const jobs = await prisma.job_postings.findMany({
      select: { id: true, role: true, company: true, location: true, url: true, tags: true, description: true },
      orderBy: [{ date_posted: "desc" }, { created_at: "desc" }],
      take: 2000
    });

    const prefs = preferences ? {
      interested_roles: preferences.roles,
      preferred_locations: preferences.locations,
      keywords: preferences.keywords,
    } : {
      interested_roles: [],
      preferred_locations: [],
      keywords: [],
    };

    const matches = rankJobMatches(
      (jobs ?? []) as {
        id: string;
        role: string;
        company: string;
        location: string | null;
        url: string | null;
        tags: string[] | null;
        description: string | null;
        job_keywords?: string[] | null;
      }[],
      resumeKeywords,
      {
        roles: prefs.interested_roles ?? [],
        locations: prefs.preferred_locations ?? [],
        keywords: prefs.keywords ?? [],
      },
      30
    );

    const now = new Date().toISOString();

    // Skipping Job Match Persistence since job_matches model wasn't ported yet.

  } catch {
    // Ignore matching errors to avoid blocking resume saves
  }

  return NextResponse.json({ ok: true, resume: data });
}
