import { getDashboardStats } from "@/lib/dashboard";
import { fetchGitHubJobs } from "@/lib/fetch-github-jobs";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { MarketBanner } from "@/components/dashboard/MarketBanner";
import { CategoryBreakdown } from "@/components/dashboard/CategoryBreakdown";
import { MarketChart } from "@/components/dashboard/MarketChart";
import { JobsTable } from "@/components/dashboard/JobsTable";
import { LockedCard } from "@/components/dashboard/LockedCard";
import { DashboardFooter } from "@/components/dashboard/DashboardFooter";

export const revalidate = 3600;

export default async function HomePage() {
  const [dbStats, githubData] = await Promise.all([
    getDashboardStats().catch(() => null),
    fetchGitHubJobs().catch(() => ({
      jobs: [],
      counts: { swe: 0, pm: 0, dsml: 0, quant: 0, hardware: 0, total: 0 },
    })),
  ]);

  const { counts } = githubData;
  const emptyCat = { total: 0, faang: 0, quant: 0, other: 0 };

  // Build trend data from snapshots (will grow daily)
  const trend = (dbStats?.marketTrend ?? []).map((s) => ({
    date: s.date,
    swe: s.usaInternships, // repurpose existing columns for now
    pm: 0,
    dsml: s.usaNewGrad,
    quant: s.intlInternships,
    hardware: s.intlNewGrad,
  }));

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col transition-colors">
      <DashboardHeader />

      {/* Collapsible market trend chart */}
      <MarketBanner trend={trend} />

      {/* Stats bar */}
      <div className="flex items-center gap-3 px-5 lg:px-7 py-3">
        <span className="text-orange-600 font-mono text-xs font-bold">▸</span>
        <span className="font-mono text-xs font-semibold text-stone-950 dark:text-stone-50">
          {counts.total} internships
        </span>
        <span className="text-stone-300 dark:text-stone-700">·</span>
        <span className="text-stone-400 text-[11px]">all roles · updated daily from SimplifyJobs</span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-[6px] h-[6px] rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.4)]" />
          <span className="font-mono text-[10px] text-green-500 tracking-wide">LIVE</span>
        </div>
      </div>

      {/* ─── MAIN: Jobs + Sidebar ─── */}
      <div className="flex-1 px-5 lg:px-7 pb-4">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-3.5">
          {/* Jobs — the hero */}
          <JobsTable postings={githubData.jobs.slice(0, 60)} />

          {/* Sidebar */}
          <div className="flex flex-col gap-3.5">
            <MarketChart
              swe={counts.swe}
              pm={counts.pm}
              dsml={counts.dsml}
              quant={counts.quant}
              hardware={counts.hardware}
              total={counts.total}
            />
            <LockedCard />
          </div>
        </div>
      </div>

      <DashboardFooter />
    </div>
  );
}
