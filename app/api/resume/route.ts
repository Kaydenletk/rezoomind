import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseResumeFromStorage } from "@/lib/resume/parse-resume";
import { getResumeKeywords, rankJobMatches } from "@/lib/job-matching-resume";
import { ensureInternshipsInJobPostings } from "@/lib/jobs/ensure-internships";

const resumeSchema = z.object({
  resumeText: z.string().optional().nullable(),
  fileUrl: z.string().optional().nullable(),
});

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("resumes")
    .select("resume_text,file_url,created_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, resume: data ?? null });
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

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let parsedText: string | null = null;
  let parsedAt: string | null = null;

  if (fileUrl) {
    try {
      const parsedResume = await parseResumeFromStorage(supabase, fileUrl);
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

  const { data, error } = await supabase
    .from("resumes")
    .upsert(
      {
        user_id: user.id,
        resume_text: finalResumeText,
        file_url: fileUrl,
        resume_keywords: resumeKeywords,
        parsed_at: parsedAt,
      },
      { onConflict: "user_id" }
    )
    .select("resume_text,file_url,resume_keywords,parsed_at,created_at")
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  try {
    await ensureInternshipsInJobPostings(supabase);
  } catch {
    // Ignore ingestion errors
  }

  try {
    const [{ data: preferences }, { data: jobs }] = await Promise.all([
      supabase
        .from("user_job_preferences")
        .select("interested_roles,preferred_locations,keywords")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("job_postings")
        .select("id,role,company,location,url,tags,description,job_keywords")
        .order("date_posted", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(2000),
    ]);

    const prefs = preferences ?? {
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

    await supabase
      .from("job_matches")
      .update({ match_score: 0, match_reasons: [], matched_at: now })
      .eq("user_id", user.id);

    if (matches.length > 0) {
      const payload = matches.map((match) => ({
        user_id: user.id,
        job_id: match.jobId,
        match_score: match.score,
        match_reasons: match.reasons,
        matched_at: now,
      }));
      await supabase.from("job_matches").upsert(payload, { onConflict: "user_id,job_id" });
    }
  } catch {
    // Ignore matching errors to avoid blocking resume saves
  }

  return NextResponse.json({ ok: true, resume: data });
}
