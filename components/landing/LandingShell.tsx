"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { LandingTopbar } from "./LandingTopbar";
import { LandingHero } from "./LandingHero";
import { SearchBar } from "./SearchBar";
import { AuthNudgeCard } from "./AuthNudgeCard";
import { RoleList } from "./RoleList";
import type { LandingRole } from "./RoleRow";
import { useSearchFilters } from "@/hooks/useSearchFilters";
import { LANDING_COPY } from "./copy";

interface LandingShellProps {
  initialJobs: LandingRole[];
  liveCount: number;
}

export function LandingShell({ initialJobs, liveCount }: LandingShellProps) {
  const { data: session, status } = useSession();
  const { query, setQuery, filters, toggleFilter } = useSearchFilters();
  const [, setSelectedRole] = useState<LandingRole | null>(null);
  const [scores, setScores] = useState<Record<string, number | null>>({});
  const [hasResume, setHasResume] = useState(false);
  const [scoresLoading, setScoresLoading] = useState(false);

  const isAuthed = status === "authenticated" && !!session?.user;

  useEffect(() => {
    if (!isAuthed) return;
    let cancelled = false;

    setScoresLoading(true);
    (async () => {
      try {
        const resumeRes = await fetch("/api/resume/data", { credentials: "include" });
        const resumeJson = resumeRes.ok ? await resumeRes.json() : null;
        const resumeText = resumeJson?.data?.resume_text ?? null;
        if (cancelled) return;
        setHasResume(!!resumeText);
        if (!resumeText) {
          setScoresLoading(false);
          return;
        }

        const jobIds = initialJobs.map((j) => j.id);
        const batchRes = await fetch("/api/matches/batch-score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ jobIds }),
        });
        if (!batchRes.ok) throw new Error("batch-score failed");
        const batchJson = await batchRes.json();
        if (cancelled) return;

        const next: Record<string, number | null> = {};
        if (batchJson?.scores && typeof batchJson.scores === "object") {
          for (const [id, s] of Object.entries(batchJson.scores)) {
            next[id] = typeof s === "number" ? s : null;
          }
        } else if (Array.isArray(batchJson?.data)) {
          for (const row of batchJson.data) {
            if (row?.id && typeof row.score === "number") next[row.id] = row.score;
          }
        }
        setScores(next);
      } catch {
        // Silent — rails render for all rows.
      } finally {
        if (!cancelled) setScoresLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthed, initialJobs]);

  const showAuthNudge = isAuthed && !hasResume;

  const handleSelect = (role: LandingRole) => {
    setSelectedRole(role);
    if (role.url) {
      window.open(role.url, "_blank", "noopener,noreferrer");
    }
  };

  const remaining = Math.max(liveCount - initialJobs.length, 0);

  return (
    <div className="min-h-dvh bg-stone-950 text-stone-100">
      <LandingTopbar />
      <LandingHero liveCount={liveCount} />
      <SearchBar
        query={query}
        onQueryChange={setQuery}
        activeFilters={filters}
        onToggleFilter={toggleFilter}
      />
      {showAuthNudge && <AuthNudgeCard />}
      <RoleList
        jobs={initialJobs}
        scores={scores}
        query={query}
        filters={filters}
        onSelectRole={handleSelect}
        onClearFilter={toggleFilter}
        loading={scoresLoading && initialJobs.length === 0}
      />
      {!isAuthed && (
        <p className="mt-4 mb-8 text-center font-mono text-[10px] text-stone-500 px-4">
          {LANDING_COPY.footerHint(remaining)}
        </p>
      )}
    </div>
  );
}
