import { getDashboardStats } from "@/lib/dashboard";
import { fetchGitHubJobs } from "@/lib/fetch-github-jobs";
import { computeMarketInsights } from "@/lib/insights";
import { parseDatePostedToAge } from "@/lib/job-priority";
import { SmartFeedShell } from "@/components/smart-feed/SmartFeedShell";
import type { SmartFeedJob } from "@/components/smart-feed/types";

export const revalidate = 3600;

export default async function HomePage() {
  const [dbStats, githubData] = await Promise.all([
    getDashboardStats().catch(() => null),
    fetchGitHubJobs().catch(() => ({
      jobs: [],
      counts: { swe: 0, pm: 0, dsml: 0, quant: 0, hardware: 0, total: 0 },
    })),
  ]);

  const trend = dbStats?.marketTrend ?? [];
  const insights = computeMarketInsights(trend);

  const freshToday = githubData.jobs.filter((j) => {
    const age = parseDatePostedToAge(j.datePosted);
    return age !== null && age <= 1;
  }).length;

  // Map GitHub jobs to SmartFeedJob shape
  const postings: SmartFeedJob[] = githubData.jobs.slice(0, 60).map((j) => ({
    id: j.id,
    company: j.company,
    role: j.role,
    location: j.location,
    url: j.url,
    datePosted: j.datePosted,
    category: j.category,
    tags: null,
    salary: null,
    description: null,
  }));

  return (
    <SmartFeedShell
      postings={postings}
      marketHeat={insights.marketHeat}
      freshToday={freshToday}
      competitionLevel={insights.competitionLevel}
    />
  );
}
