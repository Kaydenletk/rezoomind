export function formatTimeAgo(iso: string | Date, now: Date = new Date()): string {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(date.getTime())) return "recently";

  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.max(0, Math.round(diffMs / 60_000));
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  const diffWeek = Math.round(diffDay / 7);
  if (diffWeek < 4) return `${diffWeek}w ago`;
  const diffMonth = Math.round(diffDay / 30);
  return `${diffMonth}mo ago`;
}
