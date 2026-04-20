'use client';

import { type ReactNode } from 'react';
import Link from 'next/link';
import { type CopilotActionRequest } from '@/components/RezoomindCopilotSidebar';
import { formatSalary, getRelativeTime, normalizeLocation } from '@/lib/job-utils';
import { getFitPresentation, type Job, type JobInsight } from './_types';

export function DetailPanel({
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
        <div className="text-3xl text-fg-subtle">←</div>
        <p className="text-sm font-mono font-semibold text-fg-muted">Select a role</p>
        <p className="text-xs text-fg-subtle leading-5">
          Click any job and this panel will explain the fit, flag missing skills, and surface your
          next move.
        </p>
      </div>
    );
  }

  const fit = getFitPresentation(insight);
  const salary = formatSalary(job);

  const scoreColor =
    insight.scoreSource === 'ai'
      ? insight.score >= 85
        ? 'text-emerald-700 dark:text-emerald-400'
        : 'text-orange-600 dark:text-orange-400'
      : 'text-fg-muted';

  return (
    <div className="py-6">
      {/* Header */}
      <div className="px-6 pb-5 border-b border-line">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-mono font-medium text-fg-subtle">{job.company}</p>
            <h2 className="mt-1 text-lg font-mono font-semibold leading-snug text-fg">{job.role}</h2>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-fg-subtle">
              {normalizeLocation(job.location) && <span>{normalizeLocation(job.location)}</span>}
              {salary && (
                <span className="text-emerald-700 dark:text-emerald-400 font-medium">{salary}</span>
              )}
              <span>Posted {getRelativeTime(job.date_posted || job.created_at)}</span>
            </div>
          </div>
          {/* Score */}
          <div className="shrink-0 text-right">
            <p className={`text-3xl font-bold font-mono tabular-nums leading-none ${scoreColor}`}>
              {insight.score}%
            </p>
            <p className="mt-1 text-[10px] font-mono text-fg-subtle">{fit.label}</p>
          </div>
        </div>
        {/* Score bar */}
        <div className="mt-4 h-1 w-full bg-surface-sunken overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              insight.scoreSource === 'ai' ? 'bg-orange-600' : 'bg-fg-subtle/40'
            }`}
            style={{ width: `${insight.score}%` }}
          />
        </div>
        <p className="mt-1.5 text-[10px] font-mono text-fg-subtle">{fit.caption}</p>
      </div>

      {/* Why it fits */}
      {insight.matchReasons.length > 0 && (
        <div className="px-6 py-5 border-b border-line">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-fg-subtle">
            Why it fits
          </p>
          <ul className="mt-3 space-y-2.5">
            {insight.matchReasons.map((reason) => (
              <li key={reason} className="flex items-start gap-2.5 text-sm text-fg leading-relaxed">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-orange-600" />
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Missing skills */}
      {insight.missingSkills.length > 0 && (
        <div className="px-6 py-5 border-b border-line">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-fg-subtle">
            To strengthen your application
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {insight.missingSkills.map((skill) => (
              <span
                key={skill}
                className="border border-amber-600/40 bg-amber-600/10 px-2.5 py-1 text-xs font-mono font-medium text-amber-700 dark:text-amber-400"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Role snapshot */}
      {job.description && (
        <div className="px-6 py-5 border-b border-line">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-fg-subtle">
            Snapshot
          </p>
          <p className="mt-3 text-sm leading-relaxed text-fg-muted">
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
        <div className="flex gap-2">
          {job.url && (
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 border border-orange-600/50 bg-orange-600/10 py-2.5 text-center text-sm font-mono font-semibold text-orange-600 dark:text-orange-400 transition hover:bg-orange-600/20"
            >
              Open role ↗
            </a>
          )}
          <button
            type="button"
            onClick={onToggleSaved}
            className={`border px-4 py-2.5 text-sm font-mono font-semibold transition ${
              isSaved
                ? 'border-emerald-600/40 bg-emerald-600/10 text-emerald-700 dark:text-emerald-400'
                : 'border-line text-fg-muted hover:border-line'
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
              className="border border-orange-600/50 bg-orange-600/10 py-2 text-xs font-mono font-semibold text-orange-600 dark:text-orange-400 transition hover:bg-orange-600/20 disabled:opacity-40"
            >
              Explain fit
            </button>
            <button
              type="button"
              onClick={() => onQueueAction('tailor-bullets')}
              disabled={aiLocked}
              className="border border-line bg-surface-sunken/60 py-2 text-xs font-mono font-semibold text-fg-muted transition hover:border-line hover:text-fg disabled:opacity-40"
            >
              Tailor resume
            </button>
            <button
              type="button"
              onClick={() => onQueueAction('skill-gap')}
              disabled={aiLocked}
              className="border border-line bg-surface-sunken/60 py-2 text-xs font-mono font-semibold text-fg-muted transition hover:border-line hover:text-fg disabled:opacity-40"
            >
              Find gaps
            </button>
            <button
              type="button"
              onClick={() => onQueueAction('custom')}
              disabled={aiLocked}
              className="border border-line bg-surface-sunken/60 py-2 text-xs font-mono font-semibold text-fg-muted transition hover:border-line hover:text-fg disabled:opacity-40"
            >
              Draft outreach
            </button>
          </div>
        ) : (
          <Link
            href={setupHref}
            className="block w-full border border-dashed border-orange-600/50 py-2.5 text-center text-xs font-mono font-semibold text-orange-600 dark:text-orange-400 transition hover:border-orange-600 hover:bg-orange-600/10"
          >
            Add resume for AI match scores →
          </Link>
        )}
      </div>
    </div>
  );
}
