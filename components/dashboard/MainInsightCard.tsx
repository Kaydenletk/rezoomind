export function MainInsightCard({
  summary,
  seasonLabel,
  seasonColor,
}: {
  summary: string;
  seasonLabel: string;
  seasonColor: string;
}) {
  return (
    <div className="mx-5 lg:mx-7 my-3">
      <div className="border-[1.5px] border-stone-200 dark:border-stone-800 border-l-[3px] border-l-orange-600 rounded-[10px] bg-white dark:bg-[#0c0c0c] p-4">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-orange-600 font-mono text-xs font-bold">▸</span>
          <span className="font-mono text-[11px] text-stone-500 dark:text-stone-400">market_insight</span>
          <span className="text-stone-300 dark:text-stone-700 mx-1">|</span>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: seasonColor }} />
            <span className="font-mono text-[10px] text-stone-400">{seasonLabel}</span>
          </div>
        </div>
        <p className="text-[13px] text-stone-700 dark:text-stone-300 leading-relaxed">
          {summary}
        </p>
      </div>
    </div>
  );
}
