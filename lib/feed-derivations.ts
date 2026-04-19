import { FEED_COPY } from "@/components/smart-feed/copy";
import type { JobMatch, SmartFeedJob } from "@/components/smart-feed/types";

export type JobStatus = "new" | "saved" | "applied";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export function deriveStatus(
  job: SmartFeedJob,
  savedIds: Set<string>,
  appliedIds: Set<string>,
  now: number = Date.now()
): JobStatus | null {
  if (appliedIds.has(job.id)) return "applied";
  if (savedIds.has(job.id)) return "saved";
  if (!job.datePosted) return null;
  const parsed = new Date(job.datePosted).getTime();
  if (isNaN(parsed)) return null;
  if (now - parsed <= ONE_DAY_MS) return "new";
  return null;
}

export function deriveAIReason(match: JobMatch | null | undefined): string | null {
  if (!match || match.matchScore == null) return null;
  const matched = match.matchReasons ?? [];
  const missing = match.missingSkills ?? [];
  const score = match.matchScore;

  if (score >= 75) {
    const skills = matched.slice(0, 3);
    const firstMissing = missing[0] ?? "";
    if (skills.length === 0) return null;
    return FEED_COPY.aiReason.strong(skills, firstMissing);
  }

  if (score >= 50) {
    const skills = matched.slice(0, 3);
    const gaps = missing.slice(0, 2);
    if (skills.length === 0) return null;
    return FEED_COPY.aiReason.partial(skills, gaps);
  }

  return FEED_COPY.aiReason.weak(matched.length);
}
