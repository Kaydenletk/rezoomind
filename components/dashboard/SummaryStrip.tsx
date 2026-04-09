import Link from "next/link";
import type { MarketInsights } from "@/lib/insights";

const HEAT_CONFIG = {
  slow: { label: "Slow", color: "#eab308" },
  normal: { label: "Normal", color: "#3b82f6" },
  hot: { label: "Hot", color: "#22c55e" },
} as const;

const COMPETITION_CONFIG = {
  low: { label: "Low", color: "#22c55e" },
  medium: { label: "Medium", color: "#eab308" },
  high: { label: "High", color: "#ef4444" },
} as const;

interface SummaryStripProps {
  mode?: "public" | "personal";
  // Public mode:
  marketHeat?: MarketInsights["marketHeat"];
  freshToday?: number;
  competitionLevel?: MarketInsights["competitionLevel"];
  // Personal mode:
  matchCount?: number;
  avgScore?: number;
  appliedCount?: number;
  interviewCount?: number;
  aiNudge?: string;
}

export function SummaryStrip({
  mode = "public",
  marketHeat,
  freshToday,
  competitionLevel,
  matchCount,
  avgScore,
  appliedCount,
  interviewCount,
  aiNudge,
}: SummaryStripProps) {
  if (mode === "personal") {
    return (
      <div className="flex items-center gap-5 px-5 lg:px-7 py-2.5 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/50 overflow-x-auto">
        {/* Matches */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[9px] uppercase tracking-[0.2em] text-stone-400 font-mono whitespace-nowrap">Matches</span>
          <span className="text-xs font-bold font-mono text-stone-950 dark:text-stone-50">{matchCount ?? 0}</span>
        </div>

        <span className="text-stone-300 dark:text-stone-700">|</span>

        {/* Avg score */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[9px] uppercase tracking-[0.2em] text-stone-400 font-mono whitespace-nowrap">Avg</span>
          <span className="text-xs font-bold font-mono text-stone-950 dark:text-stone-50">{avgScore ?? 0}%</span>
        </div>

        <span className="text-stone-300 dark:text-stone-700">|</span>

        {/* Applied */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[9px] uppercase tracking-[0.2em] text-stone-400 font-mono whitespace-nowrap">Applied</span>
          <span className="text-xs font-bold font-mono text-stone-950 dark:text-stone-50">{appliedCount ?? 0}</span>
        </div>

        <span className="text-stone-300 dark:text-stone-700">|</span>

        {/* Interviews */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[9px] uppercase tracking-[0.2em] text-stone-400 font-mono whitespace-nowrap">Interviews</span>
          <span className="text-xs font-bold font-mono text-stone-950 dark:text-stone-50">{interviewCount ?? 0}</span>
        </div>

        {/* AI nudge */}
        {aiNudge && (
          <span className="text-orange-500 font-mono text-xs ml-auto whitespace-nowrap">✦ {aiNudge}</span>
        )}
      </div>
    );
  }

  // Public mode
  const heat = marketHeat ? HEAT_CONFIG[marketHeat] : null;
  const competition = competitionLevel ? COMPETITION_CONFIG[competitionLevel] : null;

  return (
    <div className="flex items-center gap-5 px-5 lg:px-7 py-2.5 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/50 overflow-x-auto">
      {/* Market heat */}
      {heat && (
        <>
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[9px] uppercase tracking-[0.2em] text-stone-400 font-mono whitespace-nowrap">Market</span>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: heat.color }} />
              <span className="text-xs font-bold font-mono text-stone-950 dark:text-stone-50">{heat.label}</span>
            </div>
          </div>

          <span className="text-stone-300 dark:text-stone-700">|</span>
        </>
      )}

      {/* Fresh today */}
      {freshToday !== undefined && (
        <>
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[9px] uppercase tracking-[0.2em] text-stone-400 font-mono whitespace-nowrap">Fresh today</span>
            <span className="text-xs font-bold font-mono text-stone-950 dark:text-stone-50">{freshToday}</span>
          </div>

          <span className="text-stone-300 dark:text-stone-700">|</span>
        </>
      )}

      {/* Best window */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-[9px] uppercase tracking-[0.2em] text-stone-400 font-mono whitespace-nowrap">Best window</span>
        <span className="text-xs font-bold font-mono text-stone-950 dark:text-stone-50">48-72hrs</span>
      </div>

      {/* Competition */}
      {competition && (
        <>
          <span className="text-stone-300 dark:text-stone-700">|</span>

          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[9px] uppercase tracking-[0.2em] text-stone-400 font-mono whitespace-nowrap">Competition</span>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: competition.color }} />
              <span className="text-xs font-bold font-mono text-stone-950 dark:text-stone-50">{competition.label}</span>
            </div>
          </div>
        </>
      )}

      {/* CTA */}
      <Link
        href="/signup"
        className="text-orange-500 text-xs font-mono ml-auto whitespace-nowrap hover:text-orange-400 transition-colors"
      >
        ✦ Sign up for personalized matches
      </Link>
    </div>
  );
}
