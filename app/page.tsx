import { getDashboardStats } from "@/lib/dashboard";
import { fetchGitHubJobs } from "@/lib/fetch-github-jobs";
import { LandingShell } from "@/components/landing/LandingShell";
import type { LandingRole } from "@/components/landing/RoleRow";

export const revalidate = 3600;

export default async function HomePage() {
  const [dbStats, githubData] = await Promise.all([
    getDashboardStats().catch(() => null),
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

  const liveCount =
    (dbStats && "totalLive" in dbStats && typeof dbStats.totalLive === "number"
      ? dbStats.totalLive
      : githubData.counts?.total) ?? initialJobs.length;

  return <LandingShell initialJobs={initialJobs} liveCount={liveCount} />;
}
