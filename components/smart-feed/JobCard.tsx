"use client";

import { MatchScoreRing } from "@/components/dashboard/MatchScoreRing";
import { StatusPill, type PillStatus } from "./StatusPill";
import { FEED_COPY } from "./copy";
import { deriveAIReason, deriveStatus } from "@/lib/feed-derivations";
import type { SmartFeedJob, JobMatch } from "./types";

interface JobCardProps {
  job: SmartFeedJob;
  match?: JobMatch | null;
  isSelected: boolean;
  isSaved: boolean;
  isApplied: boolean;
  pipelineStatus?: PillStatus | null;
  onSelect: (id: string) => void;
  onToggleSave: (job: SmartFeedJob) => void;
  isAuthenticated: boolean;
}

function getRelativeTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
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
  isApplied,
  pipelineStatus,
  onSelect,
  onToggleSave,
  isAuthenticated,
}: JobCardProps) {
  const score = isAuthenticated ? match?.matchScore ?? null : null;
  const muted = isAuthenticated && score != null && score < 50;

  const savedSet = new Set(isSaved ? [job.id] : []);
  const appliedSet = new Set(isApplied ? [job.id] : []);
  const derivedStatus = deriveStatus(job, savedSet, appliedSet);
  const status: PillStatus | null = pipelineStatus ?? derivedStatus;

  const aiReason = isAuthenticated ? deriveAIReason(match ?? null) : null;

  const relativeTime = getRelativeTime(job.datePosted);
  const metaParts = [job.location, job.salary, relativeTime].filter(Boolean);

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
        "flex items-start gap-3 px-4 py-2.5 cursor-pointer transition-[background-color,transform]",
        isSelected
          ? "bg-orange-50 dark:bg-orange-950/40 border-l-[3px] border-l-orange-500 translate-x-[2px]"
          : "bg-surface-raised border-b border-line border-l-[3px] border-l-transparent hover:bg-surface-sunken/60",
        muted && !isSelected ? "opacity-70 hover:opacity-100" : "",
      ].join(" ")}
    >
      <div className="shrink-0 mt-0.5">
        <MatchScoreRing score={score} size={32} muted={muted} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span
            className={[
              "font-mono text-sm text-fg truncate",
              isSelected ? "font-bold" : "font-semibold",
            ].join(" ")}
          >
            {job.company}
          </span>
          <span className="text-fg-subtle text-sm">·</span>
          <span className="text-fg-muted text-sm font-medium truncate">{job.role}</span>
        </div>

        {metaParts.length > 0 && (
          <div className="flex items-center gap-2 mt-0.5 flex-wrap text-fg-subtle text-[11px] font-mono">
            {metaParts.map((part, i) => (
              <span key={i}>
                {i > 0 && <span className="mr-2">·</span>}
                {part}
              </span>
            ))}
          </div>
        )}

        {aiReason && (
          <p className="mt-1 text-[11px] text-fg-muted font-mono truncate">
            <span className="text-orange-700 dark:text-orange-400">{FEED_COPY.aiReason.prefix}</span>
            {aiReason}
          </p>
        )}
      </div>

      <div className="shrink-0 flex flex-col items-end gap-1.5 mt-0.5">
        {status && <StatusPill status={status} />}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSave(job);
          }}
          className="text-lg leading-none transition-colors"
          aria-label={isSaved ? "Unsave job" : "Save job"}
        >
          {isSaved ? (
            <span className="text-orange-500">♥</span>
          ) : (
            <span className="text-fg-muted hover:text-orange-400">♡</span>
          )}
        </button>
      </div>
    </div>
  );
}
