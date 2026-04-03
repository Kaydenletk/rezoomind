const BAR_COLORS = ["bg-orange-600", "bg-orange-400", "bg-orange-300", "bg-orange-200", "bg-orange-100"];

export function TopHiring({ companies }: { companies: Array<{ company: string; count: number }> }) {
  const max = companies[0]?.count ?? 1;
  return (
    <div className="border-[1.5px] border-stone-200 rounded-[10px] p-5 bg-white">
      <div className="flex items-center gap-1.5 mb-3.5">
        <span className="text-orange-600 font-mono text-xs">▸</span>
        <span className="font-mono text-[13px] font-bold text-stone-950">top_hiring</span>
      </div>
      <div className="space-y-3">
        {companies.map((c, i) => (
          <div key={c.company}>
            <div className="flex justify-between mb-1">
              <span className="text-[11px] text-stone-700 font-medium">{c.company}</span>
              <span className="text-[11px] text-orange-600 font-bold">{c.count}</span>
            </div>
            <div className="h-[5px] bg-stone-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${BAR_COLORS[i] ?? "bg-orange-100"}`} style={{ width: `${(c.count / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
