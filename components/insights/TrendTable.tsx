import type { MarketInsights } from "@/lib/insights";

export function TrendTable({ trends, yoy }: { trends: MarketInsights["trends"]; yoy: MarketInsights["yoy"] }) {
  const hasYoy = yoy.some((y) => y.yoyChange !== null);

  return (
    <div className="border-[1.5px] border-stone-200 dark:border-stone-800 rounded-[10px] bg-white dark:bg-stone-900 overflow-hidden">
      <div className="flex items-center gap-1.5 px-5 py-3 border-b border-stone-100 dark:border-stone-800">
        <span className="text-orange-600 font-mono text-xs font-bold">▸</span>
        <span className="font-mono text-[11px] text-stone-500 dark:text-stone-400">trend_analysis</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[11px] font-mono">
          <thead>
            <tr className="bg-stone-50 dark:bg-stone-950 border-b border-stone-100 dark:border-stone-800">
              <th className="text-left px-5 py-2 text-[9px] text-stone-400 uppercase tracking-widest">Category</th>
              <th className="text-right px-3 py-2 text-[9px] text-stone-400 uppercase tracking-widest">Current</th>
              <th className="text-right px-3 py-2 text-[9px] text-stone-400 uppercase tracking-widest">30d Ago</th>
              <th className="text-right px-3 py-2 text-[9px] text-stone-400 uppercase tracking-widest">MoM</th>
              {hasYoy && <th className="text-right px-5 py-2 text-[9px] text-stone-400 uppercase tracking-widest">YoY</th>}
            </tr>
          </thead>
          <tbody>
            {trends.map((t, i) => {
              const yoyItem = yoy[i];
              return (
                <tr key={t.category} className="border-b border-stone-50 dark:border-stone-800/50">
                  <td className="px-5 py-2.5 text-stone-700 dark:text-stone-300">{t.category}</td>
                  <td className="text-right px-3 py-2.5 text-stone-950 dark:text-stone-50 font-semibold">{t.current}</td>
                  <td className="text-right px-3 py-2.5 text-stone-500">{t.thirtyDaysAgo}</td>
                  <td className="text-right px-3 py-2.5" style={{ color: t.momChange >= 0 ? "#22c55e" : "#ef4444" }}>
                    {t.momChange >= 0 ? "↑" : "↓"} {Math.abs(t.momChange)}%
                  </td>
                  {hasYoy && (
                    <td className="text-right px-5 py-2.5" style={{ color: yoyItem.yoyChange !== null ? (yoyItem.yoyChange >= 0 ? "#22c55e" : "#ef4444") : undefined }}>
                      {yoyItem.yoyChange !== null ? `${yoyItem.yoyChange >= 0 ? "↑" : "↓"} ${Math.abs(yoyItem.yoyChange)}%` : "—"}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!hasYoy && (
        <div className="px-5 py-2 text-[10px] text-stone-400 font-mono border-t border-stone-100 dark:border-stone-800">
          Year-over-year data not yet available
        </div>
      )}
    </div>
  );
}
