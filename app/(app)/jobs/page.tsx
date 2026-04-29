'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';

import { RezoomAITrialNotice } from '@/components/RezoomAITrialNotice';
import { RezoomindCopilotSidebar, type CopilotActionRequest } from '@/components/RezoomindCopilotSidebar';
import { useAuth } from '@/hooks/useAuth';
import { useRezoomAIAccess } from '@/hooks/useRezoomAIAccess';
import { useSavedJobs } from '@/hooks/useSavedJobs';
import {
  ROLE_CATEGORIES,
  JOB_TYPE_FILTERS,
  REGION_FILTERS,
  TIER_FILTERS,
  buildEstimatedInsight,
  clamp,
  getJobTimestamp,
  getRelativeTime,
  getRoleGroupLabels,
  normalizeLocation,
  sortJobsNewestFirst,
  type UserPreferences,
} from '@/lib/job-utils';
import { DetailPanel } from './_components/DetailPanel';
import { EmptyState } from './_components/EmptyState';
import { FilterStrip } from './_components/FilterStrip';
import { TopMatchCard } from './_components/TopMatchCard';
import {
  readJobsCache,
  SYNC_STALE_MS,
  type Job,
  type JobInsight,
  type JobsCache,
  type ProfileState,
} from './_components/_types';

function toSavedJob(job: Job) {
  return { id: job.id, company: job.company, role: job.role, location: job.location, url: job.url };
}

