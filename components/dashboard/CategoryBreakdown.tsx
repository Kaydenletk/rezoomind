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
}

const CATEGORY_COLORS = {
  "usa-intern": "#3b82f6",
  "usa-newgrad": "#22c55e",
  "intl-intern": "#a855f7",
  "intl-newgrad": "#ef4444",
};

function CategoryRow({ label, color, data }: { label: string; color: string; data: CategoryCount }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-[13px] text-stone-950 font-semibold">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[15px] font-extrabold text-stone-950">{data.total}</span>
        <div className="hidden sm:flex gap-1.5">
          <span className="text-[10px] px-2 py-0.5 border border-blue-200 rounded text-blue-500 bg-blue-50 font-medium">FAANG+ {data.faang}</span>
          <span className="text-[10px] px-2 py-0.5 border border-purple-200 rounded text-purple-500 bg-purple-50 font-medium">Quant {data.quant}</span>
          <span className="text-[10px] px-2 py-0.5 border border-stone-200 rounded text-stone-500 bg-stone-50 font-medium">Other {data.other}</span>
        </div>
      </div>
    </div>
  );
}

export function CategoryBreakdown({ usaInternships, usaNewGrad, intlInternships, intlNewGrad }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 px-7">
      <div className="border-[1.5px] border-stone-200 rounded-[10px] p-5 bg-white">
        <div className="flex items-center gap-2 mb-3.5">
          <span className="text-base">🇺🇸</span>
          <span className="text-sm font-bold text-stone-950">USA Positions</span>
        </div>
        <CategoryRow label="Internships" color={CATEGORY_COLORS["usa-intern"]} data={usaInternships} />
        <div className="border-t border-stone-100" />
        <CategoryRow label="New Graduate" color={CATEGORY_COLORS["usa-newgrad"]} data={usaNewGrad} />
      </div>
      <div className="border-[1.5px] border-stone-200 rounded-[10px] p-5 bg-white">
        <div className="flex items-center gap-2 mb-3.5">
          <span className="text-base">🌐</span>
          <span className="text-sm font-bold text-stone-950">International Positions</span>
        </div>
        <CategoryRow label="Internships" color={CATEGORY_COLORS["intl-intern"]} data={intlInternships} />
        <div className="border-t border-stone-100" />
        <CategoryRow label="New Graduate" color={CATEGORY_COLORS["intl-newgrad"]} data={intlNewGrad} />
      </div>
    </div>
  );
}
