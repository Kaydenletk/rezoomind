// lib/job-priority.ts — Pure functions for job priority badges and fit badges

export interface PriorityBadge {
  label: "Apply today" | "High priority" | "Competitive";
  tier: "urgent" | "high" | "medium";
}

interface TrendItem {
  category: string;
  momChange: number;
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/**
 * Parse SimplifyJobs date format ("Jun 03", "Dec 25") into age in days.
 * Returns null for unparseable dates.
 */
export function parseDatePostedToAge(datePosted: string): number | null {
  if (!datePosted || datePosted === "—") return null;

  const parts = datePosted.trim().split(/\s+/);
  if (parts.length < 2) return null;

  const monthIdx = MONTH_NAMES.indexOf(parts[0]);
  if (monthIdx === -1) return null;

  const day = parseInt(parts[1], 10);
  if (isNaN(day) || day < 1 || day > 31) return null;

  const now = new Date();
  let year = now.getFullYear();
  const candidate = new Date(year, monthIdx, day);

  // If the parsed date is in the future, it was from last year
  if (candidate.getTime() > now.getTime() + 86400000) {
    year -= 1;
  }

  const posted = new Date(year, monthIdx, day);
  const diffMs = now.getTime() - posted.getTime();
  return Math.max(0, Math.floor(diffMs / 86400000));
}

/**
 * Compute a priority badge based on posting age and market trend.
 * Categories with declining trends get a one-tier boost (fewer openings = act faster).
 */
export function computeJobPriority(
  datePosted: string,
  _category: string,
  trends: TrendItem[],
): PriorityBadge | null {
  const ageDays = parseDatePostedToAge(datePosted);
  if (ageDays === null) return null;

  // Check if the overall market is declining (majority of categories trending down)
  const decliningCount = trends.filter((t) => t.momChange < 0).length;
  const marketDeclining = decliningCount >= 3;

  // Base tier from age
  if (ageDays <= 1) {
    return { label: "Apply today", tier: "urgent" };
  }
  if (ageDays <= 3) {
    // Boost to urgent if market is declining
    return marketDeclining
      ? { label: "Apply today", tier: "urgent" }
      : { label: "High priority", tier: "high" };
  }
  if (ageDays <= 7) {
    return marketDeclining
      ? { label: "High priority", tier: "high" }
      : { label: "Competitive", tier: "medium" };
  }

  return null; // Older than 7 days: no badge
}

/**
 * Generate fit badges from role text and category.
 * These are generic (no user resume needed) — purely role-based.
 */
export function computeFitBadges(role: string, category: string): string[] {
  const badges: string[] = [];
  const lower = role.toLowerCase();

  // Role-specific badges
  if (/backend|server|api|infra/.test(lower)) badges.push("Backend");
  else if (/frontend|react|ui|ux/.test(lower)) badges.push("Frontend");
  else if (/full[\s-]?stack/.test(lower)) badges.push("Full-stack");
  else if (/data|ml|machine learning|ai\b|deep learning/.test(lower)) badges.push("DS/ML");
  else if (/quant|trading|strat/.test(lower)) badges.push("Quant");
  else if (/hardware|firmware|embedded/.test(lower)) badges.push("Hardware");
  else if (/devops|sre|cloud|platform/.test(lower)) badges.push("Platform");
  else if (/mobile|ios|android/.test(lower)) badges.push("Mobile");
  else if (/security|cyber/.test(lower)) badges.push("Security");

  // Category-based fallback
  if (badges.length === 0) {
    const catBadge: Record<string, string> = {
      swe: "SWE",
      pm: "PM",
      dsml: "DS/ML",
      quant: "Quant",
      hardware: "Hardware",
    };
    if (catBadge[category]) badges.push(catBadge[category]);
  }

  return badges.slice(0, 2);
}
