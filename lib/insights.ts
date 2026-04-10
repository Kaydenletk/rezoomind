// lib/insights.ts

type MarketTrendPoint = {
  date: string;
  usaInternships: number;
  usaNewGrad: number;
  intlInternships: number;
  intlNewGrad: number;
};

interface TrendItem {
  category: string;
  key: keyof Omit<MarketTrendPoint, "date">;
  current: number;
  thirtyDaysAgo: number;
  momChange: number;
}

interface YoyItem {
  category: string;
  current: number;
  lastYear: number | null;
  yoyChange: number | null;
}

export interface MarketInsights {
  season: "peak" | "winding-down" | "lull" | "ramping-up";
  seasonLabel: string;
  seasonColor: string;
  monthsUntilPeak: number;
  trends: TrendItem[];
  yoy: YoyItem[];
  hottestCategory: string;
  recommendation: string;
  shortRecommendation: string;
  marketHeat: "slow" | "normal" | "hot";
  competitionLevel: "low" | "medium" | "high";
  plainEnglishSummary: string;
  weeklyGuidance: string;
}

const CATEGORIES: Array<{ label: string; key: keyof Omit<MarketTrendPoint, "date"> }> = [
  { label: "USA Internships", key: "usaInternships" },
  { label: "USA New Grad", key: "usaNewGrad" },
  { label: "Intl Internships", key: "intlInternships" },
  { label: "Intl New Grad", key: "intlNewGrad" },
];

function getSeason(month: number): MarketInsights["season"] {
  if ([8, 9, 10, 11, 0].includes(month)) return "peak";
  if ([1, 2].includes(month)) return "winding-down";
  if ([7].includes(month)) return "ramping-up";
  return "lull";
}

const SEASON_META: Record<MarketInsights["season"], { label: string; color: string }> = {
  "peak": { label: "Peak Season", color: "#22c55e" },
  "winding-down": { label: "Winding Down", color: "#f97316" },
  "lull": { label: "Seasonal Lull", color: "#eab308" },
  "ramping-up": { label: "Ramping Up", color: "#3b82f6" },
};

function monthsUntilSeptember(now: Date): number {
  const month = now.getMonth();
  if ([8, 9, 10, 11, 0].includes(month)) return 0;
  return month <= 8 ? 8 - month : 8 + 12 - month;
}

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function findClosestSnapshot(trend: MarketTrendPoint[], targetDate: string): MarketTrendPoint | null {
  if (trend.length === 0) return null;
  let closest = trend[0];
  let minDiff = Math.abs(new Date(trend[0].date).getTime() - new Date(targetDate).getTime());
  for (const point of trend) {
    const diff = Math.abs(new Date(point.date).getTime() - new Date(targetDate).getTime());
    if (diff < minDiff) { minDiff = diff; closest = point; }
  }
  return minDiff <= 7 * 24 * 60 * 60 * 1000 ? closest : null;
}

function buildRecommendation(
  season: MarketInsights["season"],
  hottestCategory: string,
  hottestMom: number,
  hottestCurrent: number,
  trendingUp: boolean,
): { recommendation: string; shortRecommendation: string } {
  const templates: Record<string, { long: string; short: string }> = {
    "lull-down": {
      long: "The market is in its seasonal lull. Historically, postings surge around September. Use this time to prep your resume and practice interviews.",
      short: "Prep season — polish resume, practice interviews.",
    },
    "lull-up": {
      long: `Even in the lull, ${hottestCategory} is trending up (${hottestMom}%). Some companies post early — keep an eye out for early openers.`,
      short: `${hottestCategory} trending up — watch for early postings.`,
    },
    "ramping-up": {
      long: `The market is heating up. ${hottestCategory} postings increased ${hottestMom}% this month. Get your applications ready — early applicants get first looks.`,
      short: "Market heating up — get applications ready.",
    },
    "peak-up": {
      long: `Peak recruiting season is underway. ${hottestCategory} are up ${hottestMom}% this month. Apply within 48 hours of new postings for best chances.`,
      short: "Peak season — apply within 48hrs of new postings.",
    },
    "peak-down": {
      long: "We're in peak season but postings are tapering. Most positions fill by January — don't delay applications.",
      short: "Peak season tapering — don't delay applications.",
    },
    "winding-down": {
      long: `Peak season is winding down. Late-cycle positions often have less competition. ${hottestCategory} still has ${hottestCurrent} active postings.`,
      short: "Late-cycle positions — less competition now.",
    },
  };

  let key: string;
  if (season === "ramping-up" || season === "winding-down") {
    key = season;
  } else {
    key = `${season}-${trendingUp ? "up" : "down"}`;
  }

  const tmpl = templates[key] ?? templates["lull-down"];
  return { recommendation: tmpl.long, shortRecommendation: tmpl.short };
}

function deriveMarketHeat(
  season: MarketInsights["season"],
  trendingUpCount: number,
): MarketInsights["marketHeat"] {
  if (season === "peak" || (season === "ramping-up" && trendingUpCount >= 3)) return "hot";
  if (season === "lull" && trendingUpCount <= 1) return "slow";
  return "normal";
}

function deriveCompetitionLevel(
  season: MarketInsights["season"],
  trendingUpCount: number,
): MarketInsights["competitionLevel"] {
  // Peak + declining = fewer slots, more competition
  if (season === "peak" && trendingUpCount <= 1) return "high";
  if (season === "winding-down") return "high";
  if (season === "lull") return "low";
  return "medium";
}

