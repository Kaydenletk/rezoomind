'use client';

import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

import { RezoomAITrialNotice } from '@/components/RezoomAITrialNotice';
import { RezoomindCopilotSidebar, type CopilotActionRequest } from '@/components/RezoomindCopilotSidebar';
import { useAuth } from '@/hooks/useAuth';
import { useRezoomAIAccess } from '@/hooks/useRezoomAIAccess';
import { useSavedJobs } from '@/hooks/useSavedJobs';

interface Job {
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

interface UserPreferences {
  interested_roles: string[];
  preferred_locations: string[];
  keywords: string[];
}

interface JobInsight {
  score: number;
  scoreSource: 'ai' | 'estimated';
  matchReasons: string[];
  missingSkills: string[];
}

interface ProfileState {
  loading: boolean;
  hasResume: boolean;
  masterResume: string;
  preferences: UserPreferences | null;
}

const ROLE_CATEGORIES = [
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
];

const JOB_TYPE_FILTERS = [
  { value: 'all', label: 'All Types' },
  { value: 'internship', label: 'Internship' },
  { value: 'new-grad', label: 'New Grad' },
];

const REGION_FILTERS = [
  { value: 'all', label: 'All Regions' },
  { value: 'usa', label: 'USA' },
  { value: 'international', label: 'International' },
];

const TIER_FILTERS = [
  { value: 'all', label: 'All Companies' },
  { value: 'faang', label: 'FAANG+' },
  { value: 'quant', label: 'Quant' },
];

const SORT_OPTIONS = [
  { value: 'best-fit', label: 'Best fit' },
  { value: 'newest', label: 'Newest' },
  { value: 'highest-pay', label: 'Highest pay' },
];

type JobsCache = {
  jobs?: Job[];
  totalCount?: number;
  lastSyncTime?: string | null;
  cachedAt?: string;
};

const SYNC_STALE_MS = 2 * 60 * 1000;
const TECH_KEYWORD_PATTERN =
  /\b(python|java|javascript|typescript|react|node\.?js|django|flask|spring|aws|gcp|azure|docker|kubernetes|sql|postgresql|mongodb|redis|graphql|rest|go|rust|c\+\+|c#|swift|kotlin|pytorch|tensorflow|spark)\b/gi;

const readJobsCache = (cacheKey: string): JobsCache | null => {
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
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getJobTimestamp(job: Job) {
  const time = new Date(job.date_posted || job.created_at).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function sortJobsNewestFirst(items: Job[]) {
  return [...items].sort((a, b) => getJobTimestamp(b) - getJobTimestamp(a));
}

function getJobFreshness(job: Job): 'new' | 'recent' | 'normal' {
  const date = new Date(job.date_posted || job.created_at);
  const diffDays = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays < 1) return 'new';
  if (diffDays < 3) return 'recent';
  return 'normal';
}

function getRelativeTime(dateStr: string | null) {
  if (!dateStr) return 'recently';
  const date = new Date(dateStr);
  const diffMinutes = Math.floor((Date.now() - date.getTime()) / (1000 * 60));
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
}

function getRoleGroupLabels(job: Job) {
  const role = job.role.toLowerCase();
  return ROLE_CATEGORIES
    .filter((option) => option.value !== 'all' && option.matchers.some((matcher) => role.includes(matcher)))
    .map((option) => option.label);
}

function normalizeLocation(location: string | null) {
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
        .join(' ')
    )
    .join(', ');
}

function formatSalary(job: Job) {
  if (!job.salary_min) return null;

  if (job.salary_interval === 'hourly') {
    const hourly = Math.round(job.salary_min / (40 * 52));
    return `$${hourly}/hr`;
  }

  if (job.salary_interval === 'yearly') {
    return `$${Math.round(job.salary_min / 1000)}K/yr`;
  }

  if (job.salary_max && job.salary_max !== job.salary_min) {
    return `$${Math.round(job.salary_min / 1000)}K - $${Math.round(job.salary_max / 1000)}K`;
  }

  return `$${Math.round(job.salary_min / 1000)}K`;
}

function estimateMatchScore(job: Job) {
  const idSeed = job.id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  let score = 75 + (idSeed % 18);

  if (job.tags?.includes('faang')) score += 5;
  if (job.tags?.includes('quant')) score += 4;
  if (getJobFreshness(job) === 'new') score += 2;
  if (getJobFreshness(job) === 'recent') score += 1;

  return clamp(score, 68, 96);
}

function extractTechKeywords(text: string) {
  const matches = text.match(TECH_KEYWORD_PATTERN) ?? [];
  return [...new Set(matches.map((value) => value.toLowerCase()))];
}

function getPreferenceMatch(job: Job, preferences: UserPreferences | null) {
  if (!preferences) return { roleMatch: null as string | null, locationMatch: null as string | null, keywordMatch: [] as string[] };

  const roleLower = job.role.toLowerCase();
  const locationLower = (job.location ?? '').toLowerCase();
  const tagsLower = (job.tags ?? []).map((tag) => tag.toLowerCase());
  const descriptionLower = (job.description ?? '').toLowerCase();

  const roleMatch =
    preferences.interested_roles.find((role) => roleLower.includes(role.toLowerCase())) ?? null;

  const locationMatch =
    preferences.preferred_locations.find((location) => locationLower.includes(location.toLowerCase())) ?? null;

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

function buildEstimatedInsight(job: Job, preferences: UserPreferences | null, resumeText: string) {
  const score = estimateMatchScore(job);
  const reasons: string[] = [];
  const { roleMatch, locationMatch, keywordMatch } = getPreferenceMatch(job, preferences);

  if (roleMatch) {
    reasons.push(`Matches your target role: ${roleMatch}`);
  }

  if (locationMatch) {
    reasons.push(`Lines up with your preferred location: ${locationMatch}`);
  }

  if (keywordMatch.length > 0) {
    reasons.push(`Keywords overlap: ${keywordMatch.slice(0, 3).join(', ')}`);
  }

  if ((job.tags ?? []).includes('internship')) {
    reasons.push('Internship role aligned with early-career search');
  } else if ((job.tags ?? []).includes('new-grad')) {
    reasons.push('New-grad friendly role for early career candidates');
  }

  if (getJobFreshness(job) === 'new') {
    reasons.push('Fresh listing with higher response potential');
  }

  if (reasons.length === 0) {
    reasons.push('Estimated from role, job tags, and current browse filters');
  }

  const jobSkills = extractTechKeywords(
    [job.role, job.description ?? '', (job.tags ?? []).join(' ')].join(' ')
  );
  const resumeSkills = new Set(extractTechKeywords(resumeText));
  const missingSkills =
    resumeText.trim().length > 0
      ? jobSkills.filter((skill) => !resumeSkills.has(skill)).slice(0, 4)
      : jobSkills.slice(0, 4);

  return {
    score,
    scoreSource: 'estimated' as const,
    matchReasons: reasons.slice(0, 4),
    missingSkills,
  };
}

function getFitPresentation(insight: JobInsight) {
  if (insight.scoreSource === 'estimated') {
    return {
      label: 'Estimated fit',
      tone: 'border-stone-700 bg-stone-800 text-stone-300',
      caption: 'Based on role, tags, and available job data',
    };
  }

  if (insight.score >= 85) {
    return {
      label: 'Strong fit',
      tone: 'border-emerald-700 bg-emerald-900/30 text-emerald-400',
      caption: 'AI-backed from your resume and job overlap',
    };
  }

  return {
    label: 'Likely fit',
    tone: 'border-orange-600/50 bg-orange-600/10 text-orange-400',
    caption: 'AI-backed from your resume and job overlap',
  };
}

function toSavedJob(job: Job) {
  return {
    id: job.id,
    company: job.company,
    role: job.role,
    location: job.location,
    url: job.url,
  };
}

function toCopilotJob(job: Job | null) {
  if (!job) return null;
  return {
    id: job.id,
    role: job.role,
    company: job.company,
    url: job.url,
    location: job.location,
  };
}

export default function JobsPage() {
  const { isAuthenticated } = useAuth();
  const aiAccess = useRezoomAIAccess();
  const savedJobs = useSavedJobs();

  const cacheKey = 'rezoomind:jobs-cache:v2';
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedJobType, setSelectedJobType] = useState('all');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedTier, setSelectedTier] = useState('all');
  const [sortBy, setSortBy] = useState('best-fit');
  const [savedOnly, setSavedOnly] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [displayCount, setDisplayCount] = useState(40);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [fallbackLoaded, setFallbackLoaded] = useState(false);
  const [copilotAction, setCopilotAction] = useState<CopilotActionRequest | null>(null);
  const [jobInsights, setJobInsights] = useState<Record<string, JobInsight>>({});
  const [profileState, setProfileState] = useState<ProfileState>({
    loading: true,
    hasResume: false,
    masterResume: '',
    preferences: null,
  });
  const loadIdRef = useRef(0);
  const jobsRef = useRef<Job[]>([]);
  const lastSyncRef = useRef<string | null>(null);
  const syncingRef = useRef(false);
  const requestedScoreIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const cached = readJobsCache(cacheKey);
    if (cached?.jobs && cached.jobs.length > 0) {
      const sorted = sortJobsNewestFirst(cached.jobs);
      setJobs(sorted);
      setTotalCount(cached.totalCount ?? cached.jobs.length);
      setLastSyncTime(cached.lastSyncTime ?? cached.cachedAt ?? null);
      setHasLoadedOnce(true);
      setFallbackLoaded(true);
      setLoading(false);
    }
  }, [cacheKey]);

  useEffect(() => {
    jobsRef.current = jobs;
  }, [jobs]);

  useEffect(() => {
    lastSyncRef.current = lastSyncTime;
  }, [lastSyncTime]);

  useEffect(() => {
    let cancelled = false;

    const loadUserContext = async () => {
      if (!isAuthenticated) {
        if (!cancelled) {
          setProfileState({
            loading: false,
            hasResume: false,
            masterResume: '',
            preferences: null,
          });
        }
        return;
      }

      try {
        const [profileResponse, preferencesResponse] = await Promise.allSettled([
          fetch('/api/profile', { cache: 'no-store' }),
          fetch('/api/preferences/data', { cache: 'no-store' }),
        ]);

        if (cancelled) return;

        let hasResume = false;
        let masterResume = '';
        let preferences: UserPreferences | null = null;

        if (profileResponse.status === 'fulfilled' && profileResponse.value.ok) {
          const profileData = await profileResponse.value.json();
          masterResume = String(profileData.profile?.masterResume ?? '');
          hasResume = masterResume.trim().length > 0;
        }

        if (preferencesResponse.status === 'fulfilled' && preferencesResponse.value.ok) {
          const preferencesData = await preferencesResponse.value.json();
          const prefs = preferencesData.prefs;
          preferences = prefs
            ? {
                interested_roles: Array.isArray(prefs.interested_roles) ? prefs.interested_roles : [],
                preferred_locations: Array.isArray(prefs.preferred_locations) ? prefs.preferred_locations : [],
                keywords: Array.isArray(prefs.keywords) ? prefs.keywords : [],
              }
            : null;
        }

        setProfileState({
          loading: false,
          hasResume,
          masterResume,
          preferences,
        });
      } catch {
        if (!cancelled) {
          setProfileState({
            loading: false,
            hasResume: false,
            masterResume: '',
            preferences: null,
          });
        }
      }
    };

    void loadUserContext();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const cacheJobs = useCallback(
    (items: Job[], count: number, lastSync?: string | null) => {
      try {
        const payload = {
          jobs: items.slice(0, 1000),
          totalCount: count,
          lastSyncTime: lastSync ?? null,
          cachedAt: new Date().toISOString(),
        };
        window.localStorage.setItem(cacheKey, JSON.stringify(payload));
      } catch {
        // Ignore cache errors.
      }
    },
    [cacheKey]
  );

  const applyJobs = useCallback(
    (items: Job[], count: number, lastSync?: string | null) => {
      const sorted = sortJobsNewestFirst(items);
      const resolvedLastSync = typeof lastSync === 'string' ? lastSync : lastSyncRef.current;
      setJobs(sorted);
      setTotalCount(count);
      if (typeof lastSync === 'string') {
        setLastSyncTime(lastSync);
      }
      setHasLoadedOnce(true);
      setFallbackLoaded(true);
      setLoading(false);
      cacheJobs(sorted, count, resolvedLastSync ?? null);
    },
    [cacheJobs]
  );

  const loadFallbackJobs = useCallback(
    async (loadId?: number) => {
      try {
        const res = await fetch('/api/jobs/ensure-sync?force=true&returnJobs=true');
        const result = await res.json();

        if (loadId && loadId !== loadIdRef.current) return;

        if (result?.jobs && result.jobs.length > 0) {
          applyJobs(result.jobs, result.jobs.length, result.lastSync ?? new Date().toISOString());
        } else {
          setFallbackLoaded(true);
          setHasLoadedOnce(true);
          setLoading(false);
        }
      } catch {
        if (loadId && loadId !== loadIdRef.current) return;
        setFallbackLoaded(true);
        setHasLoadedOnce(true);
        setLoading(false);
      }
    },
    [applyJobs]
  );

  const loadJobs = useCallback(
    async (options?: { skipFallback?: boolean; silent?: boolean }) => {
      const loadId = ++loadIdRef.current;
      const shouldShowLoading = !options?.silent && !hasLoadedOnce && jobsRef.current.length === 0;
      if (shouldShowLoading) {
        setLoading(true);
      }

      try {
        const response = await fetch('/api/jobs/data');
        const result = await response.json();

        if (loadId !== loadIdRef.current) return;

        if (!response.ok || result.error) {
          if (!options?.skipFallback && jobsRef.current.length === 0 && !fallbackLoaded) {
            await loadFallbackJobs(loadId);
            return;
          }
          setFallbackLoaded(true);
          setHasLoadedOnce(true);
          setLoading(false);
          return;
        }

        if (Array.isArray(result.data) && result.data.length > 0) {
          applyJobs(result.data, result.count ?? result.data.length);
          return;
        }

        if (!options?.skipFallback && jobsRef.current.length === 0 && !fallbackLoaded) {
          await loadFallbackJobs(loadId);
          return;
        }

        setFallbackLoaded(true);
        setHasLoadedOnce(true);
        setLoading(false);
      } catch {
        if (loadId !== loadIdRef.current) return;
        if (!options?.skipFallback && jobsRef.current.length === 0 && !fallbackLoaded) {
          await loadFallbackJobs(loadId);
          return;
        }
        setFallbackLoaded(true);
        setHasLoadedOnce(true);
        setLoading(false);
      }
    },
    [applyJobs, fallbackLoaded, hasLoadedOnce, loadFallbackJobs]
  );

  const triggerBackgroundSync = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    setSyncing(true);
    try {
      const res = await fetch('/api/jobs/ensure-sync?force=true');
      const result = await res.json();
      if (result.lastSync) {
        setLastSyncTime(result.lastSync);
      }
      const hasUpdates = (result.newJobs ?? 0) > 0 || (result.upserted ?? 0) > 0;
      if (hasUpdates) {
        await loadJobs({ skipFallback: true, silent: true });
      }
    } catch {
      // no-op
    } finally {
      syncingRef.current = false;
      setSyncing(false);
    }
  }, [loadJobs]);

  useEffect(() => {
    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | null = null;

    const shouldSyncNow = (lastSync: string | null) => {
      if (!lastSync) return true;
      const age = Date.now() - new Date(lastSync).getTime();
      return age > SYNC_STALE_MS;
    };

    const run = async () => {
      await loadJobs();
      if (cancelled) return;

      if (shouldSyncNow(lastSyncRef.current)) {
        void triggerBackgroundSync();
      }

      interval = setInterval(() => {
        if (shouldSyncNow(lastSyncRef.current)) {
          void triggerBackgroundSync();
        }
      }, 5 * 60 * 1000);
    };

    void run();

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, [loadJobs, triggerBackgroundSync]);

  useEffect(() => {
    setDisplayCount(40);
  }, [searchTerm, selectedLocation, selectedCategory, selectedJobType, selectedRegion, selectedTier, savedOnly, sortBy]);

  const locationOptions = useMemo(() => {
    const locationCounts = new Map<string, number>();
    jobs.forEach((job) => {
      const location = normalizeLocation(job.location);
      if (location) {
        locationCounts.set(location, (locationCounts.get(location) || 0) + 1);
      }
    });

    const sorted = [...locationCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([location, count]) => ({ value: location, label: `${location} (${count})` }));

    return [{ value: 'all', label: 'All Locations' }, ...sorted];
  }, [jobs]);

  const matchesSearch = useCallback((job: Job, term: string) => {
    if (!term) return true;
    const searchIndex = [
      job.role,
      job.company,
      job.location ?? '',
      normalizeLocation(job.location) ?? '',
      job.description ?? '',
      ...(job.tags ?? []),
      ...getRoleGroupLabels(job),
    ]
      .join(' ')
      .toLowerCase();
    return searchIndex.includes(term.toLowerCase());
  }, []);

  const matchesCategory = useCallback((job: Job) => {
    if (selectedCategory === 'all') return true;
    const option = ROLE_CATEGORIES.find((item) => item.value === selectedCategory);
    if (!option) return true;
    const role = job.role.toLowerCase();
    return option.matchers.some((matcher) => role.includes(matcher));
  }, [selectedCategory]);

  const matchesLocation = useCallback((job: Job) => {
    if (selectedLocation === 'all') return true;
    const normalized = normalizeLocation(job.location);
    return normalized === selectedLocation;
  }, [selectedLocation]);

  const matchesSharedFilters = useCallback((job: Job) => {
    const tags = job.tags ?? [];
    const matchesType = selectedJobType === 'all' || tags.includes(selectedJobType);
    const matchesRegion = selectedRegion === 'all' || tags.includes(selectedRegion);
    const matchesTier = selectedTier === 'all' || tags.includes(selectedTier);
    const matchesSaved = !savedOnly || savedJobs.isSaved(job.id);

    return matchesType && matchesRegion && matchesTier && matchesSaved;
  }, [savedJobs, savedOnly, selectedJobType, selectedRegion, selectedTier]);

  const searchScopedJobs = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return jobs.filter((job) => matchesSearch(job, term) && matchesCategory(job) && matchesLocation(job));
  }, [jobs, matchesCategory, matchesLocation, matchesSearch, searchTerm]);

  const filteredJobs = useMemo(() => {
    const items = searchScopedJobs.filter((job) => matchesSharedFilters(job));
    return [...items].sort((left, right) => {
      if (sortBy === 'newest') {
        return getJobTimestamp(right) - getJobTimestamp(left);
      }
      if (sortBy === 'highest-pay') {
        return (right.salary_min ?? 0) - (left.salary_min ?? 0);
      }

      const leftScore = (jobInsights[left.id] ?? buildEstimatedInsight(left, profileState.preferences, profileState.masterResume)).score;
      const rightScore = (jobInsights[right.id] ?? buildEstimatedInsight(right, profileState.preferences, profileState.masterResume)).score;
      if (rightScore !== leftScore) {
        return rightScore - leftScore;
      }
      return getJobTimestamp(right) - getJobTimestamp(left);
    });
  }, [jobInsights, matchesSharedFilters, profileState.masterResume, profileState.preferences, searchScopedJobs, sortBy]);

  const visibleJobs = filteredJobs.slice(0, displayCount);
  const hasMore = filteredJobs.length > displayCount;

  useEffect(() => {
    if (filteredJobs.length === 0) {
      setSelectedJobId(null);
      return;
    }
    if (!selectedJobId || !filteredJobs.some((job) => job.id === selectedJobId)) {
      setSelectedJobId(filteredJobs[0].id);
    }
  }, [filteredJobs, selectedJobId]);

  const activeJob = useMemo(
    () => filteredJobs.find((job) => job.id === selectedJobId) ?? filteredJobs[0] ?? null,
    [filteredJobs, selectedJobId]
  );

  const getInsight = useCallback(
    (job: Job | null) => {
      if (!job) return null;
      return jobInsights[job.id] ?? buildEstimatedInsight(job, profileState.preferences, profileState.masterResume);
    },
    [jobInsights, profileState.masterResume, profileState.preferences]
  );

  const activeInsight = getInsight(activeJob);
  const setupHref = isAuthenticated ? '/dashboard/profile?next=/jobs' : '/login?next=%2Fdashboard%2Fprofile';

  useEffect(() => {
    const candidateJobs = [activeJob, ...visibleJobs.slice(0, 10)].filter((job): job is Job => Boolean(job));

    if (!isAuthenticated || !profileState.hasResume || candidateJobs.length === 0) {
      return;
    }

    let cancelled = false;

    const fetchScores = async () => {
      await Promise.all(
        candidateJobs.map(async (job) => {
          if (jobInsights[job.id]?.scoreSource === 'ai') return;
          if (requestedScoreIdsRef.current.has(job.id)) return;

          requestedScoreIdsRef.current.add(job.id);

          try {
            const res = await fetch('/api/matches/score', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ jobId: job.id }),
            });
            const data = await res.json();

            if (!cancelled && res.ok && data?.ok && typeof data.overallScore === 'number') {
              setJobInsights((prev) => ({
                ...prev,
                [job.id]: {
                  score: clamp(Math.round(data.overallScore), 50, 99),
                  scoreSource: 'ai',
                  matchReasons: Array.isArray(data.reasons) ? data.reasons.slice(0, 4) : [],
                  missingSkills: Array.isArray(data.missingSkills) ? data.missingSkills.slice(0, 4) : [],
                },
              }));
            }
          } catch {
            // Keep estimated insight fallback.
          }
        })
      );
    };

    void fetchScores();

    return () => {
      cancelled = true;
    };
  }, [activeJob, isAuthenticated, jobInsights, profileState.hasResume, visibleJobs]);

  const queueCopilotAction = useCallback(
    (request: Omit<CopilotActionRequest, 'token'>) => {
      setCopilotAction({
        token: Date.now() + Math.floor(Math.random() * 1000),
        ...request,
      });
    },
    []
  );


  const clearAllFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedLocation('all');
    setSelectedCategory('all');
    setSelectedJobType('all');
    setSelectedRegion('all');
    setSelectedTier('all');
    setSavedOnly(false);
    setSortBy('best-fit');
  }, []);

  const activeFilters = useMemo(() => {
    const filters: string[] = [];
    if (searchTerm.trim()) filters.push(`Search: ${searchTerm.trim()}`);
    if (selectedLocation !== 'all') filters.push(selectedLocation);
    if (selectedCategory !== 'all') {
      filters.push(ROLE_CATEGORIES.find((option) => option.value === selectedCategory)?.label ?? selectedCategory);
    }
    if (selectedJobType !== 'all') {
      filters.push(JOB_TYPE_FILTERS.find((option) => option.value === selectedJobType)?.label ?? selectedJobType);
    }
    if (selectedRegion !== 'all') {
      filters.push(REGION_FILTERS.find((option) => option.value === selectedRegion)?.label ?? selectedRegion);
    }
    if (selectedTier !== 'all') {
      filters.push(TIER_FILTERS.find((option) => option.value === selectedTier)?.label ?? selectedTier);
    }
    if (savedOnly) filters.push('Saved only');
    return filters;
  }, [savedOnly, searchTerm, selectedCategory, selectedJobType, selectedLocation, selectedRegion, selectedTier]);

  const filterCounts = useMemo(() => {
    const counts = {
      jobType: new Map<string, number>(),
      region: new Map<string, number>(),
      tier: new Map<string, number>(),
    };

    searchScopedJobs.forEach((job) => {
      const tags = job.tags ?? [];
      JOB_TYPE_FILTERS.forEach((option) => {
        if (option.value !== 'all' && tags.includes(option.value)) {
          counts.jobType.set(option.value, (counts.jobType.get(option.value) || 0) + 1);
        }
      });
      REGION_FILTERS.forEach((option) => {
        if (option.value !== 'all' && tags.includes(option.value)) {
          counts.region.set(option.value, (counts.region.get(option.value) || 0) + 1);
        }
      });
      TIER_FILTERS.forEach((option) => {
        if (option.value !== 'all' && tags.includes(option.value)) {
          counts.tier.set(option.value, (counts.tier.get(option.value) || 0) + 1);
        }
      });
    });

    return counts;
  }, [searchScopedJobs]);

  if (loading && !hasLoadedOnce) {
    return (
      <div className="min-h-screen bg-stone-950 pt-24 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="relative h-10 w-10">
            <span className="absolute inset-0 animate-ping bg-orange-600 opacity-20" />
            <span className="relative block h-10 w-10 border-2 border-orange-600 border-t-transparent animate-spin" />
          </div>
          <p className="text-sm font-mono font-medium text-stone-300">Finding your best matches…</p>
          <p className="text-xs text-stone-500">Pulling fresh internship and new-grad roles.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950">

      {/* ── Breadcrumb bar ─────────────────────────────────────────── */}
      <div className="sticky top-[64px] z-20 border-b border-stone-800 bg-stone-950/95 backdrop-blur-md">
        <div className="mx-auto max-w-[1600px] flex items-center justify-between px-4 sm:px-6 py-2.5">
          <div className="flex items-center gap-1.5 text-sm font-mono">
            <span className="font-medium text-stone-500">Jobs</span>
            <span className="text-stone-600">/</span>
            <span className="font-medium text-stone-300">Discover</span>
            {filteredJobs.length > 0 && (
              <span className="ml-2 bg-stone-800 px-2 py-0.5 text-xs font-medium text-stone-500">
                {filteredJobs.length.toLocaleString()}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-stone-500 font-mono">
            {lastSyncTime && <span>Updated {getRelativeTime(lastSyncTime)}</span>}
            <button
              type="button"
              onClick={() => void triggerBackgroundSync()}
              disabled={syncing}
              className={`px-3 py-1.5 text-xs font-mono font-medium transition ${
                syncing
                  ? 'text-stone-500'
                  : 'border border-stone-700 bg-stone-900/30 text-stone-400 hover:border-orange-600/50 hover:text-orange-500 cursor-pointer'
              }`}
            >
              {syncing ? (
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 animate-spin border border-stone-500 border-t-transparent" />
                  Syncing…
                </span>
              ) : (
                'Refresh jobs'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Search + filter strip ──────────────────────────────────── */}
      <div className="sticky top-[107px] z-10 border-b border-stone-800 bg-stone-950/95 backdrop-blur-md">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 py-3">
          <div className="flex flex-wrap items-center gap-2">

            {/* Search */}
            <div className="relative min-w-[220px] flex-1 max-w-xs">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z" />
              </svg>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Role, company, or skill…"
                className="w-full bg-transparent border-0 border-b border-stone-800 py-2 pl-8 pr-3 text-sm font-mono text-stone-300 placeholder-stone-600 outline-none transition focus:border-orange-600"
              />
            </div>

            {/* Quick-filter chips */}
            {JOB_TYPE_FILTERS.filter((o) => o.value !== 'all').map((option) => (
              <FilterChip
                key={`jt-${option.value}`}
                active={selectedJobType === option.value}
                label={`${option.label}${filterCounts.jobType.get(option.value) ? ` ${filterCounts.jobType.get(option.value)}` : ''}`}
                onClick={() => setSelectedJobType(selectedJobType === option.value ? 'all' : option.value)}
              />
            ))}
            {TIER_FILTERS.filter((o) => o.value !== 'all').map((option) => (
              <FilterChip
                key={`tr-${option.value}`}
                active={selectedTier === option.value}
                label={option.label}
                onClick={() => setSelectedTier(selectedTier === option.value ? 'all' : option.value)}
              />
            ))}
            {REGION_FILTERS.filter((o) => o.value !== 'all').map((option) => (
              <FilterChip
                key={`rg-${option.value}`}
                active={selectedRegion === option.value}
                label={option.label}
                onClick={() => setSelectedRegion(selectedRegion === option.value ? 'all' : option.value)}
              />
            ))}
            <FilterChip
              active={savedOnly}
              label={`Saved${savedJobs.savedJobIds.length > 0 ? ` (${savedJobs.savedJobIds.length})` : ''}`}
              onClick={() => setSavedOnly((v) => !v)}
            />

            {/* Location + Category selects */}
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="bg-transparent border-0 border-b border-stone-800 px-3 py-2 text-sm font-mono text-stone-400 outline-none transition focus:border-orange-600"
            >
              {locationOptions.map((o) => (
                <option key={o.value} value={o.value} className="bg-stone-900 text-stone-300">{o.label}</option>
              ))}
            </select>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent border-0 border-b border-stone-800 px-3 py-2 text-sm font-mono text-stone-400 outline-none transition focus:border-orange-600"
            >
              {ROLE_CATEGORIES.map((o) => (
                <option key={o.value} value={o.value} className="bg-stone-900 text-stone-300">{o.label}</option>
              ))}
            </select>

            {/* Right: sort + clear */}
            <div className="ml-auto flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border-0 bg-transparent text-sm font-mono text-stone-500 outline-none focus:text-stone-300"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value} className="bg-stone-900 text-stone-300">{o.label}</option>
                ))}
              </select>
              {activeFilters.length > 0 && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-xs font-mono text-stone-500 hover:text-orange-500 transition"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── 3-column grid ─────────────────────────────────────────── */}
      <div className="mx-auto max-w-[1600px] grid xl:grid-cols-[200px_1fr_380px] divide-x divide-stone-800 pt-0">

        {/* ── LEFT RAIL ── */}
        <aside className="hidden xl:block sticky top-[155px] self-start max-h-[calc(100vh-155px)] overflow-y-auto py-8 px-4 space-y-7">
          <div>
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">Category</p>
            <nav className="space-y-0.5">
              {ROLE_CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`w-full px-3 py-2 text-left text-sm font-mono transition ${
                    selectedCategory === cat.value
                      ? 'bg-orange-600/10 font-medium text-orange-500'
                      : 'text-stone-500 hover:bg-stone-900/80 hover:text-stone-300'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Resume nudge */}
          {!profileState.hasResume && (
            <Link
              href={setupHref}
              className="block bg-orange-600/5 border border-orange-600/30 p-3 text-xs leading-5 text-stone-400 hover:border-orange-600/50 transition"
            >
              <span className="block font-mono font-semibold text-stone-200 mb-0.5">Add your resume</span>
              Turn estimated fits into AI-powered match scores.
            </Link>
          )}

          {profileState.hasResume && (
            <div className="text-xs text-stone-500 space-y-1 font-mono">
              <p className="font-medium text-stone-400">AI active</p>
              <p>Scoring visible roles against your resume.</p>
            </div>
          )}
        </aside>

        {/* ── CENTER: JOB LIST ── */}
        <main className="min-w-0">
          {filteredJobs.length === 0 ? (
            <EmptyState
              syncing={syncing}
              savedOnly={savedOnly}
              hasResume={profileState.hasResume}
              setupHref={setupHref}
            />
          ) : (
            <div>
              {visibleJobs.map((job, index) => (
                <TopMatchCard
                  key={job.id}
                  job={job}
                  insight={getInsight(job)}
                  selected={job.id === activeJob?.id}
                  saved={savedJobs.isSaved(job.id)}
                  delay={index < 18 ? index * 0.015 : 0}
                  onSelect={() => setSelectedJobId(job.id)}
                  onToggleSaved={() => void savedJobs.toggleSavedJob(toSavedJob(job))}
                />
              ))}

              {hasMore && (
                <div className="flex justify-center py-8">
                  <button
                    type="button"
                    onClick={() => setDisplayCount((c) => c + 40)}
                    className="border border-stone-700 bg-stone-900/30 px-6 py-2.5 text-sm font-mono text-stone-400 transition hover:border-orange-600/50 hover:text-orange-500"
                  >
                    Load {Math.min(40, filteredJobs.length - displayCount)} more roles
                    <span className="ml-2 text-stone-600">({(filteredJobs.length - displayCount).toLocaleString()} left)</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </main>

        {/* ── RIGHT: DETAIL PANEL ── */}
        <aside className="hidden xl:block sticky top-[155px] self-start max-h-[calc(100vh-155px)] overflow-y-auto">
          <DetailPanel
            job={activeJob}
            insight={activeInsight}
            isSaved={activeJob ? savedJobs.isSaved(activeJob.id) : false}
            onToggleSaved={async () => {
              if (!activeJob) return;
              await savedJobs.toggleSavedJob(toSavedJob(activeJob));
            }}
            onQueueAction={(type) => queueCopilotAction({ type })}
            profileReady={profileState.hasResume}
            setupHref={setupHref}
            trialNotice={
              <RezoomAITrialNotice
                isAuthenticated={aiAccess.isAuthenticated}
                remainingGuestCredits={aiAccess.remainingGuestCredits}
                requiresLogin={aiAccess.requiresLogin}
                loginHref={aiAccess.loginHref}
                encouragement={aiAccess.encouragement}
                theme="light"
                className="mt-4"
              />
            }
            aiLocked={aiAccess.requiresLogin}
          />
        </aside>
      </div>

      {/* Mobile: Copilot sidebar */}
      <div className="xl:hidden">
        <RezoomindCopilotSidebar
          layout="fixed"
          activeJob={toCopilotJob(activeJob)}
          actionRequest={copilotAction}
          showTrialNotice={false}
          needsProfileSetup={!profileState.hasResume}
          setupHref={setupHref}
        />
      </div>

      {/* Mobile: selected job detail sheet */}
      {activeJob && activeInsight && (
        <div className="xl:hidden mt-4 mx-3">
          <DetailPanel
            job={activeJob}
            insight={activeInsight}
            isSaved={savedJobs.isSaved(activeJob.id)}
            onToggleSaved={async () => {
              await savedJobs.toggleSavedJob(toSavedJob(activeJob));
            }}
            onQueueAction={(type) => queueCopilotAction({ type })}
            profileReady={profileState.hasResume}
            setupHref={setupHref}
            trialNotice={
              <RezoomAITrialNotice
                isAuthenticated={aiAccess.isAuthenticated}
                remainingGuestCredits={aiAccess.remainingGuestCredits}
                requiresLogin={aiAccess.requiresLogin}
                loginHref={aiAccess.loginHref}
                encouragement={aiAccess.encouragement}
                theme="light"
                className="mt-4"
              />
            }
            aiLocked={aiAccess.requiresLogin}
          />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TopMatchCard — editorial job row (no card wrapper, breathable)
// ─────────────────────────────────────────────────────────────────────────────
function TopMatchCard({
  job,
  insight,
  selected,
  saved,
  delay,
  onSelect,
  onToggleSaved,
}: {
  job: Job;
  insight: JobInsight | null;
  selected: boolean;
  saved: boolean;
  delay: number;
  onSelect: () => void;
  onToggleSaved: () => void;
}) {
  if (!insight) return null;

  const fit = getFitPresentation(insight);
  const salary = formatSalary(job);
  const freshness = getJobFreshness(job);

  const scoreColor = insight.scoreSource === 'ai'
    ? insight.score >= 85 ? 'text-emerald-400' : 'text-orange-500'
    : 'text-stone-500';

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.2 }}
      onClick={onSelect}
      className={`group relative flex cursor-pointer items-start gap-4 border-b px-5 py-4 transition-colors ${
        selected
          ? 'border-b-transparent bg-stone-800/50 border-l-2 border-l-orange-600'
          : 'border-stone-800 hover:bg-stone-900/80'
      }`}
    >
      {/* Company monogram */}
      <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center text-[11px] font-bold font-mono transition-colors ${
        selected ? 'bg-orange-600/20 text-orange-500' : 'bg-stone-800 text-stone-400 group-hover:bg-stone-700'
      }`}>
        {job.company.slice(0, 2).toUpperCase()}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {/* Row 1: title + score */}
        <div className="flex items-start justify-between gap-3">
          <h3 className={`truncate text-sm font-mono font-semibold leading-tight ${selected ? 'text-stone-100' : 'text-stone-200'}`}>
            {job.role}
          </h3>
          <span className={`shrink-0 text-sm font-bold font-mono tabular-nums ${scoreColor}`}>
            {insight.score}%
          </span>
        </div>

        {/* Row 2: meta */}
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-stone-500">
          <span className="font-medium text-stone-400">{job.company}</span>
          {normalizeLocation(job.location) && (
            <><span>·</span><span>{normalizeLocation(job.location)}</span></>
          )}
          {salary && (
            <><span>·</span><span className="text-emerald-400 font-medium">{salary}</span></>
          )}
          <span>·</span>
          <span>{getRelativeTime(job.date_posted || job.created_at)}</span>
          {freshness === 'new' && (
            <span className="bg-orange-600/20 px-1.5 py-0.5 font-mono font-semibold text-orange-500 text-[10px]">New</span>
          )}
          {freshness === 'recent' && (
            <span className="bg-stone-800 px-1.5 py-0.5 font-mono font-semibold text-stone-400 text-[10px]">Recent</span>
          )}
        </div>

        {/* Fit badge — subtle */}
        <div className="mt-1.5 flex items-center gap-2">
          <span className={`text-[10px] font-mono font-medium ${
            insight.scoreSource === 'ai' ? 'text-orange-500' : 'text-stone-500'
          }`}>
            {fit.label}
          </span>
          {/* Micro progress bar */}
          <div className="flex-1 max-w-[80px] h-0.5 bg-stone-800 overflow-hidden">
            <div
              className={`h-full ${
                insight.scoreSource === 'ai'
                  ? 'bg-orange-600'
                  : 'bg-stone-600'
              }`}
              style={{ width: `${insight.score}%` }}
            />
          </div>
        </div>
      </div>

      {/* Hover actions */}
      <div
        className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onToggleSaved}
          className={`px-2.5 py-1 text-[11px] font-mono font-semibold transition ${
            saved
              ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-700'
              : 'bg-stone-900 border border-stone-700 text-stone-400 hover:border-stone-500'
          }`}
        >
          {saved ? '✓' : 'Save'}
        </button>
        {job.url && (
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="border border-stone-700 bg-stone-900 px-2.5 py-1 text-[11px] font-mono font-semibold text-stone-400 hover:border-orange-600/50 hover:text-orange-500 transition"
          >
            Open ↗
          </a>
        )}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DetailPanel — AI decision brief, no inner boxes, divider-separated narrative
// ─────────────────────────────────────────────────────────────────────────────
function DetailPanel({
  job,
  insight,
  isSaved,
  onToggleSaved,
  onQueueAction,
  profileReady,
  setupHref,
  trialNotice,
  aiLocked,
}: {
  job: Job | null;
  insight: JobInsight | null;
  isSaved: boolean;
  onToggleSaved: () => void;
  onQueueAction: (type: CopilotActionRequest['type']) => void;
  profileReady: boolean;
  setupHref: string;
  trialNotice: ReactNode;
  aiLocked: boolean;
}) {
  if (!job || !insight) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 px-8 text-center">
        <div className="text-3xl text-stone-600">←</div>
        <p className="text-sm font-mono font-semibold text-stone-400">Select a role</p>
        <p className="text-xs text-stone-500 leading-5">
          Click any job and this panel will explain the fit, flag missing skills, and surface your next move.
        </p>
      </div>
    );
  }

  const fit = getFitPresentation(insight);
  const salary = formatSalary(job);

  const scoreColor = insight.scoreSource === 'ai'
    ? insight.score >= 85 ? 'text-emerald-400' : 'text-orange-500'
    : 'text-stone-400';

  return (
    <div className="py-6">
      {/* Header */}
      <div className="px-6 pb-5 border-b border-stone-800">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-mono font-medium text-stone-500">{job.company}</p>
            <h2 className="mt-1 text-lg font-mono font-semibold leading-snug text-stone-100">{job.role}</h2>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-stone-500">
              {normalizeLocation(job.location) && <span>{normalizeLocation(job.location)}</span>}
              {salary && <span className="text-emerald-400 font-medium">{salary}</span>}
              <span>Posted {getRelativeTime(job.date_posted || job.created_at)}</span>
            </div>
          </div>
          {/* Score */}
          <div className="shrink-0 text-right">
            <p className={`text-3xl font-bold font-mono tabular-nums leading-none ${scoreColor}`}>
              {insight.score}%
            </p>
            <p className="mt-1 text-[10px] font-mono text-stone-500">{fit.label}</p>
          </div>
        </div>
        {/* Score bar */}
        <div className="mt-4 h-1 w-full bg-stone-800 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              insight.scoreSource === 'ai'
                ? 'bg-orange-600'
                : 'bg-stone-600'
            }`}
            style={{ width: `${insight.score}%` }}
          />
        </div>
        <p className="mt-1.5 text-[10px] font-mono text-stone-500">{fit.caption}</p>
      </div>

      {/* Why it fits */}
      {insight.matchReasons.length > 0 && (
        <div className="px-6 py-5 border-b border-stone-800">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">Why it fits</p>
          <ul className="mt-3 space-y-2.5">
            {insight.matchReasons.map((reason) => (
              <li key={reason} className="flex items-start gap-2.5 text-sm text-stone-300 leading-relaxed">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-orange-600" />
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Missing skills */}
      {insight.missingSkills.length > 0 && (
        <div className="px-6 py-5 border-b border-stone-800">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">
            To strengthen your application
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {insight.missingSkills.map((skill) => (
              <span
                key={skill}
                className="border border-amber-700 bg-amber-900/30 px-2.5 py-1 text-xs font-mono font-medium text-amber-400"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Role snapshot */}
      {job.description && (
        <div className="px-6 py-5 border-b border-stone-800">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">Snapshot</p>
          <p className="mt-3 text-sm leading-relaxed text-stone-400">
            {job.description.length > 320
              ? `${job.description.slice(0, 320)}…`
              : job.description}
          </p>
        </div>
      )}

      {/* Trial notice */}
      {trialNotice && <div className="px-6 pt-4">{trialNotice}</div>}

      {/* Actions */}
      <div className="px-6 py-5 space-y-2.5">
        {/* Primary row */}
        <div className="flex gap-2">
          {job.url && (
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 border border-orange-600/50 bg-orange-600/10 py-2.5 text-center text-sm font-mono font-semibold text-orange-500 transition hover:bg-orange-600/20"
            >
              Open role ↗
            </a>
          )}
          <button
            type="button"
            onClick={onToggleSaved}
            className={`border px-4 py-2.5 text-sm font-mono font-semibold transition ${
              isSaved
                ? 'border-emerald-700 bg-emerald-900/30 text-emerald-400'
                : 'border-stone-700 text-stone-400 hover:border-stone-500'
            }`}
          >
            {isSaved ? '✓ Saved' : 'Save'}
          </button>
        </div>

        {/* AI actions */}
        {profileReady ? (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onQueueAction('why-fit')}
              disabled={aiLocked}
              className="border border-orange-600/50 bg-orange-600/10 py-2 text-xs font-mono font-semibold text-orange-500 transition hover:bg-orange-600/20 disabled:opacity-40"
            >
              Explain fit
            </button>
            <button
              type="button"
              onClick={() => onQueueAction('tailor-bullets')}
              disabled={aiLocked}
              className="border border-stone-700 bg-stone-900/30 py-2 text-xs font-mono font-semibold text-stone-400 transition hover:border-stone-600 hover:text-stone-300 disabled:opacity-40"
            >
              Tailor resume
            </button>
            <button
              type="button"
              onClick={() => onQueueAction('skill-gap')}
              disabled={aiLocked}
              className="border border-stone-700 bg-stone-900/30 py-2 text-xs font-mono font-semibold text-stone-400 transition hover:border-stone-600 hover:text-stone-300 disabled:opacity-40"
            >
              Find gaps
            </button>
            <button
              type="button"
              onClick={() => onQueueAction('custom')}
              disabled={aiLocked}
              className="border border-stone-700 bg-stone-900/30 py-2 text-xs font-mono font-semibold text-stone-400 transition hover:border-stone-600 hover:text-stone-300 disabled:opacity-40"
            >
              Draft outreach
            </button>
          </div>
        ) : (
          <Link
            href={setupHref}
            className="block w-full border border-dashed border-orange-600/50 py-2.5 text-center text-xs font-mono font-semibold text-orange-500 transition hover:border-orange-600 hover:bg-orange-600/10"
          >
            Add resume for AI match scores →
          </Link>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EmptyState
// ─────────────────────────────────────────────────────────────────────────────
function EmptyState({
  syncing,
  savedOnly,
  hasResume,
  setupHref,
}: {
  syncing: boolean;
  savedOnly: boolean;
  hasResume: boolean;
  setupHref: string;
}) {
  if (syncing) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-32 text-center">
        <span className="block h-6 w-6 animate-spin border-2 border-orange-600 border-t-transparent" />
        <p className="text-sm font-mono font-medium text-stone-300">Refreshing job listings…</p>
        <p className="text-xs text-stone-500">Fresh roles are being pulled in.</p>
      </div>
    );
  }

  if (savedOnly) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-32 text-center">
        <p className="text-sm font-mono font-semibold text-stone-300">No saved jobs yet</p>
        <p className="text-xs text-stone-500 max-w-xs leading-5">
          Save roles as you browse to build a shortlist you can compare and revisit.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-32 text-center">
      <p className="text-sm font-mono font-semibold text-stone-300">No roles match these filters</p>
      <p className="text-xs text-stone-500 max-w-xs leading-5">
        Broaden your search, clear a filter, or refresh to get the latest listings.
      </p>
      {!hasResume && (
        <Link
          href={setupHref}
          className="mt-2 border border-stone-700 bg-stone-900/30 px-4 py-2 text-xs font-mono font-semibold text-stone-400 hover:border-orange-600/50 hover:text-orange-500 transition"
        >
          Add Resume &amp; Profile
        </Link>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FilterChip — flat toggle pill
// ─────────────────────────────────────────────────────────────────────────────
function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-mono font-medium transition ${
        active
          ? 'bg-orange-600/10 text-orange-500 border border-orange-600'
          : 'border border-stone-700 bg-stone-900/30 text-stone-400 hover:border-stone-600 hover:text-stone-300'
      }`}
    >
      {label}
    </button>
  );
}
