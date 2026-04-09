"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { SmartFeedHeader } from "./SmartFeedHeader";
import { SummaryStrip } from "@/components/dashboard/SummaryStrip";
import { FilterBar, type Filters, DEFAULT_FILTERS } from "./FilterBar";
import { TabBar, type TabId } from "./TabBar";
import { JobFeed } from "./JobFeed";
import { DetailPanel } from "./DetailPanel";
import { QuickTailorPanel } from "@/components/dashboard/QuickTailorPanel";
import { useSavedJobs } from "@/hooks/useSavedJobs";
import type { SmartFeedJob, JobMatch, DetailPanelMode } from "./types";
import type { MarketInsights } from "@/lib/insights";

interface SmartFeedShellProps {
  postings: SmartFeedJob[];
  marketHeat: MarketInsights["marketHeat"];
  freshToday: number;
  competitionLevel: MarketInsights["competitionLevel"];
}

function formatSalary(
  min: number | null,
  max: number | null,
  interval: string | null
): string | null {
  if (!min && !max) return null;
  const fmt = (n: number) =>
    n >= 1000 ? `$${(n / 1000).toFixed(0)}k` : `$${n}`;
  if (min && max)
    return `${fmt(Number(min))}–${fmt(Number(max))}${interval ? `/${interval}` : ""}`;
  if (min) return `${fmt(Number(min))}+`;
  return null;
}

