import type { Metadata } from "next";
import { getDashboardStats } from "@/lib/dashboard";
import { fetchGitHubJobs } from "@/lib/fetch-github-jobs";
import { computeMarketInsights } from "@/lib/insights";
import { parseDatePostedToAge } from "@/lib/job-priority";
import { SmartFeedShell } from "@/components/smart-feed/SmartFeedShell";
import type { SmartFeedJob } from "@/components/smart-feed/types";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Smart Job Feed | Rezoomind",
  description:
    "Browse internships and new-grad jobs with AI-powered fit scoring. Filter by role, location, and freshness. Get personalized match recommendations.",
  openGraph: {
    title: "Smart Job Feed | Rezoomind",
    description: "AI-powered internship and new-grad job matching for students.",
    type: "website",
  },
};

export const revalidate = 3600;

export default async function FeedPage() {
  const [dbStats, githubData, latestPosting] = await Promise.all([
    getDashboardStats().catch(() => null),
    fetchGitHubJobs().catch(() => ({
      jobs: [],
      counts: { swe: 0, pm: 0, dsml: 0, quant: 0, hardware: 0, total: 0 },
    })),
    prisma.job_postings
      .findFirst({ orderBy: { created_at: "desc" }, select: { created_at: true } })
      .catch(() => null),
  ]);

  const trend = dbStats?.marketTrend ?? [];
  const insights = computeMarketInsights(trend);

  const refreshedAt = latestPosting?.created_at ? latestPosting.created_at.toISOString() : null;

  const freshToday = githubData.jobs.filter((j) => {
    const age = parseDatePostedToAge(j.datePosted);
    return age !== null && age <= 1;
  }).length;

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
      refreshedAt={refreshedAt}
    />
  );
}
