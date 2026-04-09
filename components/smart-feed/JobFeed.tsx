"use client";

import { useEffect, useRef } from "react";
import { JobCard } from "./JobCard";
import type { SmartFeedJob, JobMatch } from "./types";

interface JobFeedProps {
  jobs: SmartFeedJob[];
  matches?: Record<string, JobMatch>;
  selectedJobId: string | null;
  savedJobIds: Set<string>;
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
            className="animate-pulse bg-stone-200 dark:bg-stone-800 h-20 border-b border-stone-200 dark:border-stone-800"
          />
        ))}
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="overflow-y-auto max-h-[calc(100vh-200px)] flex flex-col items-center justify-center py-20 gap-3">
        <svg
          className="text-stone-300 dark:text-stone-700 w-8 h-8"
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
        <span className="text-stone-400 font-mono text-sm">
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
            onSelect={onSelectJob}
            onToggleSave={onToggleSave}
            isAuthenticated={isAuthenticated}
          />
        </div>
      ))}
    </div>
  );
}
