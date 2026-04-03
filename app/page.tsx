import { getDashboardStats } from "@/lib/dashboard";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { CategoryBreakdown } from "@/components/dashboard/CategoryBreakdown";
import { MarketChart } from "@/components/dashboard/MarketChart";
import { JobsTable } from "@/components/dashboard/JobsTable";
import { TopHiring } from "@/components/dashboard/TopHiring";
import { LockedCard } from "@/components/dashboard/LockedCard";
import { DashboardFooter } from "@/components/dashboard/DashboardFooter";

export const revalidate = 3600; // ISR: regenerate every hour

const EMPTY_CATEGORY = { total: 0, faang: 0, quant: 0, other: 0 };

const FALLBACK_STATS = {
  categories: {
    usaInternships: EMPTY_CATEGORY,
    usaNewGrad: EMPTY_CATEGORY,
    intlInternships: EMPTY_CATEGORY,
    intlNewGrad: EMPTY_CATEGORY,
  },
  totalJobs: 0,
  recentPostings: [],
  topHiring: [],
  marketTrend: [],
  lastSynced: new Date().toISOString(),
};

export default async function HomePage() {
  let stats = FALLBACK_STATS;
  try {
    stats = await getDashboardStats();
  } catch (e) {
    console.error("Dashboard data fetch failed:", e);
  }

  const syncMs = Date.now() - new Date(stats.lastSynced).getTime();
  const syncHours = Math.floor(syncMs / 3600000);
  const syncLabel = syncHours < 1 ? "<1h" : `${syncHours}h`;

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <DashboardHeader />

      {/* Status line */}
      <div className="flex items-center gap-2 px-7 pt-5 pb-2">
        <span className="text-orange-600 font-mono text-[13px] font-bold">▸</span>
        <span className="font-mono text-[13px] font-semibold text-stone-950">internship_market</span>
        <span className="text-stone-400">—</span>
        <span className="text-stone-400 text-xs">real-time data · synced {syncLabel} ago</span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-[7px] h-[7px] rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.4)]" />
          <span className="font-mono text-[11px] text-green-500 tracking-wide">LIVE</span>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="pt-3 pb-4">
        <CategoryBreakdown
          usaInternships={stats.categories.usaInternships}
          usaNewGrad={stats.categories.usaNewGrad}
          intlInternships={stats.categories.intlInternships}
          intlNewGrad={stats.categories.intlNewGrad}
        />
      </div>

      {/* Market Chart */}
      <div className="pb-3.5">
        <MarketChart data={stats.marketTrend} />
      </div>

      {/* Bottom Bento: Jobs + Top Hiring + Locked */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_1.2fr_1fr] gap-3.5 px-7 pb-4">
        <JobsTable postings={stats.recentPostings} />
        <TopHiring companies={stats.topHiring} />
        <LockedCard />
      </div>

      <div className="mt-auto">
        <DashboardFooter />
      </div>
    </div>
  );
}
