"use client";

import { FEED_COPY } from "./copy";

interface TrustStripProps {
  freshToday: number;
  refreshedAt: Date | null;
  appliedToday: number;
}

function getRelative(to: Date, now: number = Date.now()): string {
  const diffMinutes = Math.floor((now - to.getTime()) / 60000);
  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export function TrustStrip({ freshToday, refreshedAt, appliedToday }: TrustStripProps) {
  const { separator, freshSuffix, verified, refreshedPrefix, appliedTodaySuffix } = FEED_COPY.trust;

  const items: string[] = [];
  if (freshToday > 0) items.push(`${freshToday} ${freshSuffix}`);
  items.push(verified);
  if (refreshedAt) items.push(`${refreshedPrefix} ${getRelative(refreshedAt)}`);
  if (appliedToday > 0) items.push(`${appliedToday} ${appliedTodaySuffix}`);

  if (items.length === 0) return null;

  return (
    <div className="px-5 py-1.5 border-b border-line-subtle bg-surface-sunken/40 text-[10px] uppercase tracking-[0.2em] text-fg-subtle font-mono">
      {items.join(separator)}
    </div>
  );
}
