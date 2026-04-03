import { getDashboardStats } from "@/lib/dashboard";
import { fetchGitHubJobs } from "@/lib/fetch-github-jobs";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { MarketBanner } from "@/components/dashboard/MarketBanner";
import { CategoryBreakdown } from "@/components/dashboard/CategoryBreakdown";
import { JobsTable } from "@/components/dashboard/JobsTable";
import { TopHiring } from "@/components/dashboard/TopHiring";
import { LockedCard } from "@/components/dashboard/LockedCard";
import { DashboardFooter } from "@/components/dashboard/DashboardFooter";

export const revalidate = 3600;

export default async function HomePage() {
  const [dbStats, githubData] = await Promise.all([
    getDashboardStats().catch(() => null),
    fetchGitHubJobs().catch(() => ({
      jobs: [],
      counts: { usaInternships: 0, usaNewGrad: 0, intlInternships: 0, intlNewGrad: 0 },
    })),
  ]);

  const counts = {
    usaInternships: githubData.counts.usaInternships || dbStats?.categories.usaInternships.total || 0,
    usaNewGrad: githubData.counts.usaNewGrad || dbStats?.categories.usaNewGrad.total || 0,
    intlInternships: githubData.counts.intlInternships || dbStats?.categories.intlInternships.total || 0,
    intlNewGrad: githubData.counts.intlNewGrad || dbStats?.categories.intlNewGrad.total || 0,
  };

  const totalJobs = counts.usaInternships + counts.usaNewGrad + counts.intlInternships + counts.intlNewGrad;
  const topHiring = dbStats?.topHiring ?? [];
  const emptyCat = { total: 0, faang: 0, quant: 0, other: 0 };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col transition-colors">
      <DashboardHeader />

      {/* Collapsible market chart — see it once, then dismiss */}
      <MarketBanner />

      {/* Stats bar */}
      <div className="flex items-center gap-3 px-5 lg:px-7 py-3">
        <span className="text-orange-600 font-mono text-xs font-bold">▸</span>
        <span className="font-mono text-xs font-semibold text-stone-950 dark:text-stone-50">
          {totalJobs} positions
        </span>
        <span className="text-stone-300 dark:text-stone-700">·</span>
        <span className="text-stone-400 text-[11px]">updated daily from SimplifyJobs</span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-[6px] h-[6px] rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.4)]" />
          <span className="font-mono text-[10px] text-green-500 tracking-wide">LIVE</span>
        </div>
      </div>

      {/* Category cards — compact inline */}
      <div className="px-5 lg:px-7 pb-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <CategoryBreakdown
            usaInternships={dbStats?.categories.usaInternships ?? { ...emptyCat, total: counts.usaInternships }}
            usaNewGrad={dbStats?.categories.usaNewGrad ?? { ...emptyCat, total: counts.usaNewGrad }}
            intlInternships={dbStats?.categories.intlInternships ?? { ...emptyCat, total: counts.intlInternships }}
            intlNewGrad={dbStats?.categories.intlNewGrad ?? { ...emptyCat, total: counts.intlNewGrad }}
            inline
          />
        </div>
      </div>

      {/* ─── MAIN: Jobs table + sidebar ─── */}
      <div className="flex-1 px-5 lg:px-7 pb-4">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-3.5">
          <JobsTable postings={githubData.jobs.slice(0, 50)} />
          <div className="flex flex-col gap-3.5">
            {topHiring.length > 0 && <TopHiring companies={topHiring} />}
            <LockedCard />
          </div>
        </div>
      </div>

      <DashboardFooter />
    </div>
  );
}
