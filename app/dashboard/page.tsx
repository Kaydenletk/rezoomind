"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import Link from "next/link";

interface UserProgress {
  hasResume: boolean;
  hasAnalyzed: boolean;
  hasImproved: boolean;
  resumeScore: number | null;
}

interface UserStats {
  resumesCreated: number;
  analysesRun: number;
  avgScore: number;
  daysActive: number;
}

interface JobPosting {
  id: string;
  role: string;
  company: string;
  location: string | null;
  url: string | null;
  tags: string[] | null;
  date_posted: string | null;
  created_at: string;
}

interface JobMatchRow {
  match_score: number | null;
  match_reasons: string[] | null;
  is_saved: boolean | null;
  is_applied: boolean | null;
  job_postings: JobPosting | null;
}

interface UserJobPreferences {
  interested_roles: string[] | null;
  preferred_locations: string[] | null;
  keywords: string[] | null;
}

const getRelativeTime = (dateStr?: string | null) => {
  if (!dateStr) return "Recently";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "Recently";
  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return diffDays === 1 ? "1 day ago" : `${diffDays} days ago`;
};

const normalizeFilterValue = (value: string) => value.trim().toLowerCase();

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ email?: string; created_at?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<UserProgress>({
    hasResume: false,
    hasAnalyzed: false,
    hasImproved: false,
    resumeScore: null,
  });
  const [stats, setStats] = useState<UserStats>({
    resumesCreated: 0,
    analysesRun: 0,
    avgScore: 0,
    daysActive: 0,
  });
  const [matches, setMatches] = useState<JobMatchRow[]>([]);
  const [preferences, setPreferences] = useState<UserJobPreferences | null>(null);
  const [activeTab, setActiveTab] = useState<"recommended" | "saved" | "applied">("recommended");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const supabase = createSupabaseBrowserClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login?next=/dashboard");
      return;
    }

    setUser(user);

    const [{ data: resumes }, { data: preferences }, { data: matchRows }] = await Promise.all([
      supabase
        .from("resumes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("user_job_preferences")
        .select("interested_roles,preferred_locations,keywords")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("job_matches")
        .select(
          "match_score,match_reasons,is_saved,is_applied,job_postings(id,role,company,location,url,tags,date_posted,created_at)"
        )
        .eq("user_id", user.id)
        .order("match_score", { ascending: false })
        .limit(200),
    ]);

    if (resumes && resumes.length > 0) {
      setProgress({
        hasResume: true,
        hasAnalyzed: resumes.some((r) => r.analysis !== null),
        hasImproved: resumes.some((r) => r.improved_text !== null),
        resumeScore: resumes[0]?.score || null,
      });

      const scores = resumes.filter((r) => r.score).map((r) => r.score as number);
      const avgScore =
        scores.length > 0
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : 0;

      setStats({
        resumesCreated: resumes.length,
        analysesRun: resumes.filter((r) => r.analysis).length,
        avgScore,
        daysActive: Math.ceil(
          (Date.now() - new Date(user.created_at || Date.now()).getTime()) /
            (1000 * 60 * 60 * 24)
        ),
      });
    } else {
      setStats((prev) => ({
        ...prev,
        daysActive: Math.ceil(
          (Date.now() - new Date(user.created_at || Date.now()).getTime()) /
            (1000 * 60 * 60 * 24)
        ),
      }));
    }

    setPreferences(preferences ?? null);
    setMatches((matchRows ?? []) as JobMatchRow[]);
    setLoading(false);
  };

  const filterOptions = useMemo(() => {
    const options = [
      ...(preferences?.interested_roles ?? []),
      ...(preferences?.preferred_locations ?? []),
      ...(preferences?.keywords ?? []),
    ]
      .map((value) => value.trim())
      .filter(Boolean);
    return Array.from(new Set(options)).slice(0, 8);
  }, [preferences]);

  const recommendedMatches = useMemo(
    () => matches.filter((match) => (match.match_score ?? 0) > 0),
    [matches]
  );
  const savedMatches = useMemo(
    () => matches.filter((match) => match.is_saved),
    [matches]
  );
  const appliedMatches = useMemo(
    () => matches.filter((match) => match.is_applied),
    [matches]
  );

  const activeMatches = useMemo(() => {
    switch (activeTab) {
      case "saved":
        return savedMatches;
      case "applied":
        return appliedMatches;
      default:
        return recommendedMatches;
    }
  }, [activeTab, recommendedMatches, savedMatches, appliedMatches]);

  const visibleMatches = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const activeFilterValue = activeFilter ? normalizeFilterValue(activeFilter) : null;
    return activeMatches.filter((match) => {
      const job = match.job_postings;
      if (!job) return false;
      const haystack = `${job.role} ${job.company} ${job.location ?? ""}`.toLowerCase();
      const matchesSearch = !term || haystack.includes(term);
      if (!matchesSearch) return false;
      if (!activeFilterValue) return true;
      const tagMatch = (job.tags ?? []).some((tag) =>
        normalizeFilterValue(tag).includes(activeFilterValue)
      );
      const reasonMatch = (match.match_reasons ?? []).some((reason) =>
        normalizeFilterValue(reason).includes(activeFilterValue)
      );
      return haystack.includes(activeFilterValue) || tagMatch || reasonMatch;
    });
  }, [activeMatches, searchTerm, activeFilter]);

  const counts = useMemo(
    () => ({
      recommended: recommendedMatches.length,
      saved: savedMatches.length,
      applied: appliedMatches.length,
    }),
    [recommendedMatches.length, savedMatches.length, appliedMatches.length]
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-slate-600 text-sm">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse" />
          Loading your dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f7fb] px-6 py-10">
      <div className="mx-auto max-w-7xl grid lg:grid-cols-[240px,1fr] gap-8">
        <aside className="space-y-6">
          <div className="rounded-2xl bg-white border border-slate-200 p-5">
            <h2 className="text-lg font-semibold text-slate-900 mb-1">
              Rezoomind
            </h2>
            <p className="text-xs text-slate-500">
              Personalized career dashboard
            </p>
          </div>

          <nav className="rounded-2xl bg-white border border-slate-200 p-4 space-y-1">
            <SidebarLink href="/dashboard" label="Jobs" icon="💼" active />
            <SidebarLink href="/matches" label="Matches" icon="✨" />
            <SidebarLink href="/resume" label="Resume" icon="📄" />
            <SidebarLink href="/preferences" label="Preferences" icon="🎯" />
            <SidebarLink href="/alerts" label="Alerts" icon="🔔" />
            <SidebarLink href="/settings" label="Settings" icon="⚙️" />
          </nav>

          <div className="rounded-2xl bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200 p-5">
            <p className="text-sm font-semibold text-slate-900">Refer & Earn</p>
            <p className="mt-2 text-xs text-slate-600">
              Invite friends and unlock extra AI credits.
            </p>
            <button className="mt-4 w-full rounded-lg bg-slate-900 text-white text-xs font-semibold py-2">
              Share Invite
            </button>
          </div>
        </aside>

        <main className="space-y-6">
          <header className="rounded-2xl bg-white border border-slate-200 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Welcome back
                </p>
                <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">
                  {user?.email?.split("@")[0] || "there"}
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                  Here are your best‑fit roles right now.
                </p>
              </div>
              <div className="w-full lg:max-w-xs">
                <div className="relative">
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search by role or company"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <TabButton
                active={activeTab === "recommended"}
                onClick={() => setActiveTab("recommended")}
                count={counts.recommended}
              >
                Recommended
              </TabButton>
              <TabButton
                active={activeTab === "saved"}
                onClick={() => setActiveTab("saved")}
                count={counts.saved}
              >
                Saved
              </TabButton>
              <TabButton
                active={activeTab === "applied"}
                onClick={() => setActiveTab("applied")}
                count={counts.applied}
              >
                Applied
              </TabButton>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {filterOptions.length > 0 ? (
                filterOptions.map((filter) => (
                  <button
                    key={filter}
                    onClick={() =>
                      setActiveFilter(activeFilter === filter ? null : filter)
                    }
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${
                      activeFilter === filter
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                    }`}
                  >
                    {filter}
                  </button>
                ))
              ) : (
                <span className="text-xs text-slate-500">
                  Add preferences to unlock smart filters.
                </span>
              )}
              <Link
                href="/preferences"
                className="ml-auto text-xs font-semibold text-cyan-600 hover:text-cyan-700"
              >
                Edit filters
              </Link>
            </div>
          </header>

          <div className="grid lg:grid-cols-[1fr,280px] gap-6">
            <section className="space-y-4">
              {visibleMatches.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
                  <p className="text-lg font-semibold text-slate-900">
                    No matches yet
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    Upload your resume or update preferences to see tailored roles.
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-3">
                    <Link
                      href="/resume"
                      className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
                    >
                      Upload Resume
                    </Link>
                    <Link
                      href="/preferences"
                      className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
                    >
                      Set Preferences
                    </Link>
                  </div>
                </div>
              ) : (
                visibleMatches.map((match) => {
                  const job = match.job_postings;
                  if (!job) return null;
                  return (
                    <MatchCard
                      key={job.id}
                      job={job}
                      score={match.match_score ?? 0}
                      reasons={match.match_reasons ?? []}
                    />
                  );
                })
              )}
            </section>

            <aside className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Profile
                </p>
                <div className="grid gap-3">
                  <MiniStat label="Resume Score" value={progress.resumeScore ? `${progress.resumeScore}` : "N/A"} />
                  <MiniStat label="Resumes" value={stats.resumesCreated} />
                  <MiniStat label="AI Analyses" value={stats.analysesRun} />
                  <MiniStat label="Days Active" value={stats.daysActive} />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Quick Actions
                </p>
                <QuickLink href="/resume/analysis" label="Improve Resume" />
                <QuickLink href="/matches" label="View Matches" />
                <QuickLink href="/alerts" label="Manage Alerts" />
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarLink({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-slate-900 text-white"
          : "text-slate-600 hover:bg-slate-100"
      }`}
    >
      <span className="text-base">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

function TabButton({
  active,
  count,
  children,
  onClick,
}: {
  active?: boolean;
  count?: number;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
        active
          ? "bg-slate-900 text-white"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      }`}
    >
      {children} {typeof count === "number" ? `(${count})` : null}
    </button>
  );
}

function MatchCard({
  job,
  score,
  reasons,
}: {
  job: JobPosting;
  score: number;
  reasons: string[];
}) {
  const displayScore = Math.round(score);
  const scoreLabel =
    displayScore >= 85 ? "Strong match" : displayScore >= 70 ? "Good match" : "Potential";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
            <span>{getRelativeTime(job.date_posted ?? job.created_at)}</span>
            <span className="rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 font-semibold">
              {scoreLabel}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-slate-900">{job.role}</h3>
          <p className="text-sm text-slate-600 mt-1">
            {job.company} {job.location ? `• ${job.location}` : ""}
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
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {job.url ? (
              <a
                href={job.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-700"
              >
                Apply now
              </a>
            ) : null}
            <Link
              href="/matches"
              className="text-xs font-semibold text-slate-500 hover:text-slate-700"
            >
              View details
            </Link>
          </div>
        </div>

        <div className="hidden md:flex flex-col items-center justify-center w-28 rounded-2xl bg-slate-900 text-white px-4 py-6">
          <span className="text-2xl font-semibold">{displayScore}%</span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-slate-200 mt-1">
            Match
          </span>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between text-sm text-slate-600">
      <span>{label}</span>
      <span className="font-semibold text-slate-900">{value}</span>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-800"
    >
      {label}
    </Link>
  );
}
