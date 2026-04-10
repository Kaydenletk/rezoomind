"use client";

import { useState } from "react";
import { MatchScoreRing } from "@/components/dashboard/MatchScoreRing";
import { MatchExplanationStream } from "@/components/smart-feed/MatchExplanationStream";
import { CoverLetterStream } from "@/components/smart-feed/CoverLetterStream";
import type { SmartFeedJob, JobMatch, DetailPanelMode } from "./types";

interface DetailPanelProps {
  job: SmartFeedJob | null;
  match?: JobMatch | null;
  isSaved: boolean;
  isAuthenticated: boolean;
  onToggleSave: (job: SmartFeedJob) => void;
  onTailorClick: (job: SmartFeedJob) => void;
  onAskAI: (job: SmartFeedJob) => void;
  jobDescription?: string | null;
  // Controlled panel mode from SmartFeedShell
  panelMode: DetailPanelMode;
  onPanelModeChange: (mode: DetailPanelMode) => void;
  savedResumeText: string | null;
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

const TABS: { id: DetailPanelMode; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "explain", label: "✦ Explain" },
  { id: "cover-letter", label: "Cover Letter" },
];

export function DetailPanel({
  job,
  match,
  isSaved,
  isAuthenticated,
  onToggleSave,
  onTailorClick,
  jobDescription,
  panelMode,
  onPanelModeChange,
  savedResumeText,
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

  const hasMatch = isAuthenticated && match != null && match.matchScore != null;
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
                <span
                  key={i}
                  className="text-xs text-stone-500 font-mono flex items-center gap-1.5"
                >
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

      {/* Actions row — always visible */}
      <div className="flex items-stretch gap-2 mb-4">
        {/* Apply */}
        <button
          type="button"
          onClick={() => job.url && window.open(job.url, "_blank")}
          disabled={!job.url}
          className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:bg-stone-300 dark:disabled:bg-stone-700 disabled:cursor-not-allowed text-white font-mono text-sm px-4 py-2 transition-colors text-center"
        >
          Apply
        </button>

        {/* Tailor */}
        {isAuthenticated ? (
          <button
            type="button"
            onClick={() => onTailorClick(job)}
            className="border border-orange-600/50 bg-orange-600/10 text-orange-600 dark:text-orange-400 hover:bg-orange-600/20 font-mono text-sm px-4 py-2 transition-colors whitespace-nowrap"
          >
            ✦ Tailor
          </button>
        ) : (
          <a
            href="/signup"
            className="border border-stone-200 dark:border-stone-800 font-mono text-xs px-3 py-2 text-stone-400 dark:text-stone-600 flex items-center whitespace-nowrap hover:border-orange-400 hover:text-orange-500 transition-colors"
          >
            Sign up for AI →
          </a>
        )}
      </div>

      {/* Tab bar — only for authenticated users with a scored match */}
      {hasMatch && (
        <div className="flex border-b border-stone-200 dark:border-stone-800 mb-4 -mx-5 px-5">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onPanelModeChange(tab.id)}
              className={[
                "font-mono text-xs px-4 py-2.5 border-b-2 transition-colors whitespace-nowrap",
                panelMode === tab.id
                  ? "border-orange-500 text-orange-600 dark:text-orange-400"
                  : "border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300",
              ].join(" ")}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Tab content */}
      {hasMatch && panelMode === "explain" ? (
        /* ── Explain Match tab ───────────────────────────────── */
        <MatchExplanationStream
          jobTitle={job.role}
          companyName={job.company}
          overallScore={match!.matchScore!}
          skillMatch={match!.skillsMatch ?? 0}
          experienceMatch={match!.experienceMatch ?? 0}
          matchingSkills={match!.matchReasons ?? []}
          missingSkills={match!.missingSkills ?? []}
          autoStart={true}
        />
      ) : hasMatch && panelMode === "cover-letter" ? (
        /* ── Cover Letter tab ────────────────────────────────── */
        savedResumeText ? (
          <CoverLetterStream
            resumeText={savedResumeText}
            jobTitle={job.role}
            companyName={job.company}
            jobDescription={description ?? ""}
          />
        ) : (
          <div className="border border-stone-200 dark:border-stone-800 p-5 text-center space-y-3">
            <p className="font-mono text-xs text-stone-500">
              Upload your resume to generate a tailored cover letter
            </p>
            <a
              href="/resume"
              className="inline-block border border-orange-600/50 bg-orange-600/10 text-orange-600 dark:text-orange-400 font-mono text-xs px-4 py-2 hover:bg-orange-600/20 transition-colors"
            >
              ~/resume →
            </a>
          </div>
        )
      ) : (
        /* ── Overview tab (default) ──────────────────────────── */
        <>
          {/* Match section — only when authenticated and scored */}
          {hasMatch && (
            <div className="border border-stone-200 dark:border-stone-800 p-4 mb-4 space-y-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500 font-mono">
                Match Analysis
              </p>
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
        </>
      )}
    </div>
  );
}
