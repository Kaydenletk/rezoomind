// Pure utilities shared by the jobs and dashboard surfaces.
// No React, no DOM, no network — safe for unit tests.

export interface JobLike {
  id: string;
  role: string;
  company: string;
  location?: string | null;
  url?: string | null;
  description?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_interval?: string | null;
  tags?: string[] | null;
  date_posted?: string | null;
  created_at: string;
}

export interface UserPreferences {
  interested_roles: string[];
  preferred_locations: string[];
  keywords: string[];
}

export interface PreferenceMatch {
  roleMatch: string | null;
  locationMatch: string | null;
  keywordMatch: string[];
}

export interface EstimatedInsight {
  score: number;
  scoreSource: 'estimated';
  matchReasons: string[];
  missingSkills: string[];
}

export const ROLE_CATEGORIES = [
  { value: 'all', label: 'All Roles', matchers: [] as string[] },
  { value: 'software', label: 'Software Engineering', matchers: ['software', 'engineer', 'developer', 'swe'] },
  { value: 'data', label: 'Data Science / Analytics', matchers: ['data', 'analytics', 'analyst', 'bi'] },
  { value: 'machine learning', label: 'Machine Learning / AI', matchers: ['machine learning', 'ai', 'ml', 'nlp'] },
  { value: 'frontend', label: 'Frontend', matchers: ['frontend', 'front end', 'ui', 'react'] },
  { value: 'backend', label: 'Backend', matchers: ['backend', 'back end', 'api', 'platform'] },
  { value: 'full stack', label: 'Full Stack', matchers: ['full stack', 'full-stack'] },
  { value: 'devops', label: 'DevOps / Infrastructure', matchers: ['devops', 'infrastructure', 'cloud', 'sre'] },
  { value: 'security', label: 'Security', matchers: ['security', 'infosec', 'cyber'] },
  { value: 'product', label: 'Product / PM', matchers: ['product', 'pm', 'program'] },
  { value: 'design', label: 'Design / UX', matchers: ['design', 'ux', 'ui'] },
] as const;

export const JOB_TYPE_FILTERS = [
  { value: 'all', label: 'All Types' },
  { value: 'internship', label: 'Internship' },
  { value: 'new-grad', label: 'New Grad' },
] as const;

export const REGION_FILTERS = [
  { value: 'all', label: 'All Regions' },
  { value: 'usa', label: 'USA' },
  { value: 'international', label: 'International' },
] as const;

export const TIER_FILTERS = [
  { value: 'all', label: 'All Companies' },
  { value: 'faang', label: 'FAANG+' },
  { value: 'quant', label: 'Quant' },
] as const;

export const SORT_OPTIONS = [
  { value: 'best-fit', label: 'Best fit' },
  { value: 'newest', label: 'Newest' },
  { value: 'highest-pay', label: 'Highest pay' },
] as const;

export const TECH_KEYWORD_PATTERN =
  /\b(python|java|javascript|typescript|react|node\.?js|django|flask|spring|aws|gcp|azure|docker|kubernetes|sql|postgresql|mongodb|redis|graphql|rest|go|rust|c\+\+|c#|swift|kotlin|pytorch|tensorflow|spark)\b/gi;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function getJobTimestamp(job: JobLike): number {
  const time = new Date(job.date_posted || job.created_at).getTime();
  return Number.isNaN(time) ? 0 : time;
}

export function sortJobsNewestFirst<T extends JobLike>(items: T[]): T[] {
  return [...items].sort((a, b) => getJobTimestamp(b) - getJobTimestamp(a));
}

export type JobFreshness = 'new' | 'recent' | 'normal';

export function getJobFreshness(job: JobLike): JobFreshness {
  const date = new Date(job.date_posted || job.created_at);
  const diffDays = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays < 1) return 'new';
  if (diffDays < 3) return 'recent';
  return 'normal';
}

export function getRelativeTime(dateStr: string | null | undefined): string {
  if (!dateStr) return 'recently';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return 'recently';
  const diffMinutes = Math.floor((Date.now() - date.getTime()) / (1000 * 60));
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
}

export function getRoleGroupLabels(job: JobLike): string[] {
  const role = job.role.toLowerCase();
  return ROLE_CATEGORIES
    .filter((option) => option.value !== 'all' && option.matchers.some((matcher) => role.includes(matcher)))
    .map((option) => option.label);
}

