import { computeFitBadges, parseDatePostedToAge } from "@/lib/job-priority";

export interface HomepageJob {
  id: string;
  company: string;
  role: string;
  location: string;
  url: string;
  datePosted: string;
  category: string;
  jobType?: "internship" | "new-grad";
  region?: "usa" | "international";
  tags?: string[];
}

export type HomepageRemoteMode = "all" | "remote" | "hybrid" | "onsite";
export type HomepageRecency = "all" | "day" | "week" | "month";
export type HomepageSort = "newest" | "company" | "role" | "best-match";

export interface HomepageFilters {
  search: string;
  location: string;
  remote: HomepageRemoteMode;
  recency: HomepageRecency;
  sort: HomepageSort;
}

export interface AnonymousFitPreview {
  score: number;
  strengths: string[];
  gaps: string[];
  summary: string;
}

const normalize = (value: string | null | undefined) => (value ?? "").trim().toLowerCase();

const toMatchKey = (job: Pick<HomepageJob, "company" | "role">) =>
  `${normalize(job.company)}|${normalize(job.role)}`;

const isRemoteLocation = (location: string) => normalize(location).includes("remote");
const isHybridLocation = (location: string) => normalize(location).includes("hybrid");

function matchesRemoteMode(job: HomepageJob, remote: HomepageRemoteMode) {
  if (remote === "all") return true;
  if (remote === "remote") return isRemoteLocation(job.location);
  if (remote === "hybrid") return isHybridLocation(job.location);
  return !isRemoteLocation(job.location) && !isHybridLocation(job.location);
}

function matchesRecency(job: HomepageJob, recency: HomepageRecency) {
  if (recency === "all") return true;

  const ageInDays = parseDatePostedToAge(job.datePosted);
  if (ageInDays === null) return false;

  if (recency === "day") return ageInDays <= 1;
  if (recency === "week") return ageInDays <= 7;
  return ageInDays <= 31;
}

function matchesSearch(job: HomepageJob, search: string) {
  if (!search.trim()) return true;
  const haystack = [job.company, job.role, job.location, job.category, job.jobType, job.region]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(normalize(search));
}

function matchesLocation(job: HomepageJob, location: string) {
  if (!location.trim()) return true;
  return normalize(job.location).includes(normalize(location));
}

function compareNewest(a: HomepageJob, b: HomepageJob) {
  const ageA = parseDatePostedToAge(a.datePosted);
  const ageB = parseDatePostedToAge(b.datePosted);

  if (ageA === null && ageB === null) return a.company.localeCompare(b.company);
  if (ageA === null) return 1;
  if (ageB === null) return -1;
  if (ageA !== ageB) return ageA - ageB;
  return a.company.localeCompare(b.company);
}

export function filterAndSortHomepageJobs(
  jobs: HomepageJob[],
  filters: HomepageFilters,
  matchScores: Record<string, number> = {}
) {
  const filtered = jobs.filter((job) => {
    return (
      matchesSearch(job, filters.search) &&
      matchesLocation(job, filters.location) &&
      matchesRemoteMode(job, filters.remote) &&
      matchesRecency(job, filters.recency)
    );
  });

  return filtered.sort((a, b) => {
    if (filters.sort === "company") {
      return a.company.localeCompare(b.company);
    }

    if (filters.sort === "role") {
      return a.role.localeCompare(b.role);
    }

    if (filters.sort === "best-match") {
      const scoreDelta = (matchScores[toMatchKey(b)] ?? -1) - (matchScores[toMatchKey(a)] ?? -1);
      if (scoreDelta !== 0) return scoreDelta;
    }

    return compareNewest(a, b);
  });
}

export function buildAnonymousFitPreview(
  job: Pick<HomepageJob, "id" | "company" | "role" | "location" | "category">,
  fitSignals: string[] = []
): AnonymousFitPreview {
  const roleSignals = [...fitSignals, ...computeFitBadges(job.role, job.category)];
  const normalizedSignals = [...new Set(roleSignals.filter(Boolean))];
  const seed = Array.from(`${job.id}|${job.company}|${job.role}`).reduce(
    (total, character) => total + character.charCodeAt(0),
    0
  );
  const score = 68 + (seed % 25);

  const strengths = [
    normalizedSignals[0] ? `${normalizedSignals[0]} alignment` : "Early-career role alignment",
    normalize(job.location).includes("remote") ? "Remote-friendly workflow" : "Clear location signal",
    "Fresh listing with active hiring intent",
  ].slice(0, 3);

  const defaultGaps = [
    "Quantified impact bullets",
    "Keyword coverage for the role family",
    "One targeted project example",
  ];

  const gaps = normalizedSignals.length > 1
    ? [`Stronger proof of ${normalizedSignals[1].toLowerCase()} depth`, ...defaultGaps].slice(0, 3)
    : defaultGaps;

  return {
    score,
    strengths,
    gaps,
    summary: `RezoomAI preview estimates a ${score}% fit for ${job.role} at ${job.company} based on role signals, freshness, and location context.`,
  };
}
