"use client";

import { useState, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import { SmartFeedHeader } from "./SmartFeedHeader";
import { SummaryStrip } from "@/components/dashboard/SummaryStrip";
import { FilterBar, type Filters, DEFAULT_FILTERS } from "./FilterBar";
import { TabBar, type TabId } from "./TabBar";
import { JobFeed } from "./JobFeed";
import { DetailPanel } from "./DetailPanel";
import type { SmartFeedJob, JobMatch } from "./types";
import type { MarketInsights } from "@/lib/insights";

interface SmartFeedShellProps {
  postings: SmartFeedJob[];
  marketHeat: MarketInsights["marketHeat"];
  freshToday: number;
  competitionLevel: MarketInsights["competitionLevel"];
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

  // Auth-aware state (populated in Task 12)
  const [matches] = useState<Record<string, JobMatch>>({});
  const [isLoadingMatches] = useState(false);
  // savedJobIds — placeholder, will be replaced by useSavedJobs hook in Task 13
  const savedJobIds = new Set<string>();

  // ── Client-side filtering ────────────────────────────────────────────────
  const filteredJobs = useMemo(() => {
    let result = postings;

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
      const cutoff =
        { day: 1, week: 7, month: 30 }[filters.recency] ?? 30;
      result = result.filter((j) => {
        if (!j.datePosted) return true;
        const parsed = new Date(j.datePosted).getTime();
        if (isNaN(parsed)) return true; // non-parseable dates pass through
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
  }, [postings, filters]);

  // ── Selected job ─────────────────────────────────────────────────────────
  const selectedJob = useMemo(
    () => filteredJobs.find((j) => j.id === selectedJobId) ?? null,
    [filteredJobs, selectedJobId]
  );

  // ── Placeholder handlers (wired in Tasks 12-14, 18) ─────────────────────
  const handleToggleSave = useCallback((_job: SmartFeedJob) => {
    // Task 13: implement save/unsave via useSavedJobs
  }, []);

  const handleTailorClick = useCallback((_job: SmartFeedJob) => {
    // Task 14: open QuickTailorPanel
  }, []);

  const handleAskAI = useCallback((_job: SmartFeedJob) => {
    // Task 18: open AskAIPanel
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
          />
        </div>
      </div>
    </div>
  );
}