function buildPlainEnglishSummary(
  season: MarketInsights["season"],
  hottestCategory: string,
  hottestMom: number,
  trendingUp: boolean,
): string {
  if (season === "peak" && trendingUp) {
    return `Peak hiring season is underway with ${hottestCategory} leading at +${hottestMom}%. New roles are being posted daily — apply within 48 hours for best odds.`;
  }
  if (season === "peak" && !trendingUp) {
    return "We're in peak season but postings are starting to taper. Roles posted now tend to fill fast — prioritize fresh listings.";
  }
  if (season === "winding-down") {
    return `Peak season is winding down, but late-cycle roles often see less competition. ${hottestCategory} still has active openings worth targeting.`;
  }
  if (season === "ramping-up") {
    return `The market is heating up as companies start posting early. ${hottestCategory} is leading the ramp — get your resume ready now.`;
  }
  // lull
  if (trendingUp) {
    return `The market is in a seasonal lull, but ${hottestCategory} is trending up (+${hottestMom}%). Some companies post early — watch for these opportunities.`;
  }
  return "Internship postings are in a seasonal lull. Use this time to polish your resume and practice interviews — peak season starts around September.";
}

function buildWeeklyGuidance(
  season: MarketInsights["season"],
  trendingUp: boolean,
): string {
  if (season === "peak") {
    return "Focus on roles posted in the last 72 hours. Speed matters most during peak season — apply early, tailor your resume to each JD.";
  }
  if (season === "winding-down") {
    return "Late-cycle roles have less competition. Target companies still actively posting and follow up within 5 days if you don't hear back.";
  }
  if (season === "ramping-up") {
    return "Early postings are appearing. Get your resume polished and start applying to stand out before the September rush.";
  }
  // lull
  if (trendingUp) {
    return "Some companies are posting early. Apply to any fresh roles you see, but also invest time in resume optimization and interview practice.";
  }
  return "Prep season — polish your resume, practice behavioral interviews, and build projects. You'll be ready when postings surge in September.";
}

export function computeMarketInsights(trend: MarketTrendPoint[]): MarketInsights {
  const now = new Date();
  const month = now.getMonth();
  const season = getSeason(month);
  const meta = SEASON_META[season];

  if (trend.length < 2) {
    const { recommendation, shortRecommendation } = buildRecommendation(season, "USA Internships", 0, 0, false);
    return {
      season,
      seasonLabel: meta.label,
      seasonColor: meta.color,
      monthsUntilPeak: monthsUntilSeptember(now),
      trends: CATEGORIES.map((c) => ({ category: c.label, key: c.key, current: 0, thirtyDaysAgo: 0, momChange: 0 })),
      yoy: CATEGORIES.map((c) => ({ category: c.label, current: 0, lastYear: null, yoyChange: null })),
      hottestCategory: "USA Internships",
      recommendation,
      shortRecommendation,
      marketHeat: deriveMarketHeat(season, 0),
      competitionLevel: deriveCompetitionLevel(season, 0),
      plainEnglishSummary: buildPlainEnglishSummary(season, "USA Internships", 0, false),
      weeklyGuidance: buildWeeklyGuidance(season, false),
    };
  }

  const latest = trend[trend.length - 1];

  const thirtyDaysAgoDate = new Date(now);
  thirtyDaysAgoDate.setDate(thirtyDaysAgoDate.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgoDate.toISOString().split("T")[0];
  const thirtyDaysAgoSnap = findClosestSnapshot(trend, thirtyDaysAgoStr);

  const trends: TrendItem[] = CATEGORIES.map((c) => {
    const current = latest[c.key];
    const prev = thirtyDaysAgoSnap?.[c.key] ?? current;
    return { category: c.label, key: c.key, current, thirtyDaysAgo: prev, momChange: pctChange(current, prev) };
  });

  const oneYearAgoDate = new Date(now);
  oneYearAgoDate.setFullYear(oneYearAgoDate.getFullYear() - 1);
  const oneYearAgoStr = oneYearAgoDate.toISOString().split("T")[0];
  const oneYearAgoSnap = findClosestSnapshot(trend, oneYearAgoStr);

  const yoy: YoyItem[] = CATEGORIES.map((c) => {
    const current = latest[c.key];
    const lastYear = oneYearAgoSnap?.[c.key] ?? null;
    return {
      category: c.label,
      current,
      lastYear,
      yoyChange: lastYear !== null ? pctChange(current, lastYear) : null,
    };
  });

  const hottest = [...trends].sort((a, b) => b.momChange - a.momChange)[0];
  const trendingUpCount = trends.filter((t) => t.momChange > 0).length;
  const trendingUp = trendingUpCount >= 2;

  const { recommendation, shortRecommendation } = buildRecommendation(
    season, hottest.category, hottest.momChange, hottest.current, trendingUp
  );

  return {
    season,
    seasonLabel: meta.label,
    seasonColor: meta.color,
    monthsUntilPeak: monthsUntilSeptember(now),
    trends,
    yoy,
    hottestCategory: hottest.category,
    recommendation,
    shortRecommendation,
    marketHeat: deriveMarketHeat(season, trendingUpCount),
    competitionLevel: deriveCompetitionLevel(season, trendingUpCount),
    plainEnglishSummary: buildPlainEnglishSummary(season, hottest.category, hottest.momChange, trendingUp),
    weeklyGuidance: buildWeeklyGuidance(season, trendingUp),
  };
}
