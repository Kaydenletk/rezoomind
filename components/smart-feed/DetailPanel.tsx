"use client";

import { useState, useEffect } from "react";
import { MatchScoreRing } from "@/components/dashboard/MatchScoreRing";
import { MatchExplanationStream } from "./MatchExplanationStream";
import { CoverLetterStream } from "./CoverLetterStream";
import { FEED_COPY } from "./copy";
import type { SmartFeedJob, JobMatch } from "./types";

interface DetailPanelProps {
  job: SmartFeedJob | null;
  match?: JobMatch | null;
  isSaved: boolean;
  isAuthenticated: boolean;
  onToggleSave: (job: SmartFeedJob) => void;
  onTailorClick: (job: SmartFeedJob) => void;
  jobDescription?: string | null;
  savedResumeText: string | null;
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

export function DetailPanel({
  job,
  match,
  isSaved,
  isAuthenticated,
  onToggleSave,
  onTailorClick,
  jobDescription,
  savedResumeText,
}: DetailPanelProps) {
  const [descExpanded, setDescExpanded] = useState(false);
  const [coverOpen, setCoverOpen] = useState(false);

  useEffect(() => {
    setDescExpanded(false);
    setCoverOpen(false);
  }, [job?.id]);

  if (!job) {
    return (
      <div className="sticky top-[57px] h-[calc(100vh-57px)] overflow-y-auto bg-surface-raised flex items-center justify-center">
        <div className="text-center space-y-3">
          <svg
            className="mx-auto text-fg-subtle"
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <rect x="2" y="7" width="20" height="14" />
            <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
          </svg>
          <p className="font-mono text-sm text-fg-muted">Select a job to see details</p>
        </div>
      </div>
    );
  }

  const description = jobDescription ?? job.description ?? null;
  const descTruncated =
    description && description.length > 400 ? description.slice(0, 400) + "…" : description;

  const hasMatch = isAuthenticated && match != null && match.matchScore != null;
  const matchedSkills = match?.matchReasons ?? [];
  const missingSkills = match?.missingSkills ?? [];
  const relativeTime = getRelativeTime(job.datePosted);
  const metaParts = [job.location, job.salary, relativeTime].filter(Boolean);

  return (
    <div className="sticky top-[57px] h-[calc(100vh-57px)] overflow-y-auto bg-surface-raised p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <h2 className="font-mono font-bold text-lg text-fg leading-snug">{job.role}</h2>
          <p className="text-sm text-fg-muted font-mono mt-0.5">{job.company}</p>
          {metaParts.length > 0 && (
            <div className="flex items-center flex-wrap gap-x-1.5 gap-y-0.5 mt-1 text-xs text-fg-subtle font-mono">
              {metaParts.map((part, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  {i > 0 && <span>·</span>}
                  {part}
                </span>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => onToggleSave(job)}
          className="shrink-0 text-xl leading-none transition-colors"
          aria-label={isSaved ? "Unsave job" : "Save job"}
        >
          {isSaved ? (
            <span className="text-orange-500">♥</span>
          ) : (
            <span className="text-fg-muted hover:text-orange-400">♡</span>
          )}
        </button>
      </div>

      <div className="flex items-stretch gap-2 mb-4">
        <button
          type="button"
          onClick={() => job.url && window.open(job.url, "_blank")}
          disabled={!job.url}
          className="flex-1 bg-brand-primary hover:bg-orange-700 disabled:bg-surface-sunken disabled:cursor-not-allowed text-white font-mono text-sm px-4 py-2 transition-colors text-center inline-flex items-center justify-center gap-1.5 group"
        >
          {FEED_COPY.detail.apply}
          <span className="opacity-70 group-hover:translate-x-0.5 transition-transform">→</span>
        </button>

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
            className="border border-line font-mono text-xs px-3 py-2 text-fg-subtle flex items-center whitespace-nowrap hover:border-orange-400 hover:text-orange-500 transition-colors"
          >
            Sign up for AI →
          </a>
        )}
      </div>

      {job.url && (
        <a
          href={job.url}
          target="_blank"
          rel="noreferrer"
          className="block mb-4 font-mono text-[11px] text-fg-subtle hover:text-fg-muted transition-colors"
        >
          → {FEED_COPY.detail.viewSource}
        </a>
      )}

      {hasMatch && (
        <div className="border border-line p-4 mb-4 space-y-3">
          <p className="text-[10px] uppercase tracking-[0.2em] text-fg-subtle font-mono">
            Match Analysis
          </p>
          <div className="flex items-center gap-4">
            <MatchScoreRing score={match!.matchScore} size={64} />
            <div className="space-y-1">
              {match!.skillsMatch != null && (
                <p className="font-mono text-xs text-fg-muted">Skills: {match!.skillsMatch}%</p>
              )}
              {match!.experienceMatch != null && (
                <p className="font-mono text-xs text-fg-muted">
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

          <MatchExplanationStream
            jobTitle={job.role}
            companyName={job.company}
            overallScore={match!.matchScore!}
            skillMatch={match!.skillsMatch ?? 0}
            experienceMatch={match!.experienceMatch ?? 0}
            matchingSkills={matchedSkills}
            missingSkills={missingSkills}
            autoStart
            compact
          />
        </div>
      )}

      {description && (
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-fg-subtle font-mono mb-2">
            Description
          </p>
          <p className="text-fg-muted text-sm leading-relaxed whitespace-pre-line">
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

      {hasMatch && (
        <button
          type="button"
          onClick={() => setCoverOpen((prev) => !prev)}
          className="mt-6 w-full text-left border-t border-line-subtle pt-3 font-mono text-xs text-orange-700 dark:text-orange-400 hover:text-orange-600 transition-colors flex items-center justify-between"
          aria-expanded={coverOpen}
        >
          <span>
            ✉ {coverOpen ? FEED_COPY.detail.coverLetterExpanded : FEED_COPY.detail.coverLetterCollapsed}
          </span>
          <span>{coverOpen ? "×" : "→"}</span>
        </button>
      )}

      {hasMatch && coverOpen && (
        <div className="mt-3">
          {savedResumeText ? (
            <CoverLetterStream
              resumeText={savedResumeText}
              jobTitle={job.role}
              companyName={job.company}
              jobDescription={description ?? ""}
            />
          ) : (
            <div className="border border-line p-5 text-center space-y-3">
              <p className="font-mono text-xs text-fg-subtle">
                Upload your resume to generate a tailored cover letter
              </p>
              <a
                href="/resume"
                className="inline-block border border-orange-600/50 bg-orange-600/10 text-orange-600 dark:text-orange-400 font-mono text-xs px-4 py-2 hover:bg-orange-600/20 transition-colors"
              >
                ~/resume →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
