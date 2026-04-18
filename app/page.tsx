import { getLandingTrustStats } from "@/lib/dashboard";
import { fetchGitHubJobs } from "@/lib/fetch-github-jobs";
import { LandingShell } from "@/components/landing/LandingShell";
import type { LandingRole } from "@/components/landing/RoleRow";
import type { LandingTrustStats } from "@/lib/dashboard";

export const revalidate = 3600;

const TRUST_FALLBACK: LandingTrustStats = {
  totalLive: 0,
  lastSynced: new Date().toISOString(),
  topHiring: [],
  remoteCount: 0,
  h1bCount: 0,
  velocity7d: { newThisWeek: 0, deltaVsLastWeek: 0, daily: [] },
};

export default async function HomePage() {
  const [trustData, githubData] = await Promise.all([
    getLandingTrustStats().catch(() => TRUST_FALLBACK),
    fetchGitHubJobs().catch(() => ({
      jobs: [],
      counts: { swe: 0, pm: 0, dsml: 0, quant: 0, hardware: 0, total: 0 },
    })),
  ]);

  const rawJobs = githubData.jobs.slice(0, 60);

  const initialJobs: LandingRole[] = rawJobs.map((j) => ({
    id: j.id,
    role: j.role,
    company: j.company,
    location: j.location,
    url: j.url,
    datePosted: j.datePosted ?? null,
    tags: [],
  }));

  const liveCount = trustData.totalLive || githubData.counts?.total || initialJobs.length;

  return (
    <LandingShell
      initialJobs={initialJobs}
      liveCount={liveCount}
      trustData={trustData}
    />
  );
}
