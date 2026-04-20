'use client';

import Link from 'next/link';

export function EmptyState({
  syncing,
  savedOnly,
  hasResume,
  setupHref,
}: {
  syncing: boolean;
  savedOnly: boolean;
  hasResume: boolean;
  setupHref: string;
}) {
  if (syncing) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-32 text-center">
        <span className="block h-6 w-6 animate-spin border-2 border-orange-600 border-t-transparent" />
        <p className="text-sm font-mono font-medium text-fg">Refreshing job listings…</p>
        <p className="text-xs text-fg-subtle">Fresh roles are being pulled in.</p>
      </div>
    );
  }

  if (savedOnly) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-32 text-center">
        <p className="text-sm font-mono font-semibold text-fg">No saved jobs yet</p>
        <p className="text-xs text-fg-subtle max-w-xs leading-5">
          Save roles as you browse to build a shortlist you can compare and revisit.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-32 text-center">
      <p className="text-sm font-mono font-semibold text-fg">No roles match these filters</p>
      <p className="text-xs text-fg-subtle max-w-xs leading-5">
        Broaden your search, clear a filter, or refresh to get the latest listings.
      </p>
      {!hasResume && (
        <Link
          href={setupHref}
          className="mt-2 border border-line bg-surface-sunken/60 px-4 py-2 text-xs font-mono font-semibold text-fg-muted hover:border-orange-600/50 hover:text-orange-600 dark:hover:text-orange-400 transition"
        >
          Add Resume &amp; Profile
        </Link>
      )}
    </div>
  );
}
