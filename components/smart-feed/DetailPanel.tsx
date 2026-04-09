"use client";

import { useState } from "react";
import { MatchScoreRing } from "@/components/dashboard/MatchScoreRing";
import type { SmartFeedJob, JobMatch } from "./types";

interface DetailPanelProps {
  job: SmartFeedJob | null;
  match?: JobMatch | null;
  isSaved: boolean;
  isAuthenticated: boolean;
  onToggleSave: (job: SmartFeedJob) => void;
  onTailorClick: (job: SmartFeedJob) => void;
  onAskAI: (job: SmartFeedJob) => void;
  jobDescription?: string | null;
}

function getRelativeTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 1000 / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export function DetailPanel({
  job,
  match,
  isSaved,
  isAuthenticated,
  onToggleSave,
  onTailorClick,
  onAskAI,
  jobDescription,
}: DetailPanelProps) {
  const [descExpanded, setDescExpanded] = useState(false);

  // Empty state
  if (!job) {
    return (
      <div className="sticky top-[57px] h-[calc(100vh-57px)] overflow-y-auto bg-white dark:bg-stone-900 flex items-center justify-center">
        <div className="text-center space-y-3">
          <svg
            className="mx-auto text-stone-300 dark:text-stone-700"
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="2" y="7" width="20" height="14" rx="0" />
            <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
          </svg>
          <p className="font-mono text-sm text-stone-400">
            Select a job to see details
          </p>
        </div>
      </div>
    );
  }

  const description = jobDescription ?? job.description ?? null;
  const descTruncated =
    description && description.length > 400
      ? description.slice(0, 400) + "…"
      : description;

  const showMatch =
    isAuthenticated &&
    match != null &&
    match.matchScore != null;

  const matchedSkills = match?.matchReasons ?? [];
  const missingSkills = match?.missingSkills ?? [];

  const relativeTime = getRelativeTime(job.datePosted);
  const metaParts = [job.location, job.salary, relativeTime].filter(Boolean);

  return (
    <div className="sticky top-[57px] h-[calc(100vh-57px)] overflow-y-auto bg-white dark:bg-stone-900 p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <h2 className="font-mono font-bold text-lg text-stone-900 dark:text-stone-100 leading-snug">
            {job.role}
          </h2>
          <p className="text-sm text-stone-600 dark:text-stone-400 font-mono mt-0.5">
            {job.company}
          </p>
          {metaParts.length > 0 && (
            <div className="flex items-center flex-wrap gap-x-1.5 gap-y-0.5 mt-1">
              {metaParts.map((part, i) => (
                <span key={i} className="text-xs text-stone-500 font-mono flex items-center gap-1.5">
                  {i > 0 && (
                    <span className="text-stone-300 dark:text-stone-700">·</span>
                  )}
                  {part}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Save button */}
        <button
          type="button"
          onClick={() => onToggleSave(job)}
          className="shrink-0 text-xl leading-none transition-colors"
          aria-label={isSaved ? "Unsave job" : "Save job"}
        >
          {isSaved ? (
            <span className="text-orange-500">♥</span>
          ) : (
            <span className="text-stone-400 hover:text-orange-400">♡</span>
          )}
        </button>
      </div>

      {/* Match section */}
      {showMatch && (
        <div className="border border-stone-200 dark:border-stone-800 p-4 mb-4 space-y-3">
          <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500 font-mono">
            Match Analysis
          </p>

          {/* Score ring + sub-scores */}
          <div className="flex items-center gap-4">
            <MatchScoreRing score={match!.matchScore} size={64} />
            <div className="space-y-1">
              {match!.skillsMatch != null && (
                <p className="font-mono text-xs text-stone-600 dark:text-stone-400">
                  Skills: {match!.skillsMatch}%
                </p>
              )}
              {match!.experienceMatch != null && (
                <p className="font-mono text-xs text-stone-600 dark:text-stone-400">
                  Experience: {match!.experienceMatch}%
                </p>
              )}
            </div>
          </div>

          {/* Matched skills */}
          {matchedSkills.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {matchedSkills.map((skill) => (
                <span
                  key={`match-${skill}`}
                  className="text-green-600 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50 font-mono text-[11px] px-2 py-1"
                >
                  ✓ {skill}
                </span>
              ))}
            </div>
          )}

          {/* Missing skills */}
          {missingSkills.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {missingSkills.map((skill) => (
                <span
                  key={`missing-${skill}`}
                  className="text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 font-mono text-[11px] px-2 py-1"
                >
                  ✗ {skill}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions row */}
      <div className="flex items-stretch gap-2 mb-5">
        {/* Apply */}
        <button
          type="button"
          onClick={() => job.url && window.open(job.url, "_blank")}
          disabled={!job.url}
          className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:bg-stone-300 dark:disabled:bg-stone-700 disabled:cursor-not-allowed text-white font-mono text-sm px-4 py-2 transition-colors text-center"
        >
          Apply
        </button>

        {/* Tailor Resume */}
        {isAuthenticated ? (
          <button
            type="button"
            onClick={() => onTailorClick(job)}
            className="border border-orange-600/50 bg-orange-600/10 text-orange-600 dark:text-orange-400 hover:bg-orange-600/20 font-mono text-sm px-4 py-2 transition-colors whitespace-nowrap"
          >
            ✦ Tailor Resume
          </button>
        ) : (
          <span className="border border-stone-200 dark:border-stone-800 font-mono text-xs px-3 py-2 text-stone-400 dark:text-stone-600 flex items-center whitespace-nowrap">
            Sign up to unlock tailoring
          </span>
        )}

        {/* Ask AI */}
        {isAuthenticated ? (
          <button
            type="button"
            onClick={() => onAskAI(job)}
            className="border border-orange-600/50 bg-orange-600/10 text-orange-600 dark:text-orange-400 hover:bg-orange-600/20 font-mono text-sm px-4 py-2 transition-colors whitespace-nowrap"
          >
            ✦ Ask AI
          </button>
        ) : (
          <span className="border border-stone-200 dark:border-stone-800 font-mono text-xs px-3 py-2 text-stone-400 dark:text-stone-600 flex items-center whitespace-nowrap">
            Sign up to unlock AI
          </span>
        )}
      </div>

      {/* Description */}
      {description && (
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500 font-mono mb-2">
            Description
          </p>
          <p className="text-stone-600 dark:text-stone-400 text-sm leading-relaxed whitespace-pre-line">
            {descExpanded ? description : descTruncated}
          </p>
          {description.length > 400 && (
            <button
              type="button"
              onClick={() => setDescExpanded((prev) => !prev)}
              className="mt-2 font-mono text-xs text-orange-500 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
            >
              {descExpanded ? "Show less" : "Show more"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
