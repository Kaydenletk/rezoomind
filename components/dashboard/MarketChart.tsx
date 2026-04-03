"use client";

export function MarketChart() {
  return (
    <div
      id="insights"
      className="border-[1.5px] border-stone-200 dark:border-stone-800 rounded-[10px] p-6 bg-white dark:bg-stone-900 mx-7"
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="text-orange-600 font-mono text-[13px]">▸</span>
        <span className="font-mono text-[15px] font-bold text-stone-950 dark:text-stone-50">
          Software Engineering College Job Market
        </span>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://www.speedyapply.com/api/jobs/chart"
        alt="Software Engineering College Job Market — USA Internships, USA New Grad, International Internships, International New Grad"
        className="w-full rounded-lg"
        loading="lazy"
      />
      <div className="mt-3 text-[10px] text-stone-400 dark:text-stone-500 font-mono text-right">
        source: speedyapply.com · updated daily
      </div>
    </div>
  );
}
