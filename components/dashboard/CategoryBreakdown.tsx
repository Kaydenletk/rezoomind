"use client";

interface CategoryCount {
  total: number;
  faang: number;
  quant: number;
  other: number;
}

interface Props {
  usaInternships: CategoryCount;
  usaNewGrad: CategoryCount;
  intlInternships: CategoryCount;
  intlNewGrad: CategoryCount;
  inline?: boolean;
}

const CATEGORY_COLORS = {
  "usa-intern": "#3b82f6",
  "usa-newgrad": "#22c55e",
  "intl-intern": "#a855f7",
  "intl-newgrad": "#ef4444",
};

function CategoryRow({ label, color, data }: { label: string; color: string; data: CategoryCount }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
        <span className="text-[13px] text-stone-950 dark:text-stone-50 font-semibold">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-extrabold text-stone-950 dark:text-stone-50 tabular-nums">{data.total}</span>
        <div className="hidden xl:flex gap-1">
          <span className="text-[9px] px-1.5 py-0.5 border border-blue-200 dark:border-blue-800 rounded text-blue-500 bg-blue-50 dark:bg-blue-950 font-medium tabular-nums">FAANG+ {data.faang}</span>
          <span className="text-[9px] px-1.5 py-0.5 border border-purple-200 dark:border-purple-800 rounded text-purple-500 bg-purple-50 dark:bg-purple-950 font-medium tabular-nums">Quant {data.quant}</span>
        </div>
      </div>
    </div>
  );
}

function Card({ emoji, title, children }: { emoji: string; title: string; children: React.ReactNode }) {
  return (
    <div className="border-[1.5px] border-stone-200 dark:border-stone-800 rounded-[10px] p-4 bg-white dark:bg-stone-900">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm">{emoji}</span>
        <span className="text-xs font-bold text-stone-950 dark:text-stone-50">{title}</span>
      </div>
      {children}
    </div>
  );
}

export function CategoryBreakdown({ usaInternships, usaNewGrad, intlInternships, intlNewGrad, inline }: Props) {
  const usaCard = (
    <Card emoji="🇺🇸" title="USA Positions">
      <CategoryRow label="Internships" color={CATEGORY_COLORS["usa-intern"]} data={usaInternships} />
      <div className="border-t border-stone-100 dark:border-stone-800" />
      <CategoryRow label="New Graduate" color={CATEGORY_COLORS["usa-newgrad"]} data={usaNewGrad} />
    </Card>
  );

  const intlCard = (
    <Card emoji="🌐" title="International">
      <CategoryRow label="Internships" color={CATEGORY_COLORS["intl-intern"]} data={intlInternships} />
      <div className="border-t border-stone-100 dark:border-stone-800" />
      <CategoryRow label="New Graduate" color={CATEGORY_COLORS["intl-newgrad"]} data={intlNewGrad} />
    </Card>
  );

  // inline mode: rendered inside parent grid, no wrapper
  if (inline) {
    return (
      <>
        {usaCard}
        {intlCard}
      </>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 px-7">
      {usaCard}
      {intlCard}
    </div>
  );
}
