"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { LandingTopbar } from "./LandingTopbar";
import { LandingHero } from "./LandingHero";
import { DailyDigestStrip } from "./DailyDigestStrip";
import { InsiderTipCard } from "./InsiderTipCard";
import { SearchBar } from "./SearchBar";
import { AuthNudgeCard } from "./AuthNudgeCard";
import { RoleList } from "./RoleList";
import { TrustBlock } from "./TrustBlock";
import { PlaybookTeaser } from "./PlaybookTeaser";
import { LandingFooter } from "./LandingFooter";
import type { LandingRole } from "./RoleRow";
import { useSearchFilters } from "@/hooks/useSearchFilters";
import { LANDING_COPY } from "./copy";
import { formatTimeAgo } from "@/lib/format-time";
import type { LandingTrustStats } from "@/lib/dashboard";
import type { InsiderTip } from "@/lib/insider-tips";

interface LandingShellProps {
  initialJobs: LandingRole[];
  liveCount: number;
  trustData: LandingTrustStats;
  insiderTip: InsiderTip;
}

interface MirrorBreakdown {
  strong: number;
  stretch: number;
  breadth: number;
  matchCount: number;
}

function computeBreakdown(
  scores: Record<string, number | null>,
): MirrorBreakdown {
  let strong = 0;
  let stretch = 0;
  let breadth = 0;
  for (const value of Object.values(scores)) {
    if (typeof value !== "number") continue;
    if (value >= 75) strong += 1;
    else if (value >= 50) stretch += 1;
    else if (value >= 30) breadth += 1;
  }
  return { strong, stretch, breadth, matchCount: strong + stretch + breadth };
}

export function LandingShell({
  initialJobs,
  liveCount,
  trustData,
  insiderTip,
}: LandingShellProps) {
  const { data: session, status } = useSession();
  const { query, setQuery, filters, toggleFilter, clearFilters } = useSearchFilters();
  const [, setSelectedRole] = useState<LandingRole | null>(null);
  const [scores, setScores] = useState<Record<string, number | null>>({});
  const [hasResume, setHasResume] = useState(false);
  const [scoresLoading, setScoresLoading] = useState(false);

  const isAuthed = status === "authenticated" && !!session?.user;
  const ago = formatTimeAgo(trustData.lastSynced);

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

  const breakdown = useMemo(() => computeBreakdown(scores), [scores]);
  const showAuthNudge = isAuthed && !hasResume && !scoresLoading;

  const heroState = useMemo(() => {
    if (!isAuthed) {
      return { kind: "unauthed" as const, liveCount, ago };
    }
    if (!hasResume) {
      return { kind: "authedNoResume" as const, liveCount, ago };
    }
    return {
      kind: "authedMirror" as const,
      matchCount: breakdown.matchCount,
      breakdown: {
        strong: breakdown.strong,
        stretch: breakdown.stretch,
        breadth: breakdown.breadth,
      },
      liveCount,
      ago,
    };
  }, [isAuthed, hasResume, liveCount, ago, breakdown]);

  const handleSelect = (role: LandingRole) => {
    setSelectedRole(role);
    if (role.url) {
      window.open(role.url, "_blank", "noopener,noreferrer");
    }
  };

  const remaining = Math.max(liveCount - initialJobs.length, 0);
  const mirrorLoading =
    heroState.kind === "authedMirror" && scoresLoading && breakdown.matchCount === 0;

  return (
    <div className="min-h-dvh bg-surface text-fg">
      <LandingTopbar />
      <LandingHero state={heroState} loadingMirror={mirrorLoading} />
      <DailyDigestStrip trustData={trustData} />
      <InsiderTipCard tip={insiderTip} />
      <div id="roles">
        <SearchBar
          query={query}
          onQueryChange={setQuery}
          activeFilters={filters}
          onToggleFilter={toggleFilter}
          onClearFilters={clearFilters}
        />
        {showAuthNudge && <AuthNudgeCard />}
        <div className="max-w-[980px] mx-auto">
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
            <p className="mt-4 mb-6 text-center font-mono text-[10px] text-fg-subtle px-4">
              {LANDING_COPY.footerHint(remaining)}
            </p>
          )}
        </div>
      </div>
      <TrustBlock trustData={trustData} />
      <PlaybookTeaser />
      <LandingFooter lastSynced={trustData.lastSynced} />
    </div>
  );
}
