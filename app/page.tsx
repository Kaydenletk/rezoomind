import { getLandingTrustStats } from "@/lib/dashboard";
import { fetchDbJobs, type DbFeedJob } from "@/lib/fetch-db-jobs";
import { fetchGitHubJobs, type GitHubJob } from "@/lib/fetch-github-jobs";
import { getTipForDate } from "@/lib/insider-tips";
import { LandingShell } from "@/components/landing/LandingShell";
import type { LandingRole, RoleCategory } from "@/components/landing/RoleRow";
import type { LandingTrustStats } from "@/lib/dashboard";

const VALID_CATEGORIES: ReadonlySet<RoleCategory> = new Set([
  "swe",
  "pm",
  "dsml",
  "quant",
  "hardware",
  "other",
]);

function normalizeCategory(raw: string | undefined): RoleCategory {
  if (!raw) return "other";
  const lc = raw.toLowerCase();
  return VALID_CATEGORIES.has(lc as RoleCategory) ? (lc as RoleCategory) : "other";
}

export const revalidate = 3600;

const TRUST_FALLBACK: LandingTrustStats = {
  totalLive: 0,
  lastSynced: new Date().toISOString(),
  topHiring: [],
  remoteCount: 0,
  h1bCount: 0,
  velocity7d: { newThisWeek: 0, deltaVsLastWeek: 0, daily: [] },
};

const FEED_DISPLAY_LIMIT = 80;

function dbRowToLandingRole(j: DbFeedJob): LandingRole {
  return {
    id: j.id,
    role: j.role,
    company: j.company,
    location: j.location,
    url: j.url,
    datePosted: j.datePosted || null,
    tags: j.tags ?? [],
    category: normalizeCategory(j.category),
  };
}

function ghRowToLandingRole(j: GitHubJob): LandingRole {
  return {
    id: j.id,
    role: j.role,
    company: j.company,
    location: j.location,
    url: j.url,
    datePosted: j.datePosted || null,
    tags: j.tags ?? [],
    category: normalizeCategory(j.category),
  };
}

export default async function HomePage() {
  const [trustData, dbData] = await Promise.all([
    getLandingTrustStats().catch(() => TRUST_FALLBACK),
    fetchDbJobs(FEED_DISPLAY_LIMIT).catch(() => ({ jobs: [], total: 0, newGradTotal: 0 })),
  ]);

  // Fall back to live GitHub fetch only when the DB is unreachable or empty
  // (e.g. fresh environments, broken cron). Keeps the homepage from ever going dark.
  let initialJobs: LandingRole[];
  let liveCount: number;
  if (dbData.jobs.length > 0) {
    initialJobs = dbData.jobs.map(dbRowToLandingRole);
    liveCount = dbData.total;
  } else {
    const githubData = await fetchGitHubJobs().catch(() => ({
      jobs: [] as GitHubJob[],
      counts: { swe: 0, pm: 0, dsml: 0, quant: 0, hardware: 0, total: 0 },
    }));
    initialJobs = githubData.jobs.slice(0, FEED_DISPLAY_LIMIT).map(ghRowToLandingRole);
    liveCount = trustData.totalLive || githubData.counts?.total || initialJobs.length;
  }

  if (!liveCount) liveCount = trustData.totalLive || initialJobs.length;
  const insiderTip = getTipForDate();

  return (
    <LandingShell
      initialJobs={initialJobs}
      liveCount={liveCount}
      trustData={trustData}
      insiderTip={insiderTip}
    />
  );
}
