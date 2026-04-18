"use client";

import { useMemo } from "react";
import { LANDING_COPY } from "./copy";
import { RoleRow, type LandingRole } from "./RoleRow";
import { Chip } from "@/components/ui/Chip";
import { matchesFilters } from "@/lib/role-filters";

function matchesQuery(role: LandingRole, q: string): boolean {
  if (!q.trim()) return true;
  const haystack = `${role.role} ${role.company} ${role.tags.join(" ")}`.toLowerCase();
  return haystack.includes(q.trim().toLowerCase());
}

interface RoleListProps {
  jobs: LandingRole[];
  scores: Record<string, number | null>;
  query: string;
  filters: Set<string>;
  onSelectRole: (role: LandingRole) => void;
  onClearFilter: (filter: string) => void;
  loading?: boolean;
}

export function RoleList({
  jobs,
  scores,
  query,
  filters,
  onSelectRole,
  onClearFilter,
  loading = false,
}: RoleListProps) {
  const filtered = useMemo(
    () => jobs.filter((r) => matchesQuery(r, query) && matchesFilters(r, filters)),
    [jobs, query, filters]
  );

  if (loading) {
    return (
      <div className="px-4 sm:px-7" aria-live="polite">
        <div className="font-mono text-[9px] uppercase tracking-wider text-fg-subtle py-2">
          loading…
        </div>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="grid grid-cols-[32px_1fr_auto] gap-3 items-center px-2 py-3 border-t border-line-subtle"
          >
            <div className="w-8 flex justify-center">
              <span className="block w-0.5 h-8 bg-line" />
            </div>
            <div>
              <div className="h-3 w-48 bg-surface-raised animate-pulse" />
              <div className="mt-1.5 h-2 w-32 bg-surface-raised/70 animate-pulse" />
            </div>
            <div className="h-6 w-16 bg-surface-raised animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-7">
      <div className="flex justify-between items-center py-2">
        <span className="font-mono text-[9px] uppercase tracking-wider text-fg-subtle">
          {LANDING_COPY.search.meta(filtered.length)}
        </span>
        <span className="font-mono text-[9px] text-fg-subtle">
          {LANDING_COPY.search.sortLabel}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div
          className="border-t border-line-subtle py-8 text-center"
          aria-live="polite"
        >
          <p className="font-mono text-[12px] text-fg-muted mb-3">
            {LANDING_COPY.emptyFilters.headline}
          </p>
          <p className="font-mono text-[10px] text-fg-subtle mb-2">
            {LANDING_COPY.emptyFilters.suggestHint}
          </p>
          <div className="inline-flex gap-1.5 flex-wrap justify-center">
            {Array.from(filters).map((f) => (
              <Chip
                key={f}
                as="button"
                variant="active"
                onClick={() => onClearFilter(f)}
              >
                × remove {f}
              </Chip>
            ))}
            {filters.size === 0 && (
              <span className="font-mono text-[10px] text-fg-subtle">
                try a different search
              </span>
            )}
          </div>
        </div>
      ) : (
        <div>
          {filtered.map((role) => (
            <RoleRow
              key={role.id}
              role={role}
              score={scores[role.id] ?? null}
              onSelect={onSelectRole}
            />
          ))}
        </div>
      )}
    </div>
  );
}
