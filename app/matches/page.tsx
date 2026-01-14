import { redirect } from "next/navigation";

import { Card } from "@/components/ui/Card";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Internship = {
  id: string;
  title: string;
  company: string | null;
  location: string | null;
  url: string | null;
  tags: string[] | null;
  created_at: string;
};

type Interests = {
  roles: string[] | null;
  locations: string[] | null;
  keywords: string[] | null;
  grad_year: number | null;
};

const roleKeywordMap: Record<string, string[]> = {
  SWE: ["software", "engineer", "swe", "frontend", "backend", "full stack"],
  Data: ["data", "analytics", "ml", "machine learning", "ai"],
  DevOps: ["devops", "infrastructure", "sre", "cloud", "platform"],
  Cyber: ["security", "cyber", "infosec", "soc", "risk"],
};

const toKeywords = (text: string) =>
  text
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .filter((token) => token.length > 2);

const uniqueList = (items: string[]) => Array.from(new Set(items));

const overlapCount = (source: string[], targetSet: Set<string>) =>
  source.reduce((count, item) => (targetSet.has(item) ? count + 1 : count), 0);

export default async function MatchesPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/matches");
  }

  const [{ data: resume }, { data: interests }, { data: internships }] = await Promise.all([
    supabase
      .from("resumes")
      .select("resume_text,file_url")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("interests")
      .select("roles,locations,keywords,grad_year")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase.from("internships").select("id,title,company,location,url,tags,created_at"),
  ]);

  const typedResume = resume as { resume_text: string | null; file_url: string | null } | null;
  const typedInterests = interests as Interests | null;
  const typedInternships = internships as Internship[] | null;

  const interestKeywords = uniqueList(
    (typedInterests?.keywords ?? []).map((value) => value.toLowerCase())
  );
  const resumeKeywords = typedResume?.resume_text
    ? uniqueList(toKeywords(typedResume.resume_text))
    : [];
  const keywordSet = new Set([...interestKeywords, ...resumeKeywords]);
  const roleKeywords = uniqueList(
    (typedInterests?.roles ?? []).flatMap((role) => roleKeywordMap[role] ?? [])
  );
  const locationPreferences = (typedInterests?.locations ?? []).map((value) =>
    value.toLowerCase()
  );

  const scored = (typedInternships ?? []).map((internship) => {
    const tags = (internship.tags ?? []).map((tag) => tag.toLowerCase());
    const title = internship.title.toLowerCase();
    const location = internship.location?.toLowerCase() ?? "";

    let score = overlapCount(tags, keywordSet);
    score += overlapCount(toKeywords(title), keywordSet);

    if (roleKeywords.some((keyword) => title.includes(keyword) || tags.includes(keyword))) {
      score += 3;
    }

    if (locationPreferences.some((place) => place && location.includes(place))) {
      score += 2;
    }

    return { internship, score };
  });

  const ranked = scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  const needsProfile =
    !resume?.resume_text && !resume?.file_url && (!interests || !interests.keywords?.length);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-20">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">Matches</h1>
        <p className="mt-2 text-sm text-slate-600">
          Top internships based on your resume and interests.
        </p>
      </div>

      {needsProfile ? (
        <Card>
          <h2 className="text-lg font-semibold text-slate-900">Add your signals</h2>
          <p className="mt-2 text-sm text-slate-600">
            Upload a resume or set interests to see personalized matches.
          </p>
        </Card>
      ) : null}

      {ranked.length === 0 ? (
        <Card>
          <h2 className="text-lg font-semibold text-slate-900">No matches yet</h2>
          <p className="mt-2 text-sm text-slate-600">
            Add more keywords or roles, or seed internships in the database.
          </p>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {ranked.map(({ internship, score }) => (
            <Card key={internship.id} highlighted={score >= 5}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">{internship.title}</h2>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgb(var(--brand-rgb))]">
                  {score} pts
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                {internship.company ?? "Unknown company"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {internship.location ?? "Location flexible"}
              </p>
              {internship.tags?.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {internship.tags.slice(0, 6).map((tag) => (
                    <span
                      key={`${internship.id}-${tag}`}
                      className="rounded-full border border-slate-200 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
              {internship.url ? (
                <a
                  href={internship.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex text-xs font-semibold uppercase tracking-[0.2em] text-[rgb(var(--brand-rgb))] hover:text-[rgb(var(--brand-hover-rgb))]"
                >
                  View posting
                </a>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
