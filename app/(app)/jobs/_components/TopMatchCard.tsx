'use client';

import { motion } from 'framer-motion';
import { formatSalary, getJobFreshness, getRelativeTime, normalizeLocation } from '@/lib/job-utils';
import { getFitPresentation, type Job, type JobInsight } from './_types';

export function TopMatchCard({
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

  const scoreColor =
    insight.scoreSource === 'ai'
      ? insight.score >= 85
        ? 'text-emerald-700 dark:text-emerald-400'
        : 'text-orange-600 dark:text-orange-400'
      : 'text-fg-subtle';

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.2 }}
      onClick={onSelect}
      className={`group relative flex cursor-pointer items-start gap-4 border-b px-5 py-4 transition-colors ${
        selected
          ? 'border-b-transparent bg-orange-50 dark:bg-orange-950/40 border-l-2 border-l-orange-600'
          : 'border-line hover:bg-surface-sunken/80'
      }`}
    >
      {/* Company monogram */}
      <div
        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center text-[11px] font-bold font-mono transition-colors ${
          selected
            ? 'bg-orange-600/20 text-orange-600 dark:text-orange-400'
            : 'bg-surface-sunken text-fg-muted group-hover:bg-surface-sunken'
        }`}
      >
        {job.company.slice(0, 2).toUpperCase()}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {/* Row 1: title + score */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="truncate text-sm font-mono font-semibold leading-tight text-fg">
            {job.role}
          </h3>
          <span className={`shrink-0 text-sm font-bold font-mono tabular-nums ${scoreColor}`}>
            {insight.score}%
          </span>
        </div>

        {/* Row 2: meta */}
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-fg-subtle">
          <span className="font-medium text-fg-muted">{job.company}</span>
          {normalizeLocation(job.location) && (
            <>
              <span>·</span>
              <span>{normalizeLocation(job.location)}</span>
            </>
          )}
          {salary && (
            <>
              <span>·</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-medium">{salary}</span>
            </>
          )}
          <span>·</span>
          <span>{getRelativeTime(job.date_posted || job.created_at)}</span>
          {freshness === 'new' && (
            <span className="bg-orange-600/20 px-1.5 py-0.5 font-mono font-semibold text-orange-600 dark:text-orange-400 text-[10px]">
              New
            </span>
          )}
          {freshness === 'recent' && (
            <span className="bg-surface-sunken px-1.5 py-0.5 font-mono font-semibold text-fg-muted text-[10px]">
              Recent
            </span>
          )}
        </div>

        {/* Fit badge */}
        <div className="mt-1.5 flex items-center gap-2">
          <span
            className={`text-[10px] font-mono font-medium ${
              insight.scoreSource === 'ai' ? 'text-orange-600 dark:text-orange-400' : 'text-fg-subtle'
            }`}
          >
            {fit.label}
          </span>
          {/* Micro progress bar */}
          <div className="flex-1 max-w-[80px] h-0.5 bg-surface-sunken overflow-hidden">
            <div
              className={`h-full ${insight.scoreSource === 'ai' ? 'bg-orange-600' : 'bg-fg-subtle/40'}`}
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
              ? 'bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 border border-emerald-600/40'
              : 'bg-surface-raised border border-line text-fg-muted hover:border-line'
          }`}
        >
          {saved ? '✓' : 'Save'}
        </button>
        {job.url && (
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="border border-line bg-surface-raised px-2.5 py-1 text-[11px] font-mono font-semibold text-fg-muted hover:border-orange-600/50 hover:text-orange-600 dark:hover:text-orange-400 transition"
          >
            Open ↗
          </a>
        )}
      </div>
    </motion.div>
  );
}
