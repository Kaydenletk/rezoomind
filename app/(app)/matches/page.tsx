import { redirect } from "next/navigation";

import { Card } from "@/components/ui/Card";

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
  const { getServerSession } = await import("next-auth");
  const { authOptions } = await import("@/lib/auth");

  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user) {
    redirect("/login?next=/matches");
  }

  // Assuming you create a local lib function to fetch this data later, 
  // For now, we fetch from our new absolute route or we can just query Prisma directly here.
  // Querying Prisma directly in a Server Component is standard Next.js 13+ practice:
  const { prisma } = await import("@/lib/prisma");
  const userId = (user as any).id;

  // Temporary mock data as models don't exist yet
  const resume = null;
  const preferencesData = await prisma.interest.findUnique({
    where: { userId },
    select: { roles: true, locations: true, keywords: true }
  });
  const preferences = preferencesData ? {
    interested_roles: preferencesData.roles,
    preferred_locations: preferencesData.locations,
    keywords: preferencesData.keywords
  } : null;
  const matches: any[] = [];

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
        <h1 className="text-3xl font-semibold font-mono text-stone-100 sm:text-4xl">Matches</h1>
        <p className="mt-2 text-sm text-stone-400">
          Top roles based on your resume and preferences.
        </p>
      </div>

      {needsProfile ? (
        <Card>
          <h2 className="text-lg font-semibold text-stone-100">Add your signals</h2>
          <p className="mt-2 text-sm text-stone-400">
            Upload a resume or set preferences to see personalized matches.
          </p>
        </Card>
      ) : null}

      {typedMatches.length === 0 ? (
        <Card>
          <h2 className="text-lg font-semibold text-stone-100">No matches yet</h2>
          <p className="mt-2 text-sm text-stone-400">
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
                  <h2 className="text-lg font-semibold text-stone-100">{job.role}</h2>
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
                    {score}
                  </span>
                </div>
                <p className="mt-2 text-sm text-stone-400">
                  {job.company ?? "Unknown company"}
                </p>
                <p className="mt-1 text-xs text-stone-500">
                  {job.location ?? "Location flexible"}
                </p>
                {reasons.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {reasons.slice(0, 3).map((reason) => (
                      <span
                        key={`${job.id}-${reason}`}
                        className="border border-stone-800 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500"
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
                        className="border border-stone-800 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500"
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
            )
          })}
        </div>
      )}
    </div>
  );
}
