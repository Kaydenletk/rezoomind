"use client";

import type { JobStatus } from "@/lib/feed-derivations";

interface StatusPillProps {
  status: JobStatus;
}

const STYLES: Record<JobStatus, string> = {
  new: "text-orange-700 dark:text-orange-400 bg-orange-600/10 border border-orange-600/40",
  saved: "text-fg-muted bg-surface-sunken border border-line",
  applied:
    "text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border border-green-600/40",
};

const LABELS: Record<JobStatus, string> = {
  new: "NEW",
  saved: "SAVED",
  applied: "APPLIED \u2713",
};

export function StatusPill({ status }: StatusPillProps) {
  return (
    <span
      className={[
        "text-[9px] uppercase tracking-[0.15em] font-mono px-1.5 py-0.5 leading-none",
        STYLES[status],
      ].join(" ")}
    >
      {LABELS[status]}
    </span>
  );
}
