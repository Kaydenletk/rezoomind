/**
 * Job Matching Utility
 * Shared algorithm for matching jobs to user/subscriber preferences
 */

export interface Job {
  id: string;
  company: string;
  role: string;
  location: string | null;
  url: string | null;
  tags: string[] | null;
  salary_min?: number | null;
  salary_max?: number | null;
  created_at: string;
}

export interface JobPreferences {
  roles: string[];
  locations: string[];
  keywords: string[];
}

export interface JobMatchResult {
  job: Job;
  score: number;
  matchReasons: string[];
}

/**
 * Match jobs to user preferences using a scoring algorithm
 *
 * Scoring:
 * - Role match: +3 points
 * - Location match: +2 points
 * - Keyword match: +1 point each (max 3 points)
 *
 * @param jobs - List of jobs to match
 * @param preferences - User's job preferences
 * @param excludeJobIds - Set of job IDs to exclude (already sent)
 * @returns Sorted array of matched jobs with scores
 */
export function matchJobsToPreferences(
  jobs: Job[],
  preferences: JobPreferences,
  excludeJobIds: Set<string> = new Set()
): JobMatchResult[] {
  const { roles, locations, keywords } = preferences;

  // If no preferences set, return all jobs with base score
  if (roles.length === 0 && locations.length === 0 && keywords.length === 0) {
    return jobs
      .filter((job) => !excludeJobIds.has(job.id))
      .map((job) => ({ job, score: 1, matchReasons: ["New job"] }));
  }

  return jobs
    .filter((job) => !excludeJobIds.has(job.id))
    .map((job) => {
      let score = 0;
      const matchReasons: string[] = [];

      // Role match: +3 points
      if (roles.length > 0) {
        const matchedRole = roles.find(
          (role) =>
            job.role.toLowerCase().includes(role.toLowerCase()) ||
            job.tags?.some((tag) =>
              tag.toLowerCase().includes(role.toLowerCase())
            )
        );
        if (matchedRole) {
          score += 3;
          matchReasons.push(`Role: ${matchedRole}`);
        }
      }

      // Location match: +2 points
      if (locations.length > 0 && job.location) {
        const matchedLocation = locations.find((loc) => {
          const jobLoc = job.location!.toLowerCase();
          const prefLoc = loc.toLowerCase();

          // Exact match or contains
          if (jobLoc.includes(prefLoc)) return true;

          // Remote/Hybrid special handling
          if (prefLoc === "remote" && jobLoc.includes("remote")) return true;
          if (prefLoc === "hybrid" && jobLoc.includes("hybrid")) return true;

          return false;
        });
        if (matchedLocation) {
          score += 2;
          matchReasons.push(`Location: ${matchedLocation}`);
        }
      }

      // Keyword match: +1 point each (max 3)
      if (keywords.length > 0) {
        const matchedKeywords = keywords.filter((keyword) => {
          const kw = keyword.toLowerCase();
          return (
            job.role.toLowerCase().includes(kw) ||
            job.company.toLowerCase().includes(kw) ||
            job.tags?.some((tag) => tag.toLowerCase().includes(kw))
          );
        });

        const keywordScore = Math.min(matchedKeywords.length, 3);
        score += keywordScore;

        if (matchedKeywords.length > 0) {
          matchReasons.push(`Keywords: ${matchedKeywords.slice(0, 3).join(", ")}`);
        }
      }

      return { job, score, matchReasons };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);
}

/**
 * Get top N matched jobs
 */
export function getTopMatches(
  matches: JobMatchResult[],
  limit: number
): JobMatchResult[] {
  return matches.slice(0, limit);
}

/**
 * Format salary range for display
 */
export function formatSalary(
  salaryMin: number | null | undefined,
  salaryMax: number | null | undefined,
  interval?: string | null
): string | null {
  if (!salaryMin && !salaryMax) return null;

  const formatNum = (n: number) => {
    if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
    return `$${n}`;
  };

  const suffix = interval ? ` ${interval}` : "";

  if (salaryMin && salaryMax) {
    return `${formatNum(salaryMin)} - ${formatNum(salaryMax)}${suffix}`;
  }
  if (salaryMin) {
    return `${formatNum(salaryMin)}+${suffix}`;
  }
  return `Up to ${formatNum(salaryMax!)}${suffix}`;
}
