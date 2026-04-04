import type { MarketInsights } from "@/lib/insights";

export function HistoricalComparison({ yoy }: { yoy: MarketInsights["yoy"] }) {
  const hasData = yoy.some((y) => y.lastYear !== null);

  if (!hasData) {
    return (
      <div className="border-[1.5px] border-stone-200 dark:border-stone-800 rounded-[10px] bg-white dark:bg-stone-900 p-5">
        <div className="flex items-center gap-1.5 mb-3">
          <span className="text-orange-600 font-mono text-xs font-bold">▸</span>
          <span className="font-mono text-[11px] text-stone-500 dark:text-stone-400">this_time_last_year</span>
        </div>
        <p className="text-[11px] text-stone-400 font-mono">Not enough historical data for year-over-year comparison yet.</p>
      </div>
    );
  }

  const lastYearDate = new Date();
  lastYearDate.setFullYear(lastYearDate.getFullYear() - 1);
  const lastYearLabel = lastYearDate.toLocaleDateString("en-US", { month: "short", year: "numeric" });

  return (
    <div className="border-[1.5px] border-stone-200 dark:border-stone-800 rounded-[10px] bg-white dark:bg-stone-900 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5">
          <span className="text-orange-600 font-mono text-xs font-bold">▸</span>
          <span className="font-mono text-[11px] text-stone-500 dark:text-stone-400">this_time_last_year</span>
        </div>
        <span className="text-[10px] text-stone-400 font-mono">{lastYearLabel}</span>
      </div>

      <div className="space-y-2">
        {yoy.map((y) => (
          <div key={y.category} className="flex items-center justify-between font-mono text-[11px]">
            <span className="text-stone-600 dark:text-stone-300">{y.category}</span>
            <div className="flex items-center gap-2">
              {y.lastYear !== null ? (
                <>
                  <span className="text-stone-400">{y.lastYear}</span>
                  <span className="text-stone-300 dark:text-stone-600">→</span>
                  <span className="text-stone-950 dark:text-stone-50 font-semibold">{y.current}</span>
                  <span style={{ color: y.yoyChange! >= 0 ? "#22c55e" : "#ef4444" }}>
                    {y.yoyChange! >= 0 ? "↑" : "↓"} {Math.abs(y.yoyChange!)}%
                  </span>
                </>
              ) : (
                <span className="text-stone-400">—</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
