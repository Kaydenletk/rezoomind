"use client";

import Link from "next/link";
import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";

import { AuthHeader } from "./AuthHeader";
import { DashboardFooter } from "./DashboardFooter";
import { HomepageExplorerBar } from "./HomepageExplorerBar";
import { JobsTable } from "./JobsTable";
import { MatchingPreviewCard } from "./MatchingPreviewCard";
import { ResumeStatusCard } from "./ResumeStatusCard";
import { ResumeUploadCard } from "./ResumeUploadCard";

import { useDemoSignIn } from "@/hooks/useDemoSignIn";
import {
  filterAndSortHomepageJobs,
  type HomepageFilters,
  type HomepageJob,
} from "@/lib/homepage-discovery";
import type { PriorityBadge } from "@/lib/job-priority";
import { getLandingPageConfigs } from "@/lib/seo-landing-pages";

interface HomeClientShellProps {
  children: React.ReactNode;
  postings: HomepageJob[];
  priorities: Record<string, PriorityBadge | null>;
  fitBadges: Record<string, string[]>;
  counts: {
    swe: number;
    pm: number;
    dsml: number;
    quant: number;
    hardware: number;
    internship: number;
    newGrad: number;
    remote: number;
    total: number;
  };
  freshToday: number;
}

interface ResumeData {
  resumeText: string;
  keywords: string[];
  parsedAt: string | null;
}

