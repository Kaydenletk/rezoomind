'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import Link from 'next/link';

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

const ROLE_CATEGORIES = [
  { value: 'all', label: 'All Roles' },
  { value: 'software', label: 'Software Engineering' },
  { value: 'data', label: 'Data Science / Analytics' },
  { value: 'machine learning', label: 'Machine Learning / AI' },
  { value: 'frontend', label: 'Frontend' },
  { value: 'backend', label: 'Backend' },
  { value: 'full stack', label: 'Full Stack' },
  { value: 'devops', label: 'DevOps / Infrastructure' },
  { value: 'security', label: 'Security' },
  { value: 'product', label: 'Product / PM' },
  { value: 'design', label: 'Design / UX' },
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

function getJobFreshness(job: Job): 'new' | 'recent' | 'normal' {
  const dateStr = job.date_posted || job.created_at;
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);

  if (diffDays < 1) return 'new';
  if (diffDays < 3) return 'recent';
  return 'normal';
}

function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return '1 day ago';
  return `${diffDays} days ago`;
}

// Deterministic color from company name
function getAvatarColor(name: string): string {
  const colors = [
    'from-blue-500 to-indigo-600',
    'from-emerald-500 to-teal-600',
    'from-violet-500 to-purple-600',
    'from-rose-500 to-pink-600',
    'from-amber-500 to-orange-600',
    'from-cyan-500 to-blue-600',
    'from-fuchsia-500 to-pink-600',
    'from-lime-500 to-green-600',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedJobType, setSelectedJobType] = useState('all');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedTier, setSelectedTier] = useState('all');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [displayCount, setDisplayCount] = useState(50);
  const [totalCount, setTotalCount] = useState(0);

  const supabase = createSupabaseBrowserClient();

  const loadJobs = useCallback(async () => {
    // Get total count
    const { count } = await supabase
      .from('job_postings')
      .select('*', { count: 'exact', head: true });

    setTotalCount(count ?? 0);

    // Fetch all jobs ordered by date_posted (actual job age), then created_at
    const { data } = await supabase
      .from('job_postings')
      .select('*')
      .order('date_posted', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(2000);

    if (data && data.length > 0) {
      setJobs(data);
      setLastSyncTime(data[0].created_at);
    } else {
      setJobs([]);
    }

    setLoading(false);
  }, [supabase]);

  const triggerBackgroundSync = useCallback(async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/jobs/ensure-sync?force=true');
      const result = await res.json();
      if (result.ok && result.triggered) {
        // Sync was triggered — wait for it to finish, then reload
        setTimeout(() => {
          loadJobs();
          setSyncing(false);
        }, 5000);
      } else {
        setSyncing(false);
        if (result.lastSync) {
          setLastSyncTime(result.lastSync);
        }
      }
    } catch {
      setSyncing(false);
    }
  }, [loadJobs]);

  useEffect(() => {
    // 1. Load existing data immediately
    loadJobs();

    // 2. Trigger background sync (non-blocking)
    triggerBackgroundSync();

    // 3. Poll every 5 minutes for real-time feel
    const interval = setInterval(triggerBackgroundSync, 5 * 60 * 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset pagination when filters change
  useEffect(() => {
    setDisplayCount(50);
  }, [searchTerm, selectedLocation, selectedCategory, selectedJobType, selectedRegion, selectedTier]);

  // Dynamic location options from actual job data
  const locationOptions = useMemo(() => {
    const locationCounts = new Map<string, number>();
    jobs.forEach(job => {
      if (job.location) {
        const loc = job.location.trim();
        locationCounts.set(loc, (locationCounts.get(loc) || 0) + 1);
      }
    });

    const sorted = [...locationCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([loc, count]) => ({ value: loc, label: `${loc} (${count})` }));

    return [{ value: 'all', label: 'All Locations' }, ...sorted];
  }, [jobs]);

  // Filtered jobs with memoization
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        !term ||
        job.role.toLowerCase().includes(term) ||
        job.company.toLowerCase().includes(term) ||
        (job.location?.toLowerCase().includes(term) ?? false);

      const matchesLocation =
        selectedLocation === 'all' ||
        job.location === selectedLocation ||
        (job.location?.toLowerCase().includes(selectedLocation.toLowerCase()) ?? false);

      const matchesCategory =
        selectedCategory === 'all' ||
        job.role.toLowerCase().includes(selectedCategory.toLowerCase());

      const tags = job.tags || [];
      const matchesJobType =
        selectedJobType === 'all' || tags.includes(selectedJobType);

      const matchesRegion =
        selectedRegion === 'all' || tags.includes(selectedRegion);

      const matchesTier =
        selectedTier === 'all' || tags.includes(selectedTier);

      return matchesSearch && matchesLocation && matchesCategory && matchesJobType && matchesRegion && matchesTier;
    });
  }, [jobs, searchTerm, selectedLocation, selectedCategory, selectedJobType, selectedRegion, selectedTier]);

  const visibleJobs = filteredJobs.slice(0, displayCount);
  const hasMore = filteredJobs.length > displayCount;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-24 pb-16 px-6">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-3">
            Browse Opportunities
          </h1>
          <p className="text-lg text-slate-600 mb-3">
            {totalCount.toLocaleString()} verified positions from top companies
          </p>

          {/* Sync Status */}
          <div className="inline-flex items-center gap-2 text-sm text-slate-500">
            {syncing ? (
              <>
                <span className="inline-block w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
                <span>Checking for new jobs...</span>
              </>
            ) : lastSyncTime ? (
              <>
                <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full" />
                <span>Updated {getRelativeTime(lastSyncTime)}</span>
              </>
            ) : null}
            <button
              type="button"
              onClick={triggerBackgroundSync}
              disabled={syncing}
              className="ml-1 p-1.5 rounded-full hover:bg-slate-100 transition-colors disabled:opacity-50"
              title="Check for new jobs"
            >
              <svg className={`w-3.5 h-3.5 text-slate-400 ${syncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </motion.div>

        {/* Search & Filters */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 mb-6"
        >
          {/* Search row */}
          <div className="flex flex-col md:flex-row gap-3 mb-3">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search roles, companies, locations..."
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none text-sm"
              />
            </div>

            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="px-3 py-2.5 border border-slate-200 rounded-lg focus:border-cyan-500 focus:outline-none bg-white text-sm min-w-[180px]"
            >
              {locationOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2.5 border border-slate-200 rounded-lg focus:border-cyan-500 focus:outline-none bg-white text-sm min-w-[180px]"
            >
              {ROLE_CATEGORIES.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Tag filter chips */}
          <div className="flex flex-wrap gap-2">
            {/* Job Type chips */}
            {JOB_TYPE_FILTERS.map(opt => (
              <button
                key={`jt-${opt.value}`}
                type="button"
                onClick={() => setSelectedJobType(opt.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                  selectedJobType === opt.value
                    ? 'bg-cyan-600 text-white border-cyan-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-cyan-400'
                }`}
              >
                {opt.label}
              </button>
            ))}

            <span className="w-px h-6 bg-slate-200 self-center mx-1" />

            {/* Region chips */}
            {REGION_FILTERS.map(opt => (
              <button
                key={`rg-${opt.value}`}
                type="button"
                onClick={() => setSelectedRegion(opt.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                  selectedRegion === opt.value
                    ? 'bg-cyan-600 text-white border-cyan-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-cyan-400'
                }`}
              >
                {opt.label}
              </button>
            ))}

            <span className="w-px h-6 bg-slate-200 self-center mx-1" />

            {/* Tier chips */}
            {TIER_FILTERS.map(opt => (
              <button
                key={`tr-${opt.value}`}
                type="button"
                onClick={() => setSelectedTier(opt.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                  selectedTier === opt.value
                    ? 'bg-cyan-600 text-white border-cyan-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-cyan-400'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Results count */}
        {!loading && filteredJobs.length > 0 && (
          <p className="text-sm text-slate-500 mb-4">
            Showing {Math.min(displayCount, filteredJobs.length)} of {filteredJobs.length} jobs
            {(searchTerm || selectedLocation !== 'all' || selectedCategory !== 'all' || selectedJobType !== 'all' || selectedRegion !== 'all' || selectedTier !== 'all')
              ? ` (filtered from ${totalCount.toLocaleString()})`
              : ''}
          </p>
        )}

        {/* Job Listings */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-600">Loading jobs...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
            {syncing ? (
              <>
                <div className="inline-block w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-xl font-bold text-slate-900 mb-2">Fetching jobs from GitHub...</p>
                <p className="text-slate-600">Jobs will appear in a few seconds.</p>
              </>
            ) : (
              <>
                <p className="text-xl font-bold text-slate-900 mb-2">No jobs found</p>
                <p className="text-slate-600 mb-6">Try adjusting your search or filters</p>
                <Link
                  href="/preferences"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all text-sm"
                >
                  Set up job alerts
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {visibleJobs.map((job, index) => (
              <JobCard
                key={job.id}
                job={job}
                delay={index < 20 ? index * 0.03 : 0}
              />
            ))}
          </div>
        )}

        {/* Load More */}
        {hasMore && (
          <div className="text-center mt-8">
            <button
              type="button"
              onClick={() => setDisplayCount(prev => prev + 50)}
              className="px-6 py-3 border-2 border-slate-200 text-slate-700 font-semibold rounded-xl hover:border-cyan-500 hover:text-cyan-700 transition-all text-sm"
            >
              Show More ({(filteredJobs.length - displayCount).toLocaleString()} remaining)
            </button>
          </div>
        )}

        {/* Set Preferences CTA */}
        {filteredJobs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-12 text-center"
          >
            <div className="inline-block bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl p-6 border border-cyan-200">
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                Want personalized job alerts?
              </h3>
              <p className="text-slate-600 text-sm mb-4">
                Set your preferences and get matching jobs emailed weekly
              </p>
              <Link
                href="/preferences"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all text-sm"
              >
                Set My Preferences
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function JobCard({ job, delay }: { job: Job; delay: number }) {
  const freshness = getJobFreshness(job);

  const formatSalary = () => {
    if (!job.salary_min) return null;

    if (job.salary_interval === 'hourly') {
      // Convert back from annual to hourly for display
      const hourly = Math.round(job.salary_min / (40 * 52));
      return `$${hourly}/hr`;
    }
    if (job.salary_interval === 'yearly') {
      return `$${(job.salary_min / 1000).toFixed(0)}K/yr`;
    }
    // Fallback
    if (job.salary_max && job.salary_max !== job.salary_min) {
      return `$${(job.salary_min / 1000).toFixed(0)}K - $${(job.salary_max / 1000).toFixed(0)}K`;
    }
    return `$${(job.salary_min / 1000).toFixed(0)}K`;
  };

  const getTimeSince = () => {
    // Prefer date_posted (actual posting age) over created_at (sync time)
    const dateStr = job.date_posted || job.created_at;
    return getRelativeTime(dateStr);
  };

  const avatarColor = getAvatarColor(job.company);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 hover:border-cyan-300 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Company Avatar */}
          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${avatarColor} flex items-center justify-center flex-shrink-0`}>
            <span className="text-white text-sm font-bold">
              {job.company.charAt(0).toUpperCase()}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            {/* Role + Freshness badge */}
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-semibold text-slate-900 truncate">
                {job.role}
              </h3>
              {freshness === 'new' && (
                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded flex-shrink-0">
                  New
                </span>
              )}
              {freshness === 'recent' && (
                <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded flex-shrink-0">
                  Recent
                </span>
              )}
              {job.tags?.includes('faang') && (
                <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded flex-shrink-0">
                  FAANG+
                </span>
              )}
              {job.tags?.includes('quant') && (
                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded flex-shrink-0">
                  Quant
                </span>
              )}
            </div>

            {/* Meta line: Company · Location · Salary · Time */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
              <span className="font-medium text-slate-700">{job.company}</span>
              {job.location && (
                <>
                  <span className="text-slate-300">·</span>
                  <span>{job.location}</span>
                </>
              )}
              {formatSalary() && (
                <>
                  <span className="text-slate-300">·</span>
                  <span className="text-emerald-600 font-medium">{formatSalary()}</span>
                </>
              )}
              <span className="text-slate-300">·</span>
              <span>{getTimeSince()}</span>
            </div>
          </div>
        </div>

        {/* Apply Button */}
        {job.url && (
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-cyan-600 text-white text-sm font-semibold rounded-lg hover:bg-cyan-700 transition-colors flex-shrink-0"
          >
            Apply
          </a>
        )}
      </div>
    </motion.div>
  );
}
