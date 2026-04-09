"use client";

import { MatchScoreRing } from "@/components/dashboard/MatchScoreRing";
import type { SmartFeedJob, JobMatch } from "./types";

interface JobCardProps {
  job: SmartFeedJob;
  match?: JobMatch | null;
  isSelected: boolean;
  isSaved: boolean;
  onSelect: (id: string) => void;
  onToggleSave: (job: SmartFeedJob) => void;
  isAuthenticated: boolean;
}

function getRelativeTime(dateStr: string | null): string {
  if (!dateStr) return "";

  const date = new Date(dateStr);

  // If the date is invalid (e.g. human-readable "May 02" from GitHub CSV), return the original string
  if (isNaN(date.getTime())) {
    return dateStr;
  }

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 1000 / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export function JobCard({
  job,
  match,
  isSelected,
  isSaved,
  onSelect,
  onToggleSave,
  isAuthenticated,
}: JobCardProps) {
  const score = isAuthenticated ? (match?.matchScore ?? null) : null;

  const matchedSkills = isAuthenticated ? (match?.matchReasons ?? []) : [];
  const missingSkills = isAuthenticated ? (match?.missingSkills ?? []) : [];
  const hasSkillTags =
    isAuthenticated && (matchedSkills.length > 0 || missingSkills.length > 0);

  // Show up to 4 skill tags total, preferring matched first
  const visibleMatched = matchedSkills.slice(0, 4);
  const remainingSlots = 4 - visibleMatched.length;
  const visibleMissing = missingSkills.slice(0, remainingSlots);

  const relativeTime = getRelativeTime(job.datePosted);

  const metaParts = [
    job.location,
    job.salary,
    relativeTime,
  ].filter(Boolean);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(job.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(job.id);
        }
      }}
      className={[
        "flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors",
        isSelected
          ? "bg-orange-50 dark:bg-orange-950/50 border-l-2 border-l-orange-500"
          : "bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/50",
      ].join(" ")}
    >
      {/* Match score ring */}
      <div className="shrink-0 mt-0.5">
        <MatchScoreRing score={score} size={36} />
      </div>

      {/* Center content */}
      <div className="flex-1 min-w-0">
        {/* Row 1: Company + Role */}
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="font-mono font-semibold text-sm text-stone-900 dark:text-stone-100 truncate">
            {job.company}
          </span>
          <span className="text-stone-700 dark:text-stone-300 text-sm font-medium truncate">
            {job.role}
          </span>
        </div>

        {/* Row 2: Meta — location, salary, time */}
        {metaParts.length > 0 && (
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {metaParts.map((part, i) => (
              <span key={i} className="text-stone-500 text-xs">
                {i > 0 && <span className="mr-2 text-stone-300 dark:text-stone-700">·</span>}
                {part}
              </span>
            ))}
          </div>
        )}

        {/* Row 3: Skill tags (authenticated only) */}
        {hasSkillTags && (
          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
            {visibleMatched.map((skill) => (
              <span
                key={`match-${skill}`}
                className="text-green-600 bg-green-50 dark:bg-green-950/30 text-[11px] px-1.5 py-0.5 font-mono"
              >
                ✓ {skill}
              </span>
            ))}
            {visibleMissing.map((skill) => (
              <span
                key={`missing-${skill}`}
                className="text-red-500 bg-red-50 dark:bg-red-950/30 text-[11px] px-1.5 py-0.5 font-mono"
              >
                ✗ {skill}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Right: Save button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleSave(job);
        }}
        className="shrink-0 text-lg leading-none mt-0.5 transition-colors"
        aria-label={isSaved ? "Unsave job" : "Save job"}
      >
        {isSaved ? (
          <span className="text-orange-500">♥</span>
        ) : (
          <span className="text-stone-400 hover:text-orange-400">♡</span>
        )}
      </button>
    </div>
  );
}
