import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { ensureInternshipsInJobPostings } from "@/lib/jobs/ensure-internships";
import { getResumeKeywords, rankJobMatches } from "@/lib/job-matching-resume";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    await ensureInternshipsInJobPostings(supabase);

    const [{ data: jobs }, { data: resumes }, { data: preferences }] = await Promise.all([
      supabase
        .from("job_postings")
        .select("id,role,company,location,url,tags,description,job_keywords,date_posted,created_at")
        .order("date_posted", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(3000),
      supabase
        .from("resumes")
        .select("user_id,resume_text,resume_keywords")
        .or("resume_text.not.is.null,resume_keywords.not.is.null"),
      supabase
        .from("user_job_preferences")
        .select("user_id,interested_roles,preferred_locations,keywords"),
    ]);

    const jobsList =
      (jobs ?? []) as {
        id: string;
        role: string;
        company: string;
        location: string | null;
        url: string | null;
        tags: string[] | null;
        description: string | null;
        job_keywords?: string[] | null;
      }[];

    const prefsMap = new Map(
      (preferences ?? []).map((pref) => [
        pref.user_id,
        {
          roles: pref.interested_roles ?? [],
          locations: pref.preferred_locations ?? [],
          keywords: pref.keywords ?? [],
        },
      ])
    );

    let usersProcessed = 0;
    let matchesStored = 0;

    for (const resume of resumes ?? []) {
      const resumeKeywords = getResumeKeywords(
        resume.resume_text ?? null,
        resume.resume_keywords ?? null
      );

      const prefs = prefsMap.get(resume.user_id) ?? {
        roles: [],
        locations: [],
        keywords: [],
      };

      if (
        resumeKeywords.length === 0 &&
        prefs.roles.length === 0 &&
        prefs.locations.length === 0 &&
        prefs.keywords.length === 0
      ) {
        continue;
      }

      const matches = rankJobMatches(jobsList, resumeKeywords, prefs, 30);
      const now = new Date().toISOString();

      await supabase
        .from("job_matches")
        .update({ match_score: 0, match_reasons: [], matched_at: now })
        .eq("user_id", resume.user_id);

      if (matches.length > 0) {
        const payload = matches.map((match) => ({
          user_id: resume.user_id,
          job_id: match.jobId,
          match_score: match.score,
          match_reasons: match.reasons,
          matched_at: now,
        }));

        const { error } = await supabase
          .from("job_matches")
          .upsert(payload, { onConflict: "user_id,job_id" });
        if (!error) {
          matchesStored += payload.length;
        }
      }

      usersProcessed += 1;
    }

    return NextResponse.json({
      ok: true,
      usersProcessed,
      matchesStored,
      jobsScanned: jobsList.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
