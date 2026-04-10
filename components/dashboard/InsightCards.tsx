import Link from "next/link";
import type { MarketInsights } from "@/lib/insights";

export function InsightCards({ insights }: { insights: MarketInsights }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 px-5 lg:px-7 py-3">
      {/* Card 1: Season Status */}
      <div className="border-[1.5px] border-stone-200 dark:border-stone-800 rounded-[10px] bg-white dark:bg-stone-900 p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-orange-600 font-mono text-xs font-bold">▸</span>
          <span className="font-mono text-[11px] text-stone-500 dark:text-stone-400">Market status</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: insights.seasonColor }} />
          <span className="font-mono text-sm font-bold text-stone-950 dark:text-stone-50">
            {insights.seasonLabel}
          </span>
        </div>
        <p className="text-[11px] text-stone-500 dark:text-stone-400">
          {insights.monthsUntilPeak === 0
            ? "Peak season is underway"
            : `Peak season starts in ~${insights.monthsUntilPeak} months`}
        </p>
      </div>

      {/* Card 2: 30-day Trend */}
      <div className="border-[1.5px] border-stone-200 dark:border-stone-800 rounded-[10px] bg-white dark:bg-stone-900 p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-orange-600 font-mono text-xs font-bold">▸</span>
          <span className="font-mono text-[11px] text-stone-500 dark:text-stone-400">30-day trend</span>
        </div>
        <div className="space-y-0.5">
          {insights.trends.map((t) => (
            <div key={t.category} className="flex items-center justify-between font-mono text-[11px]">
              <span className="text-stone-600 dark:text-stone-300">{t.category.replace("Internships", "Intern").replace("New Grad", "Grad")}</span>
              <span style={{ color: t.momChange >= 0 ? "#22c55e" : "#ef4444" }}>
                {t.momChange >= 0 ? "↑" : "↓"} {Math.abs(t.momChange)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Card 3: Recommendation */}
      <div className="border-[1.5px] border-stone-200 dark:border-stone-800 rounded-[10px] bg-white dark:bg-stone-900 p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-orange-600 font-mono text-xs font-bold">▸</span>
          <span className="font-mono text-[11px] text-stone-500 dark:text-stone-400">What to do next</span>
        </div>
        <p className="text-[11px] text-stone-600 dark:text-stone-300 leading-relaxed mb-2">
          {insights.weeklyGuidance}
        </p>
        <Link href="/insights" className="text-[11px] font-mono font-semibold text-orange-600 hover:underline">
          learn more →
        </Link>
      </div>
    </div>
  );
}
