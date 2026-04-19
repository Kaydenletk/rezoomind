"use client";

import { useEffect, useRef } from "react";
import { JobCard } from "./JobCard";
import type { SmartFeedJob, JobMatch } from "./types";

interface JobFeedProps {
  jobs: SmartFeedJob[];
  matches?: Record<string, JobMatch>;
  selectedJobId: string | null;
  savedJobIds: Set<string>;
  appliedJobIds?: Set<string>;
  isAuthenticated: boolean;
  onSelectJob: (id: string) => void;
  onToggleSave: (job: SmartFeedJob) => void;
  isLoading: boolean;
}

export function JobFeed({
  jobs,
  matches,
  selectedJobId,
  savedJobIds,
  appliedJobIds,
  isAuthenticated,
  onSelectJob,
  onToggleSave,
  isLoading,
}: JobFeedProps) {
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Auto-select first job on mount
  useEffect(() => {
    if (selectedJobId === null && jobs.length > 0) {
      onSelectJob(jobs[0].id);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll selected card into view when selectedJobId changes
  useEffect(() => {
    if (selectedJobId && cardRefs.current[selectedJobId]) {
      cardRefs.current[selectedJobId]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [selectedJobId]);

  if (isLoading) {
    return (
      <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse bg-surface-sunken h-20 border-b border-line"
          />
        ))}
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="overflow-y-auto max-h-[calc(100vh-200px)] flex flex-col items-center justify-center py-20 gap-3">
        <svg
          className="text-fg-subtle w-8 h-8"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12"
          />
        </svg>
        <span className="text-fg-muted font-mono text-sm">
          No jobs match your filters
        </span>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
      {jobs.map((job) => (
        <div
          key={job.id}
          ref={(el) => {
            cardRefs.current[job.id] = el;
          }}
        >
          <JobCard
            job={job}
            match={matches?.[job.id] ?? null}
            isSelected={job.id === selectedJobId}
            isSaved={savedJobIds.has(job.id)}
            isApplied={appliedJobIds?.has(job.id) ?? false}
            onSelect={onSelectJob}
            onToggleSave={onToggleSave}
            isAuthenticated={isAuthenticated}
          />
        </div>
      ))}
    </div>
  );
}
