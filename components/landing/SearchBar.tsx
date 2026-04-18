"use client";

import { useEffect, useRef } from "react";
import { Chip } from "@/components/ui/Chip";
import { LANDING_COPY } from "./copy";

interface SearchBarProps {
  query: string;
  onQueryChange: (q: string) => void;
  activeFilters: Set<string>;
  onToggleFilter: (f: string) => void;
  onClearFilters: () => void;
  topOffsetClass?: string;
}

interface FilterDef {
  key: string;
  label: string;
}

interface FilterGroup {
  sectionLabel: string;
  items: FilterDef[];
}

const FILTER_GROUPS: FilterGroup[] = [
  {
    sectionLabel: LANDING_COPY.filters.sections.role,
    items: [
      { key: "swe", label: LANDING_COPY.filters.role.swe },
      { key: "pm", label: LANDING_COPY.filters.role.pm },
      { key: "dsml", label: LANDING_COPY.filters.role.dsml },
      { key: "quant", label: LANDING_COPY.filters.role.quant },
      { key: "hardware", label: LANDING_COPY.filters.role.hardware },
    ],
  },
  {
    sectionLabel: LANDING_COPY.filters.sections.level,
    items: [
      { key: "internship", label: LANDING_COPY.filters.level.internship },
      { key: "newGrad", label: LANDING_COPY.filters.level.newGrad },
    ],
  },
  {
    sectionLabel: LANDING_COPY.filters.sections.location,
    items: [
      { key: "remote", label: LANDING_COPY.filters.location.remote },
      { key: "usa", label: LANDING_COPY.filters.location.usa },
      { key: "intl", label: LANDING_COPY.filters.location.intl },
    ],
  },
  {
    sectionLabel: LANDING_COPY.filters.sections.fresh,
    items: [
      { key: "fresh24h", label: LANDING_COPY.filters.fresh.last24h },
      { key: "freshWeek", label: LANDING_COPY.filters.fresh.week },
    ],
  },
];

export function SearchBar({
  query,
  onQueryChange,
  activeFilters,
  onToggleFilter,
  onClearFilters,
  topOffsetClass = "top-12 sm:top-14",
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const activeCount = activeFilters.size;

  return (
    <div
      className={`sticky z-20 bg-surface/95 backdrop-blur border-b border-line-subtle ${topOffsetClass}`}
    >
      <div className="max-w-[980px] mx-auto px-4 sm:px-7 py-3 sm:py-4">
        {/* Search input */}
        <div className="flex items-center gap-2 px-3 py-2.5 border border-orange-600/40 bg-brand-primary-tint">
          <span
            aria-hidden
            className="font-mono text-orange-700 dark:text-orange-400 text-sm font-bold"
          >
            &gt;
          </span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={LANDING_COPY.search.placeholder}
            aria-label="Search roles, companies, or skills"
            className="flex-1 bg-transparent outline-none font-mono text-[13px] text-fg placeholder:text-fg-subtle"
          />
          <span className="hidden sm:inline font-mono text-[10px] text-fg-subtle px-1.5 py-0.5 border border-line-subtle rounded-sm">
            ⌘K
          </span>
        </div>

        {/* Filter groups */}
        <div className="mt-3 sm:mt-4 grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-x-5 gap-y-2 sm:gap-y-2.5">
          {FILTER_GROUPS.map((group) => (
            <FilterGroupRow
              key={group.sectionLabel}
              group={group}
              activeFilters={activeFilters}
              onToggle={onToggleFilter}
            />
          ))}
        </div>

        {/* Active filter footer */}
        {activeCount > 0 && (
          <div className="mt-3 pt-3 border-t border-line-subtle flex items-center justify-between gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-fg-muted">
              <span className="text-orange-700 dark:text-orange-400 font-bold">
                {activeCount}
              </span>{" "}
              {LANDING_COPY.filters.activeCount(activeCount).replace(/^\d+\s+/, "")}
            </span>
            <button
              type="button"
              onClick={onClearFilters}
              className="font-mono text-[10px] uppercase tracking-[0.18em] text-fg-muted hover:text-orange-700 dark:hover:text-orange-400 transition-colors"
            >
              {LANDING_COPY.filters.clearAll} ×
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function FilterGroupRow({
  group,
  activeFilters,
  onToggle,
}: {
  group: FilterGroup;
  activeFilters: Set<string>;
  onToggle: (f: string) => void;
}) {
  return (
    <>
      <div className="hidden sm:flex items-center h-7">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-fg-subtle">
          {group.sectionLabel}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5 items-center">
        <span className="sm:hidden font-mono text-[9px] uppercase tracking-[0.2em] text-fg-subtle mr-1 self-center">
          {group.sectionLabel}
        </span>
        {group.items.map(({ key, label }) => (
          <Chip
            key={key}
            as="button"
            variant={activeFilters.has(key) ? "active" : "neutral"}
            onClick={() => onToggle(key)}
            aria-pressed={activeFilters.has(key)}
          >
            {label}
          </Chip>
        ))}
      </div>
    </>
  );
}