export function HomeClientShell({
  children,
  postings,
  priorities,
  fitBadges,
  counts,
  freshToday,
}: HomeClientShellProps) {
  const { status } = useSession();
  const isAuth = status === "authenticated";
  const { demoError, handleDemoLogin, isDemoLoading } = useDemoSignIn({ callbackUrl: "/feed" });
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [matchScores, setMatchScores] = useState<Record<string, number>>({});
  const [showUpload, setShowUpload] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<HomepageFilters>({
    search: "",
    location: "",
    remote: "all",
    recency: "all",
    sort: "newest",
  });
  const deferredFilters = useDeferredValue(filters);
  const landingPages = getLandingPageConfigs();

  const fetchResume = useCallback(async () => {
    if (!isAuth) return;

    try {
      const response = await fetch("/api/resume/data");
      if (!response.ok) return;

      const payload = await response.json();
      if (!payload.ok || !payload.resume?.resume_text) return;

      setResume({
        resumeText: payload.resume.resume_text,
        keywords: payload.resume.resume_keywords || [],
        parsedAt: payload.resume.parsed_at || null,
      });
      setShowUpload(false);
    } catch {
      // Resume data is an enhancement, not a hard dependency.
    }
  }, [isAuth]);

  const fetchBatchScores = useCallback(async () => {
    if (!resume || postings.length === 0) return;

    setLoading(true);

    try {
      const response = await fetch("/api/matches/batch-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobs: postings.map((posting) => ({
            company: posting.company,
            role: posting.role,
            location: posting.location,
            category: posting.category,
          })),
        }),
      });

      if (!response.ok) return;

      const payload = await response.json();
      if (payload.ok && payload.scores) {
        setMatchScores(payload.scores);
      }
    } catch {
      // Match scoring is progressive enhancement.
    } finally {
      setLoading(false);
    }
  }, [postings, resume]);

  useEffect(() => {
    fetchResume();
  }, [fetchResume]);

  useEffect(() => {
    fetchBatchScores();
  }, [fetchBatchScores]);

  const canUseBestMatch = isAuth && Object.keys(matchScores).length > 0;
  const filteredPostings = useMemo(
    () => filterAndSortHomepageJobs(postings, deferredFilters, matchScores),
    [deferredFilters, matchScores, postings]
  );

  const renderSidebar = () => {
    if (!isAuth) {
      return (
        <MatchingPreviewCard
          totalJobs={counts.total}
          freshToday={freshToday}
          remoteCount={counts.remote}
          newGradCount={counts.newGrad}
        />
      );
    }

    if (!resume || showUpload) {
      return <ResumeUploadCard onUploaded={fetchResume} />;
    }

    return (
      <ResumeStatusCard
        keywords={resume.keywords}
        parsedAt={resume.parsedAt}
        onReUpload={() => setShowUpload(true)}
        matchLoading={loading}
      />
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-stone-50 transition-colors dark:bg-stone-950">
      <AuthHeader />

      <main className="flex-1 px-5 pb-4 lg:px-7">
        <section className="grid gap-4 border-b border-stone-200 py-6 dark:border-stone-800 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <div className="space-y-5">
            <div className="space-y-3">
              <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-orange-500">
                AI-powered internship matching
              </div>
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-stone-950 dark:text-stone-50 md:text-5xl">
                Stop applying blind. See your fit score before you hit submit.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-stone-600 dark:text-stone-300">
                Browse {counts.total.toLocaleString()} live internships and new-grad roles, get AI fit scores for any job,
                and tailor your resume to match — all without creating an account first.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <a
                href="#jobs"
                className="rounded-md bg-orange-600 px-4 py-2.5 font-mono text-xs font-semibold text-white transition-colors hover:bg-orange-500"
              >
                explore {counts.total.toLocaleString()} roles
              </a>
              {!isAuth ? (
                <>
                  <button
                    onClick={handleDemoLogin}
                    disabled={isDemoLoading}
                    className="rounded-md border border-orange-300 bg-orange-50 px-4 py-2.5 font-mono text-xs font-semibold text-orange-600 transition-colors hover:border-orange-500 hover:bg-orange-100 disabled:opacity-60 dark:border-orange-800 dark:bg-orange-950/30 dark:text-orange-400"
                  >
                    {isDemoLoading ? "loading..." : "preview AI matching"}
                  </button>
                  <Link
                    href="/signup"
                    className="rounded-md border border-stone-300 px-4 py-2.5 font-mono text-xs font-semibold text-stone-700 transition-colors hover:border-stone-500 hover:text-stone-950 dark:border-stone-700 dark:text-stone-200 dark:hover:text-stone-50"
                  >
                    get personalized matches
                  </Link>
                </>
              ) : (
                <Link
                  href="/feed"
                  className="rounded-md border border-stone-300 px-4 py-2.5 font-mono text-xs font-semibold text-stone-700 transition-colors hover:border-stone-500 hover:text-stone-950 dark:border-stone-700 dark:text-stone-200 dark:hover:text-stone-50"
                >
                  open my feed
                </Link>
              )}
            </div>

            {demoError ? <div className="font-mono text-[10px] text-red-400">demo unavailable</div> : null}

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[10px] border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-400">live roles</div>
                <div className="mt-1 text-2xl font-semibold text-stone-950 dark:text-stone-50">{counts.total}</div>
              </div>
              <div className="rounded-[10px] border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-400">fresh today</div>
                <div className="mt-1 text-2xl font-semibold text-stone-950 dark:text-stone-50">{freshToday}</div>
              </div>
              <div className="rounded-[10px] border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-400">internships</div>
                <div className="mt-1 text-2xl font-semibold text-stone-950 dark:text-stone-50">{counts.internship}</div>
              </div>
              <div className="rounded-[10px] border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-400">new grad</div>
                <div className="mt-1 text-2xl font-semibold text-stone-950 dark:text-stone-50">{counts.newGrad}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 font-mono text-[11px] text-stone-400 dark:text-stone-500">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              <span>Updated {freshToday > 0 ? `${freshToday} new roles today` : "daily"} · Data from verified sources</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {landingPages.map((page) => (
                <Link
                  key={page.slug}
                  href={`/${page.slug}`}
                  className="rounded-full border border-stone-200 bg-white px-3 py-1.5 font-mono text-[11px] text-stone-500 transition-colors hover:border-orange-500 hover:text-orange-600 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300 dark:hover:text-orange-400"
                >
                  {page.title}
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-[14px] border border-orange-200 bg-white p-5 shadow-[0_20px_60px_rgba(234,88,12,0.08)] dark:border-orange-900/60 dark:bg-stone-900">
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-orange-500">how it works</div>
            <div className="mt-4 grid gap-4">
              <div className="rounded-[10px] border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-400">ai fit score</div>
                    <div className="mt-1 text-3xl font-semibold text-green-600 dark:text-green-400">82%</div>
                  </div>
                  <div className="rounded-full bg-green-500/15 px-2 py-1 font-mono text-[10px] text-green-600 dark:text-green-400">
                    strong match
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-stone-600 dark:text-stone-300">
                  Know if you're qualified before applying. Our AI analyzes job requirements against your skills and shows exactly where you match — and what's missing.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[10px] border border-stone-200 p-4 dark:border-stone-800">
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-400">1. browse freely</div>
                  <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-300">
                    No account needed. Filter {counts.total.toLocaleString()} roles by location, category, and freshness.
                  </p>
                </div>
                <div className="rounded-[10px] border border-stone-200 p-4 dark:border-stone-800">
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-400">2. check your fit</div>
                  <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-300">
                    Upload your resume to unlock personalized fit scores and AI-powered resume tailoring.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {children}

        <section className="py-5">
          <HomepageExplorerBar
            filters={filters}
            onChange={setFilters}
            resultCount={filteredPostings.length}
            totalCount={postings.length}
            canUseBestMatch={canUseBestMatch}
          />
        </section>

        <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-[1fr_240px]">
          <JobsTable
            postings={filteredPostings}
            priorities={priorities}
            fitBadges={fitBadges}
            matchScores={matchScores}
            savedResumeText={resume?.resumeText}
            isAuthenticated={isAuth}
            title="early-career explorer"
            subtitle="Filter public jobs by role, location, freshness, and AI fit."
            emptyStateMessage="No roles match this filter set yet. Try widening the location or recency range."
          />

          <div className="flex flex-col gap-3.5" id="resume-upload">{renderSidebar()}</div>
        </div>
      </main>

      <DashboardFooter />
    </div>
  );
}
