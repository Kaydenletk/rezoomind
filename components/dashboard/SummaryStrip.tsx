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

export function SummaryStrip({
  marketHeat,
  freshToday,
  competitionLevel,
}: {
  marketHeat: MarketInsights["marketHeat"];
  freshToday: number;
  competitionLevel: MarketInsights["competitionLevel"];
}) {
  const heat = HEAT_CONFIG[marketHeat];
  const competition = COMPETITION_CONFIG[competitionLevel];

  return (
    <div className="flex items-center gap-5 px-5 lg:px-7 py-2.5 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/50 overflow-x-auto">
      {/* Market heat */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-[9px] uppercase tracking-[0.2em] text-stone-400 font-mono whitespace-nowrap">Market</span>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: heat.color }} />
          <span className="text-xs font-bold font-mono text-stone-950 dark:text-stone-50">{heat.label}</span>
        </div>
      </div>

      <span className="text-stone-300 dark:text-stone-700">|</span>

      {/* Fresh today */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-[9px] uppercase tracking-[0.2em] text-stone-400 font-mono whitespace-nowrap">Fresh today</span>
        <span className="text-xs font-bold font-mono text-stone-950 dark:text-stone-50">{freshToday}</span>
      </div>

      <span className="text-stone-300 dark:text-stone-700">|</span>

      {/* Best window */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-[9px] uppercase tracking-[0.2em] text-stone-400 font-mono whitespace-nowrap">Best window</span>
        <span className="text-xs font-bold font-mono text-stone-950 dark:text-stone-50">48-72hrs</span>
      </div>

      <span className="text-stone-300 dark:text-stone-700">|</span>

      {/* Competition */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-[9px] uppercase tracking-[0.2em] text-stone-400 font-mono whitespace-nowrap">Competition</span>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: competition.color }} />
          <span className="text-xs font-bold font-mono text-stone-950 dark:text-stone-50">{competition.label}</span>
        </div>
      </div>
    </div>
  );
}
