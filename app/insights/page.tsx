import { getDashboardStats } from "@/lib/dashboard";
import { computeMarketInsights } from "@/lib/insights";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SmartFeedHeader } from "@/components/smart-feed/SmartFeedHeader";
import { SummaryStrip } from "@/components/dashboard/SummaryStrip";
import { MarketBanner } from "@/components/dashboard/MarketBanner";
import { DashboardFooter } from "@/components/dashboard/DashboardFooter";
import { TrendTable } from "@/components/insights/TrendTable";
import { SeasonCalendar } from "@/components/insights/SeasonCalendar";
import { HistoricalComparison } from "@/components/insights/HistoricalComparison";
import { TipsSection } from "@/components/insights/TipsSection";

export const revalidate = 3600;

export default async function InsightsPage() {
  const [dbStats, session] = await Promise.all([
    getDashboardStats().catch(() => null),
    getServerSession(authOptions).catch(() => null),
  ]);
  const trend = dbStats?.marketTrend ?? [];
  const insights = computeMarketInsights(trend);

  const latestSnap = trend[trend.length - 1];
  const freshToday = latestSnap
    ? (latestSnap.usaInternships ?? 0) +
      (latestSnap.usaNewGrad ?? 0) +
      (latestSnap.intlInternships ?? 0) +
      (latestSnap.intlNewGrad ?? 0)
    : 0;

  const user = session?.user ?? null;

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col transition-colors">
      <SmartFeedHeader user={user} />
      <SummaryStrip
        marketHeat={insights.marketHeat}
        freshToday={freshToday}
        competitionLevel={insights.competitionLevel}
      />

      <div className="flex-1 max-w-4xl mx-auto w-full px-5 lg:px-7 py-6 space-y-6">
        {/* 1. Market Status Hero */}
        <div className="border-[1.5px] border-stone-200 dark:border-stone-800 rounded-[10px] bg-white dark:bg-stone-900 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <span className="text-orange-600 font-mono text-xs font-bold">▸</span>
              <span className="font-mono text-[11px] text-stone-500 dark:text-stone-400">market_status</span>
            </div>
            <span className="text-[10px] text-stone-400 font-mono">
              Last updated: {dbStats?.lastSynced ? new Date(dbStats.lastSynced).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
            </span>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: insights.seasonColor }} />
            <span className="font-mono text-lg font-bold text-stone-950 dark:text-stone-50">{insights.seasonLabel}</span>
          </div>
          <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">{insights.recommendation}</p>
        </div>

        {/* 2. Trend Table */}
        <TrendTable trends={insights.trends} yoy={insights.yoy} />

        {/* 3. Market Chart (non-collapsible) */}
        <MarketBanner trend={trend} collapsible={false} />

        {/* 4. Seasonal Calendar */}
        <SeasonCalendar />

        {/* 5. Historical Comparison */}
        <HistoricalComparison yoy={insights.yoy} />

        {/* 6. Tips */}
        <TipsSection
          hottestCategory={insights.hottestCategory}
          hottestMom={insights.trends.find((t) => t.category === insights.hottestCategory)?.momChange ?? 0}
        />
      </div>

      <DashboardFooter />
    </div>
  );
}