export function normalizeLocation(location: string | null | undefined): string | null {
  if (!location) return null;
  return location
    .split(',')
    .map((segment) =>
      segment
        .trim()
        .split(/\s+/)
        .map((word) => {
          if (word.length <= 3) return word.toUpperCase();
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(' '),
    )
    .join(', ');
}

/**
 * Format a salary range. Accepts either a full Job or (min, max, interval) triple.
 * Returns null when no numeric salary is present.
 */
export function formatSalary(job: JobLike): string | null;
export function formatSalary(
  min: number | null | undefined,
  max?: number | null,
  interval?: string | null,
): string | null;
export function formatSalary(
  jobOrMin: JobLike | number | null | undefined,
  maxArg?: number | null,
  intervalArg?: string | null,
): string | null {
  const min =
    typeof jobOrMin === 'object' && jobOrMin !== null ? jobOrMin.salary_min ?? null : jobOrMin ?? null;
  const max =
    typeof jobOrMin === 'object' && jobOrMin !== null ? jobOrMin.salary_max ?? null : maxArg ?? null;
  const interval =
    typeof jobOrMin === 'object' && jobOrMin !== null ? jobOrMin.salary_interval ?? null : intervalArg ?? null;

  if (!min && !max) return null;

  const kFmt = (n: number) => (n >= 1000 ? `$${Math.round(n / 1000)}K` : `$${n}`);

  if (min && interval === 'hourly') {
    const hourly = Math.round(min / (40 * 52));
    return `$${hourly}/hr`;
  }

  if (min && max && max !== min) {
    return `${kFmt(min)} - ${kFmt(max)}${interval === 'hourly' ? '/hr' : '/yr'}`;
  }

  if (min) {
    return interval === 'yearly'
      ? `${kFmt(min)}/yr`
      : `${kFmt(min)}${interval === 'hourly' ? '/hr' : ''}`;
  }

  return `Up to ${kFmt(max!)}${interval === 'hourly' ? '/hr' : '/yr'}`;
}

export function estimateMatchScore(job: JobLike): number {
  const idSeed = job.id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  let score = 75 + (idSeed % 18);
  if (job.tags?.includes('faang')) score += 5;
  if (job.tags?.includes('quant')) score += 4;
  if (getJobFreshness(job) === 'new') score += 2;
  if (getJobFreshness(job) === 'recent') score += 1;
  return clamp(score, 68, 96);
}

export function extractTechKeywords(text: string): string[] {
  const matches = text.match(TECH_KEYWORD_PATTERN) ?? [];
  return [...new Set(matches.map((value) => value.toLowerCase()))];
}

export function getPreferenceMatch(
  job: JobLike,
  preferences: UserPreferences | null,
): PreferenceMatch {
  if (!preferences) {
    return { roleMatch: null, locationMatch: null, keywordMatch: [] };
  }

  const roleLower = job.role.toLowerCase();
  const locationLower = (job.location ?? '').toLowerCase();
  const tagsLower = (job.tags ?? []).map((tag) => tag.toLowerCase());
  const descriptionLower = (job.description ?? '').toLowerCase();

  const roleMatch =
    preferences.interested_roles.find((role) => roleLower.includes(role.toLowerCase())) ?? null;

  const locationMatch =
    preferences.preferred_locations.find((location) =>
      locationLower.includes(location.toLowerCase()),
    ) ?? null;

  const keywordMatch = preferences.keywords.filter((keyword) => {
    const target = keyword.toLowerCase();
    return (
      roleLower.includes(target) ||
      locationLower.includes(target) ||
      descriptionLower.includes(target) ||
      tagsLower.some((tag) => tag.includes(target))
    );
  });

  return { roleMatch, locationMatch, keywordMatch };
}

export function buildEstimatedInsight(
  job: JobLike,
  preferences: UserPreferences | null,
  resumeText: string,
): EstimatedInsight {
  const score = estimateMatchScore(job);
  const reasons: string[] = [];
  const { roleMatch, locationMatch, keywordMatch } = getPreferenceMatch(job, preferences);

  if (roleMatch) reasons.push(`Matches your target role: ${roleMatch}`);
  if (locationMatch) reasons.push(`Lines up with your preferred location: ${locationMatch}`);
  if (keywordMatch.length > 0) {
    reasons.push(`Keywords overlap: ${keywordMatch.slice(0, 3).join(', ')}`);
  }

  const tags = job.tags ?? [];
  if (tags.includes('internship')) {
    reasons.push('Internship role aligned with early-career search');
  } else if (tags.includes('new-grad')) {
    reasons.push('New-grad friendly role for early career candidates');
  }

  if (getJobFreshness(job) === 'new') {
    reasons.push('Fresh listing with higher response potential');
  }

  if (reasons.length === 0) {
    reasons.push('Estimated from role, job tags, and current browse filters');
  }

  const jobSkills = extractTechKeywords(
    [job.role, job.description ?? '', tags.join(' ')].join(' '),
  );
  const resumeSkills = new Set(extractTechKeywords(resumeText));
  const missingSkills =
    resumeText.trim().length > 0
      ? jobSkills.filter((skill) => !resumeSkills.has(skill)).slice(0, 4)
      : jobSkills.slice(0, 4);

  return {
    score,
    scoreSource: 'estimated',
    matchReasons: reasons.slice(0, 4),
    missingSkills,
  };
}