export function SmartFeedShell({
  postings,
  marketHeat,
  freshToday,
  competitionLevel,
}: SmartFeedShellProps) {
  const { data: session, status: authStatus } = useSession();
  const isAuth = authStatus === "authenticated";
  const user = session?.user ?? null;

  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [activeTab, setActiveTab] = useState<TabId>("all-jobs");

  // Task 12: Auth-aware match data
  const [authJobs, setAuthJobs] = useState<SmartFeedJob[]>([]);
  const [matches, setMatches] = useState<Record<string, JobMatch>>({});
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  const [hasResume, setHasResume] = useState<boolean | null>(null);

  // Task 14: QuickTailor
  const [tailorJob, setTailorJob] = useState<SmartFeedJob | null>(null);
  const [savedResumeText, setSavedResumeText] = useState<string | null>(null);

  // DetailPanel tab mode
  const [panelMode, setPanelMode] = useState<DetailPanelMode>("overview");

  // Reset panel to overview whenever user selects a different job
  useEffect(() => {
    setPanelMode("overview");
  }, [selectedJobId]);

  // Task 13: useSavedJobs hook
  const { savedJobIds: savedJobIdsList, toggleSavedJob } = useSavedJobs();
  const savedJobIds = useMemo(() => new Set(savedJobIdsList), [savedJobIdsList]);

  // Task 12: Fetch match data + resume when authenticated
  useEffect(() => {
    if (!isAuth) return;

    let cancelled = false;
    setIsLoadingMatches(true);

    Promise.all([
      fetch("/api/dashboard/data").then((r) => r.json()),
      fetch("/api/resume/data").then((r) => r.json()),
    ])
      .then(([matchData, resumeData]) => {
        if (cancelled) return;

        if (matchData.ok && Array.isArray(matchData.matchRows)) {
          setHasResume(matchData.hasResume ?? false);

          const jobs: SmartFeedJob[] = [];
          const matchMap: Record<string, JobMatch> = {};

          for (const row of matchData.matchRows) {
            const jp = row.job_postings;
            if (!jp) continue;

            jobs.push({
              id: jp.id,
              company: jp.company,
              role: jp.role,
              location: jp.location,
              url: jp.url,
              datePosted: jp.date_posted,
              salary: formatSalary(jp.salary_min, jp.salary_max, jp.salary_interval),
              tags: jp.tags ?? null,
              description: jp.description,
            });

            matchMap[jp.id] = {
              matchScore: row.match_score,
              skillsMatch: row.skills_match,
              experienceMatch: row.experience_match,
              matchReasons: row.match_reasons,
              missingSkills: row.missing_skills,
            };
          }

          // Sort by match score descending for "For You"
          jobs.sort(
            (a, b) =>
              (matchMap[b.id]?.matchScore ?? -1) -
              (matchMap[a.id]?.matchScore ?? -1)
          );

          setAuthJobs(jobs);
          setMatches(matchMap);
        }

        if (resumeData.ok && resumeData.resume?.resume_text) {
          setSavedResumeText(resumeData.resume.resume_text);
        }
      })
      .catch(() => {
        // Silent fail — public feed still works
      })
      .finally(() => {
        if (!cancelled) setIsLoadingMatches(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuth]);

  // ── Source jobs based on active tab ─────────────────────────────────────
  const sourceJobs = useMemo(() => {
    if (activeTab === "for-you") return isAuth ? authJobs : postings;
    if (activeTab === "saved") {
      const base = isAuth && authJobs.length > 0 ? authJobs : postings;
      return base.filter((j) => savedJobIds.has(j.id));
    }
    return postings; // "all-jobs"
  }, [activeTab, isAuth, authJobs, postings, savedJobIds]);

  // ── Client-side filtering ────────────────────────────────────────────────
  const filteredJobs = useMemo(() => {
    let result = sourceJobs;

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (j) =>
          j.company.toLowerCase().includes(q) ||
          j.role.toLowerCase().includes(q) ||
          (j.location?.toLowerCase().includes(q) ?? false)
      );
    }

    if (filters.roleType) {
      result = result.filter((j) => j.category === filters.roleType);
    }

    if (filters.remote) {
      result = result.filter((j) => {
        const loc = (j.location ?? "").toLowerCase();
        if (filters.remote === "remote") return loc.includes("remote");
        if (filters.remote === "onsite") return !loc.includes("remote");
        return true;
      });
    }

    if (filters.recency) {
      const now = Date.now();
      const cutoff = { day: 1, week: 7, month: 30 }[filters.recency] ?? 30;
      result = result.filter((j) => {
        if (!j.datePosted) return true;
        const parsed = new Date(j.datePosted).getTime();
        if (isNaN(parsed)) return true;
        const age = (now - parsed) / (1000 * 60 * 60 * 24);
        return age <= cutoff;
      });
    }

    if (filters.h1b) {
      result = result.filter((j) =>
        j.tags?.some(
          (t) =>
            t.toLowerCase().includes("h1b") ||
            t.toLowerCase().includes("sponsor")
        )
      );
    }

    return result;
  }, [sourceJobs, filters]);

  // ── Selected job ─────────────────────────────────────────────────────────
  const selectedJob = useMemo(
    () => filteredJobs.find((j) => j.id === selectedJobId) ?? null,
    [filteredJobs, selectedJobId]
  );

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleToggleSave = useCallback(
    (job: SmartFeedJob) => {
      toggleSavedJob({
        id: job.id,
        company: job.company,
        role: job.role,
        location: job.location,
        url: job.url,
      });
    },
    [toggleSavedJob]
  );

  const handleTailorClick = useCallback((job: SmartFeedJob) => {
    setTailorJob(job);
  }, []);

  const handleAskAI = useCallback((job: SmartFeedJob) => {
    setSelectedJobId(job.id);
    setPanelMode("explain");
  }, []);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col transition-colors">
      <SmartFeedHeader user={user} />

      <SummaryStrip
        marketHeat={marketHeat}
        freshToday={freshToday}
        competitionLevel={competitionLevel}
      />

      {isAuth && (
        <TabBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          tabs={[
            { id: "for-you", label: "For You" },
            { id: "all-jobs", label: "All Jobs" },
            { id: "saved", label: "Saved", count: savedJobIds.size },
          ]}
        />
      )}

      <FilterBar filters={filters} onChange={setFilters} />

      {/* No-resume onboarding banner */}
      {isAuth && hasResume === false && activeTab === "for-you" && (
        <div className="mx-4 my-2 p-3 border border-orange-200 dark:border-orange-800/50 bg-orange-50 dark:bg-orange-950/20 font-mono text-xs text-orange-700 dark:text-orange-400">
          ⚡ Upload your resume in{" "}
          <a href="/resume" className="underline hover:text-orange-600 dark:hover:text-orange-300">
            /resume
          </a>{" "}
          to unlock AI match scores
        </div>
      )}

      <div className="flex-1 flex">
        <div className="w-full lg:w-[55%] xl:w-[60%] border-r border-stone-200 dark:border-stone-800">
          <JobFeed
            jobs={filteredJobs}
            matches={matches}
            selectedJobId={selectedJobId}
            savedJobIds={savedJobIds}
            isAuthenticated={isAuth}
            onSelectJob={setSelectedJobId}
            onToggleSave={handleToggleSave}
            isLoading={isLoadingMatches}
          />
        </div>
        <div className="hidden lg:block lg:w-[45%] xl:w-[40%]">
          <DetailPanel
            job={selectedJob}
            match={selectedJob ? matches[selectedJob.id] : null}
            isSaved={selectedJob ? savedJobIds.has(selectedJob.id) : false}
            isAuthenticated={isAuth}
            onToggleSave={handleToggleSave}
            onTailorClick={handleTailorClick}
            onAskAI={handleAskAI}
            jobDescription={selectedJob?.description}
            panelMode={panelMode}
            onPanelModeChange={setPanelMode}
            savedResumeText={savedResumeText}
          />
        </div>
      </div>

      {/* Task 14: QuickTailor slide-over */}
      <QuickTailorPanel
        isOpen={tailorJob !== null}
        onClose={() => setTailorJob(null)}
        jobContext={
          tailorJob
            ? {
                company: tailorJob.company,
                role: tailorJob.role,
                description: tailorJob.description ?? undefined,
              }
            : null
        }
        savedResumeText={savedResumeText}
      />
    </div>
  );
}
