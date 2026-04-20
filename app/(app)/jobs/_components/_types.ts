export interface Job {
  id: string;
  company: string;
  role: string;
  location: string | null;
  url: string | null;
  description: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_interval: string | null;
  source: string;
  tags: string[] | null;
  date_posted: string | null;
  created_at: string;
}

export interface JobInsight {
  score: number;
  scoreSource: 'ai' | 'estimated';
  matchReasons: string[];
  missingSkills: string[];
}

export interface ProfileState {
  loading: boolean;
  hasResume: boolean;
  masterResume: string;
  preferences: import('@/lib/job-utils').UserPreferences | null;
}

export type JobsCache = {
  jobs?: Job[];
  totalCount?: number;
  lastSyncTime?: string | null;
  cachedAt?: string;
};

export const SYNC_STALE_MS = 2 * 60 * 1000;

export function readJobsCache(cacheKey: string): JobsCache | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(cacheKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as JobsCache;
    if (!parsed || !Array.isArray(parsed.jobs)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function getFitPresentation(insight: JobInsight) {
  if (insight.scoreSource === 'estimated') {
    return {
      label: 'Estimated fit',
      tone: 'border-line bg-surface-sunken text-fg',
      caption: 'Based on role, tags, and available job data',
    };
  }

  if (insight.score >= 85) {
    return {
      label: 'Strong fit',
      tone: 'border-emerald-600/40 bg-emerald-600/10 text-emerald-700 dark:text-emerald-400',
      caption: 'AI-backed from your resume and job overlap',
    };
  }

  return {
    label: 'Likely fit',
    tone: 'border-orange-600/50 bg-orange-600/10 text-orange-700 dark:text-orange-400',
    caption: 'AI-backed from your resume and job overlap',
  };
}
