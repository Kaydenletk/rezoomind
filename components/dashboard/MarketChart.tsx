"use client";

interface Props {
  usaInternships: number;
  usaNewGrad: number;
  intlInternships: number;
  intlNewGrad: number;
}

const CATEGORIES = [
  { key: "usaInternships", label: "USA Intern", color: "#3b82f6" },
  { key: "usaNewGrad", label: "USA New Grad", color: "#22c55e" },
  { key: "intlInternships", label: "Intl Intern", color: "#a855f7" },
  { key: "intlNewGrad", label: "Intl New Grad", color: "#ef4444" },
] as const;

export function MarketChart(props: Props) {
  const total = props.usaInternships + props.usaNewGrad + props.intlInternships + props.intlNewGrad;
  const max = Math.max(props.usaInternships, props.usaNewGrad, props.intlInternships, props.intlNewGrad, 1);

  return (
    <div className="border-[1.5px] border-stone-200 dark:border-stone-800 rounded-[10px] p-4 bg-white dark:bg-stone-900">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <span className="text-orange-600 font-mono text-xs">▸</span>
          <span className="font-mono text-xs font-bold text-stone-950 dark:text-stone-50">market_overview</span>
        </div>
        <span className="text-[10px] text-stone-400 font-mono">{total} total</span>
      </div>

      {/* Horizontal bar chart — compact */}
      <div className="space-y-2">
        {CATEGORIES.map((cat) => {
          const value = props[cat.key];
          const pct = (value / max) * 100;
          return (
            <div key={cat.key}>
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-[10px] text-stone-600 dark:text-stone-400">{cat.label}</span>
                </div>
                <span className="text-[10px] font-bold text-stone-950 dark:text-stone-100 font-mono">{value}</span>
              </div>
              <div className="h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, backgroundColor: cat.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
