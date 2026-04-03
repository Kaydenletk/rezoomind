import { getDashboardStats } from "@/lib/dashboard";
import { fetchGitHubJobs } from "@/lib/fetch-github-jobs";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { MarketChart } from "@/components/dashboard/MarketChart";
import { JobsTable } from "@/components/dashboard/JobsTable";
import { TopHiring } from "@/components/dashboard/TopHiring";
import { LockedCard } from "@/components/dashboard/LockedCard";
import { DashboardFooter } from "@/components/dashboard/DashboardFooter";

export const revalidate = 3600;

export default async function HomePage() {
  // Fetch from both DB and GitHub in parallel
  const [dbStats, githubData] = await Promise.all([
    getDashboardStats().catch(() => null),
    fetchGitHubJobs().catch(() => ({ jobs: [], counts: { usaInternships: 0, usaNewGrad: 0, intlInternships: 0, intlNewGrad: 0 } })),
  ]);

  // Use GitHub jobs as primary source (always fresh), DB as supplement
  const counts = {
    usaInternships: githubData.counts.usaInternships || dbStats?.categories.usaInternships.total || 0,
    usaNewGrad: githubData.counts.usaNewGrad || dbStats?.categories.usaNewGrad.total || 0,
    intlInternships: githubData.counts.intlInternships || dbStats?.categories.intlInternships.total || 0,
    intlNewGrad: githubData.counts.intlNewGrad || dbStats?.categories.intlNewGrad.total || 0,
  };

  const totalJobs = counts.usaInternships + counts.usaNewGrad + counts.intlInternships + counts.intlNewGrad;
  const topHiring = dbStats?.topHiring ?? [];

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col transition-colors">
      <DashboardHeader />

      {/* Compact status bar */}
      <div className="flex items-center gap-3 px-7 py-3 border-b border-stone-100 dark:border-stone-800">
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

      {/* Main content: Jobs (hero) + Sidebar */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-3.5 p-4 lg:px-7 lg:py-5">
        {/* LEFT: Jobs table — the main content */}
        <JobsTable postings={githubData.jobs.slice(0, 50)} />

        {/* RIGHT: Sidebar — compact widgets */}
        <div className="flex flex-col gap-3.5">
          <MarketChart
            usaInternships={counts.usaInternships}
            usaNewGrad={counts.usaNewGrad}
            intlInternships={counts.intlInternships}
            intlNewGrad={counts.intlNewGrad}
          />
          {topHiring.length > 0 && <TopHiring companies={topHiring} />}
          <LockedCard />
        </div>
      </div>

      <DashboardFooter />
    </div>
  );
}