function toCopilotJob(job: Job | null) {
  if (!job) return null;
  return { id: job.id, role: job.role, company: job.company, url: job.url, location: job.location };
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
  const [_totalCount, setTotalCount] = useState(0);
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

  useEffect(() => { jobsRef.current = jobs; }, [jobs]);
  useEffect(() => { lastSyncRef.current = lastSyncTime; }, [lastSyncTime]);

  useEffect(() => {
    let cancelled = false;

    const loadUserContext = async () => {
      if (!isAuthenticated) {
        if (!cancelled) setProfileState({ loading: false, hasResume: false, masterResume: '', preferences: null });
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

        setProfileState({ loading: false, hasResume, masterResume, preferences });
      } catch {
        if (!cancelled) setProfileState({ loading: false, hasResume: false, masterResume: '', preferences: null });
      }
    };

    void loadUserContext();
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  const cacheJobs = useCallback(
    (items: Job[], count: number, lastSync?: string | null) => {
      try {
        const payload: JobsCache = {
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
      if (typeof lastSync === 'string') setLastSyncTime(lastSync);
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
      if (!options?.silent && !hasLoadedOnce && jobsRef.current.length === 0) setLoading(true);

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
      if (result.lastSync) setLastSyncTime(result.lastSync);
      const hasUpdates = (result.newJobs ?? 0) > 0 || (result.upserted ?? 0) > 0;
      if (hasUpdates) await loadJobs({ skipFallback: true, silent: true });
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
      return Date.now() - new Date(lastSync).getTime() > SYNC_STALE_MS;
    };

    const run = async () => {
      await loadJobs();
      if (cancelled) return;
      if (shouldSyncNow(lastSyncRef.current)) void triggerBackgroundSync();
      interval = setInterval(() => {
        if (shouldSyncNow(lastSyncRef.current)) void triggerBackgroundSync();
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
      if (location) locationCounts.set(location, (locationCounts.get(location) || 0) + 1);
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
      job.role, job.company, job.location ?? '', normalizeLocation(job.location) ?? '',
      job.description ?? '', ...(job.tags ?? []), ...getRoleGroupLabels(job),
    ].join(' ').toLowerCase();
    return searchIndex.includes(term.toLowerCase());
  }, []);

  const matchesCategory = useCallback(
    (job: Job) => {
      if (selectedCategory === 'all') return true;
      const option = ROLE_CATEGORIES.find((item) => item.value === selectedCategory);
      if (!option) return true;
      const role = job.role.toLowerCase();
      return option.matchers.some((matcher) => role.includes(matcher));
    },
    [selectedCategory]
  );

  const matchesLocation = useCallback(
    (job: Job) => selectedLocation === 'all' || normalizeLocation(job.location) === selectedLocation,
    [selectedLocation]
  );

  const matchesSharedFilters = useCallback(
    (job: Job) => {
      const tags = job.tags ?? [];
      return (
        (selectedJobType === 'all' || tags.includes(selectedJobType)) &&
        (selectedRegion === 'all' || tags.includes(selectedRegion)) &&
        (selectedTier === 'all' || tags.includes(selectedTier)) &&
        (!savedOnly || savedJobs.isSaved(job.id))
      );
    },
    [savedJobs, savedOnly, selectedJobType, selectedRegion, selectedTier]
  );

  const searchScopedJobs = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return jobs.filter((job) => matchesSearch(job, term) && matchesCategory(job) && matchesLocation(job));
  }, [jobs, matchesCategory, matchesLocation, matchesSearch, searchTerm]);

  const filteredJobs = useMemo(() => {
    const items = searchScopedJobs.filter((job) => matchesSharedFilters(job));
    return [...items].sort((left, right) => {
      if (sortBy === 'newest') return getJobTimestamp(right) - getJobTimestamp(left);
      if (sortBy === 'highest-pay') return (right.salary_min ?? 0) - (left.salary_min ?? 0);
      const leftScore = (jobInsights[left.id] ?? buildEstimatedInsight(left, profileState.preferences, profileState.masterResume)).score;
      const rightScore = (jobInsights[right.id] ?? buildEstimatedInsight(right, profileState.preferences, profileState.masterResume)).score;
      if (rightScore !== leftScore) return rightScore - leftScore;
      return getJobTimestamp(right) - getJobTimestamp(left);
    });
  }, [jobInsights, matchesSharedFilters, profileState.masterResume, profileState.preferences, searchScopedJobs, sortBy]);

  const visibleJobs = filteredJobs.slice(0, displayCount);
  const hasMore = filteredJobs.length > displayCount;

  useEffect(() => {
    if (filteredJobs.length === 0) { setSelectedJobId(null); return; }
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
    if (!isAuthenticated || !profileState.hasResume || candidateJobs.length === 0) return;

    const pendingIds = candidateJobs
      .map((job) => job.id)
      .filter((id) => !requestedScoreIdsRef.current.has(id));
    if (pendingIds.length === 0) return;

    pendingIds.forEach((id) => requestedScoreIdsRef.current.add(id));

    let cancelled = false;
    // Tracks whether we successfully updated state for this batch; gates cleanup rollback.
    let landed = false;

    const fetchBatch = async () => {
      try {
        const res = await fetch('/api/matches/batch-score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobIds: pendingIds }),
        });
        if (!res.ok) throw new Error('batch-score request failed');
        const data = await res.json();
        if (cancelled || !data?.ok || !data.scores) return;

        const scores = data.scores as Record<string, number>;
        const details = (data.details ?? {}) as Record<
          string,
          { reasons?: string[]; missingSkills?: string[] } | undefined
        >;

        landed = true;
        setJobInsights((prev) => {
          const next = { ...prev };
          for (const [id, score] of Object.entries(scores)) {
            if (typeof score !== 'number') continue;
            const d = details[id];
            next[id] = {
              score: clamp(Math.round(score), 50, 99),
              scoreSource: 'ai',
              matchReasons: (d?.reasons ?? []).slice(0, 4),
              missingSkills: (d?.missingSkills ?? []).slice(0, 4),
            };
          }
          return next;
        });
      } catch {
        // Keep estimated insight fallback; allow retry on next effect run.
        pendingIds.forEach((id) => requestedScoreIdsRef.current.delete(id));
      }
    };

    void fetchBatch();
    return () => {
      cancelled = true;
      if (!landed) {
        pendingIds.forEach((id) => requestedScoreIdsRef.current.delete(id));
      }
    };
  }, [activeJob, isAuthenticated, profileState.hasResume, visibleJobs]);

  const queueCopilotAction = useCallback((request: Omit<CopilotActionRequest, 'token'>) => {
    setCopilotAction({ token: Date.now() + Math.floor(Math.random() * 1000), ...request });
  }, []);

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
    if (selectedCategory !== 'all') filters.push(ROLE_CATEGORIES.find((o) => o.value === selectedCategory)?.label ?? selectedCategory);
    if (selectedJobType !== 'all') filters.push(JOB_TYPE_FILTERS.find((o) => o.value === selectedJobType)?.label ?? selectedJobType);
    if (selectedRegion !== 'all') filters.push(REGION_FILTERS.find((o) => o.value === selectedRegion)?.label ?? selectedRegion);
    if (selectedTier !== 'all') filters.push(TIER_FILTERS.find((o) => o.value === selectedTier)?.label ?? selectedTier);
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
      JOB_TYPE_FILTERS.forEach((o) => {
        if (o.value !== 'all' && tags.includes(o.value)) counts.jobType.set(o.value, (counts.jobType.get(o.value) || 0) + 1);
      });
      REGION_FILTERS.forEach((o) => {
        if (o.value !== 'all' && tags.includes(o.value)) counts.region.set(o.value, (counts.region.get(o.value) || 0) + 1);
      });
      TIER_FILTERS.forEach((o) => {
        if (o.value !== 'all' && tags.includes(o.value)) counts.tier.set(o.value, (counts.tier.get(o.value) || 0) + 1);
      });
    });
    return counts;
  }, [searchScopedJobs]);

  const trialNoticeElement = (
    <RezoomAITrialNotice
      isAuthenticated={aiAccess.isAuthenticated}
      remainingGuestCredits={aiAccess.remainingGuestCredits}
      requiresLogin={aiAccess.requiresLogin}
      loginHref={aiAccess.loginHref}
      encouragement={aiAccess.encouragement}
      theme="light"
      className="mt-4"
    />
  );

  if (loading && !hasLoadedOnce) {
    return (
      <div className="min-h-screen bg-surface pt-24 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="relative h-10 w-10">
            <span className="absolute inset-0 animate-ping bg-orange-600 opacity-20" />
            <span className="relative block h-10 w-10 border-2 border-orange-600 border-t-transparent animate-spin" />
          </div>
          <p className="text-sm font-mono font-medium text-fg">Finding your best matches…</p>
          <p className="text-xs text-fg-subtle">Pulling fresh internship and new-grad roles.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">

      {/* Breadcrumb bar */}
      <div className="sticky top-[64px] z-20 border-b border-line bg-surface/95 backdrop-blur-md">
        <div className="mx-auto max-w-[1600px] flex items-center justify-between px-4 sm:px-6 py-2.5">
          <div className="flex items-center gap-1.5 text-sm font-mono">
            <span className="font-medium text-fg-subtle">Jobs</span>
            <span className="text-fg-subtle">/</span>
            <span className="font-medium text-fg">Discover</span>
            {filteredJobs.length > 0 && (
              <span className="ml-2 bg-surface-sunken px-2 py-0.5 text-xs font-medium text-fg-subtle">
                {filteredJobs.length.toLocaleString()}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-fg-subtle font-mono">
            {lastSyncTime && <span>Updated {getRelativeTime(lastSyncTime)}</span>}
            <button
              type="button"
              onClick={() => void triggerBackgroundSync()}
              disabled={syncing}
              className={`px-3 py-1.5 text-xs font-mono font-medium transition ${
                syncing
                  ? 'text-fg-subtle'
                  : 'border border-line bg-surface-sunken/60 text-fg-muted hover:border-orange-600/50 hover:text-orange-600 dark:hover:text-orange-400 cursor-pointer'
              }`}
            >
              {syncing ? (
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 animate-spin border border-line border-t-transparent" />
                  Syncing…
                </span>
              ) : (
                'Refresh jobs'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Search + filter strip */}
      <FilterStrip
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedJobType={selectedJobType}
        setSelectedJobType={setSelectedJobType}
        selectedTier={selectedTier}
        setSelectedTier={setSelectedTier}
        selectedRegion={selectedRegion}
        setSelectedRegion={setSelectedRegion}
        savedOnly={savedOnly}
        setSavedOnly={setSavedOnly}
        savedCount={savedJobs.savedJobIds.length}
        selectedLocation={selectedLocation}
        setSelectedLocation={setSelectedLocation}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        sortBy={sortBy}
        setSortBy={setSortBy}
        locationOptions={locationOptions}
        filterCounts={filterCounts}
        activeFilters={activeFilters}
        clearAllFilters={clearAllFilters}
      />

      {/* 3-column grid */}
      <div className="mx-auto max-w-[1600px] grid xl:grid-cols-[200px_1fr_380px] divide-x divide-line pt-0">

        {/* Left rail */}
        <aside className="hidden xl:block sticky top-[155px] self-start max-h-[calc(100vh-155px)] overflow-y-auto py-8 px-4 space-y-7">
          <div>
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-fg-subtle">Category</p>
            <nav className="space-y-0.5">
              {ROLE_CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`w-full px-3 py-2 text-left text-sm font-mono transition ${
                    selectedCategory === cat.value
                      ? 'bg-orange-600/10 font-medium text-orange-600 dark:text-orange-400'
                      : 'text-fg-subtle hover:bg-surface-sunken/80 hover:text-fg'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </nav>
          </div>

          {!profileState.hasResume && (
            <Link
              href={setupHref}
              className="block bg-orange-600/5 border border-orange-600/30 p-3 text-xs leading-5 text-fg-muted hover:border-orange-600/50 transition"
            >
              <span className="block font-mono font-semibold text-fg mb-0.5">Add your resume</span>
              Turn estimated fits into AI-powered match scores.
            </Link>
          )}

          {profileState.hasResume && (
            <div className="text-xs text-fg-subtle space-y-1 font-mono">
              <p className="font-medium text-fg-muted">AI active</p>
              <p>Scoring visible roles against your resume.</p>
            </div>
          )}
        </aside>

        {/* Center: job list */}
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
                    className="border border-line bg-surface-sunken/60 px-6 py-2.5 text-sm font-mono text-fg-muted transition hover:border-orange-600/50 hover:text-orange-600 dark:hover:text-orange-400"
                  >
                    Load {Math.min(40, filteredJobs.length - displayCount)} more roles
                    <span className="ml-2 text-fg-subtle">({(filteredJobs.length - displayCount).toLocaleString()} left)</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </main>

        {/* Right: detail panel */}
        <aside className="hidden xl:block sticky top-[155px] self-start max-h-[calc(100vh-155px)] overflow-y-auto">
          <DetailPanel
            job={activeJob}
            insight={activeInsight}
            isSaved={activeJob ? savedJobs.isSaved(activeJob.id) : false}
            onToggleSaved={async () => { if (!activeJob) return; await savedJobs.toggleSavedJob(toSavedJob(activeJob)); }}
            onQueueAction={(type) => queueCopilotAction({ type })}
            profileReady={profileState.hasResume}
            setupHref={setupHref}
            trialNotice={trialNoticeElement}
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
            onToggleSaved={async () => { await savedJobs.toggleSavedJob(toSavedJob(activeJob)); }}
            onQueueAction={(type) => queueCopilotAction({ type })}
            profileReady={profileState.hasResume}
            setupHref={setupHref}
            trialNotice={trialNoticeElement}
            aiLocked={aiAccess.requiresLogin}
          />
        </div>
      )}
    </div>
  );
}
