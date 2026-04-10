import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SeoLandingPage } from "@/components/dashboard/SeoLandingPage";
import { computeMarketInsights } from "@/lib/insights";
import { computeFitBadges, computeJobPriority, parseDatePostedToAge } from "@/lib/job-priority";
import { getDashboardStats } from "@/lib/dashboard";
import { type HomepageJob } from "@/lib/homepage-discovery";
import { getPublicJobInventory } from "@/lib/public-jobs";
import {
  filterJobsForLandingPage,
  getLandingPageConfig,
  getLandingPageConfigs,
} from "@/lib/seo-landing-pages";

export const revalidate = 3600;

type LandingPageProps = {
  params: Promise<{ landingSlug: string }>;
};

export async function generateStaticParams() {
  return getLandingPageConfigs().map((config) => ({
    landingSlug: config.slug,
  }));
}

export async function generateMetadata({ params }: LandingPageProps): Promise<Metadata> {
  const { landingSlug } = await params;
  const config = getLandingPageConfig(landingSlug);

  if (!config) {
    return {};
  }

  // SEO-optimized title: Primary keyword first, brand last
  const seoTitle = `${config.title} 2026 | Browse & Apply | Rezoomind`;

  return {
    title: seoTitle,
    description: config.description,
    openGraph: {
      title: seoTitle,
      description: config.description,
      type: "website",
    },
    alternates: {
      canonical: `https://rezoomind.vercel.app/${config.slug}`,
    },
  };
}

export default async function LandingSlugPage({ params }: LandingPageProps) {
  const { landingSlug } = await params;
  const config = getLandingPageConfig(landingSlug);

  if (!config) {
    notFound();
  }

  const [dbStats, inventory] = await Promise.all([
    getDashboardStats().catch(() => null),
    getPublicJobInventory(),
  ]);

  const filtered = filterJobsForLandingPage(inventory.jobs, config)
    .slice(0, 60)
    .map<HomepageJob>((job) => ({
      ...job,
      location: job.location || "Unknown",
      url: job.url || "",
    }));

  if (filtered.length === 0) {
    notFound();
  }

  const trend = dbStats?.marketTrend ?? [];
  const insights = computeMarketInsights(trend);
  const priorities: Record<string, ReturnType<typeof computeJobPriority>> = {};
  const fitBadges: Record<string, string[]> = {};

  for (const job of filtered) {
    priorities[job.id] = computeJobPriority(job.datePosted, job.category, insights.trends);
    fitBadges[job.id] = computeFitBadges(job.role, job.category);
  }

  const freshToday = filtered.filter((job) => {
    const age = parseDatePostedToAge(job.datePosted);
    return age !== null && age <= 1;
  }).length;

  const remoteCount = filtered.filter((job) => job.location.toLowerCase().includes("remote")).length;
  const newGradCount = filtered.filter((job) => job.jobType === "new-grad").length;
  const relatedPages = getLandingPageConfigs().filter((page) => config.relatedSlugs.includes(page.slug));

  return (
    <SeoLandingPage
      config={config}
      jobs={filtered}
      relatedPages={relatedPages}
      priorities={priorities}
      fitBadges={fitBadges}
      freshToday={freshToday}
      remoteCount={remoteCount}
      newGradCount={newGradCount}
    />
  );
}
