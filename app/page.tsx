import { getDashboardStats } from "@/lib/dashboard";
import { fetchGitHubJobs } from "@/lib/fetch-github-jobs";
import { computeMarketInsights } from "@/lib/insights";
import { computeJobPriority, computeFitBadges, parseDatePostedToAge } from "@/lib/job-priority";
import { SummaryStrip } from "@/components/dashboard/SummaryStrip";
import { MainInsightCard } from "@/components/dashboard/MainInsightCard";
import { MarketBanner } from "@/components/dashboard/MarketBanner";
import { InsightCards } from "@/components/dashboard/InsightCards";
import { HomeClientShell } from "@/components/dashboard/HomeClientShell";

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
  const trend = dbStats?.marketTrend ?? [];
  const insights = computeMarketInsights(trend);
  const displayJobs = githubData.jobs.slice(0, 60);

  const freshToday = displayJobs.filter((j) => {
    const age = parseDatePostedToAge(j.datePosted);
    return age !== null && age <= 1;
  }).length;

  const priorities: Record<string, ReturnType<typeof computeJobPriority>> = {};
  const fitBadges: Record<string, string[]> = {};
  for (const job of displayJobs) {
    priorities[job.id] = computeJobPriority(job.datePosted, job.category, insights.trends);
    fitBadges[job.id] = computeFitBadges(job.role, job.category);
  }

  return (
    <HomeClientShell
      postings={displayJobs}
      priorities={priorities}
      fitBadges={fitBadges}
      counts={counts}
    >
      <SummaryStrip
        marketHeat={insights.marketHeat}
        freshToday={freshToday}
        competitionLevel={insights.competitionLevel}
      />
      <MainInsightCard
        summary={insights.plainEnglishSummary}
        seasonLabel={insights.seasonLabel}
        seasonColor={insights.seasonColor}
      />
      <MarketBanner trend={trend} />
      <InsightCards insights={insights} />

      {/* Stats bar */}
      <div className="flex items-center gap-3 px-5 lg:px-7 py-3">
        <span className="text-orange-600 font-mono text-xs font-bold">▸</span>
        <span className="font-mono text-xs font-semibold text-stone-950 dark:text-stone-50">
          {counts.total} internships
        </span>
        <span className="text-stone-300 dark:text-stone-700">·</span>
        <span className="text-stone-400 text-[11px]">5 categories · updated daily from SimplifyJobs</span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-[6px] h-[6px] rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.4)]" />
          <span className="font-mono text-[10px] text-green-500 tracking-wide">LIVE</span>
        </div>
      </div>
    </HomeClientShell>
  );
}
