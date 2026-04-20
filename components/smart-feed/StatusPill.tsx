"use client";

export type PillStatus =
  | "new"
  | "saved"
  | "applied"
  | "interview"
  | "offer"
  | "rejected";

interface StatusPillProps {
  status: PillStatus;
}

const STYLES: Record<PillStatus, string> = {
  new: "text-orange-700 dark:text-orange-400 bg-orange-600/10 border border-orange-600/40",
  saved: "text-fg-muted bg-surface-sunken border border-line",
  applied:
    "text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border border-green-600/40",
  interview:
    "text-orange-700 dark:text-orange-400 bg-orange-600/20 border border-orange-600/50",
  offer:
    "text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/30 border border-violet-600/40",
  rejected:
    "text-fg-subtle bg-surface-sunken border border-line line-through",
};

const LABELS: Record<PillStatus, string> = {
  new: "NEW",
  saved: "SAVED",
  applied: "APPLIED \u2713",
  interview: "INTERVIEW",
  offer: "OFFER \u2605",
  rejected: "REJECTED",
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
