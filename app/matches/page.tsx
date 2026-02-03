import { redirect } from "next/navigation";

import { Card } from "@/components/ui/Card";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type JobPosting = {
  id: string;
  role: string;
  company: string;
  location: string | null;
  url: string | null;
  tags: string[] | null;
  date_posted: string | null;
  created_at: string;
};

type JobMatchRow = {
  match_score: number | null;
  match_reasons: string[] | null;
  job_postings: JobPosting | null;
};

export default async function MatchesPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/matches");
  }

  const [{ data: resume }, { data: preferences }, { data: matches }] = await Promise.all([
    supabase
      .from("resumes")
      .select("resume_text,resume_keywords,file_url")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("user_job_preferences")
      .select("interested_roles,preferred_locations,keywords")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("job_matches")
      .select(
        "match_score,match_reasons,job_postings(id,role,company,location,url,tags,date_posted,created_at)"
      )
      .eq("user_id", user.id)
      .gt("match_score", 0)
      .order("match_score", { ascending: false })
      .limit(20),
  ]);

  const typedResume = resume as {
    resume_text: string | null;
    resume_keywords: string[] | null;
    file_url: string | null;
  } | null;

  const typedPreferences = preferences as {
    interested_roles: string[] | null;
    preferred_locations: string[] | null;
    keywords: string[] | null;
  } | null;

  const typedMatches = (matches ?? []) as JobMatchRow[];

  const needsProfile =
    !typedResume?.resume_text &&
    !typedResume?.resume_keywords?.length &&
    !typedResume?.file_url &&
    !typedPreferences?.keywords?.length &&
    !typedPreferences?.interested_roles?.length &&
    !typedPreferences?.preferred_locations?.length;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-20">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">Matches</h1>
        <p className="mt-2 text-sm text-slate-600">
          Top roles based on your resume and preferences.
        </p>
      </div>

      {needsProfile ? (
        <Card>
          <h2 className="text-lg font-semibold text-slate-900">Add your signals</h2>
          <p className="mt-2 text-sm text-slate-600">
            Upload a resume or set preferences to see personalized matches.
          </p>
        </Card>
      ) : null}

      {typedMatches.length === 0 ? (
        <Card>
          <h2 className="text-lg font-semibold text-slate-900">No matches yet</h2>
          <p className="mt-2 text-sm text-slate-600">
            Add more keywords or roles, or upload a stronger resume.
          </p>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {typedMatches.map((match) => {
            const job = match.job_postings;
            if (!job) return null;
            const score = match.match_score ?? 0;
            const reasons = match.match_reasons ?? [];
            return (
            <Card key={job.id} highlighted={score >= 70}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">{job.role}</h2>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
                  {score}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                {job.company ?? "Unknown company"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {job.location ?? "Location flexible"}
              </p>
              {reasons.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {reasons.slice(0, 3).map((reason) => (
                    <span
                      key={`${job.id}-${reason}`}
                      className="rounded-full border border-slate-200 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500"
                    >
                      {reason}
                    </span>
                  ))}
                </div>
              ) : job.tags?.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {job.tags.slice(0, 6).map((tag) => (
                    <span
                      key={`${job.id}-${tag}`}
                      className="rounded-full border border-slate-200 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
              {job.url ? (
                <a
                  href={job.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex text-xs font-semibold uppercase tracking-[0.2em] text-brand hover:text-brand-hover"
                >
                  View posting
                </a>
              ) : null}
            </Card>
          )})}
        </div>
      )}
    </div>
  );
}
