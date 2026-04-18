"use client";

import { useEffect, useRef } from "react";
import { Chip } from "@/components/ui/Chip";
import { LANDING_COPY } from "./copy";

interface SearchBarProps {
  query: string;
  onQueryChange: (q: string) => void;
  activeFilters: Set<string>;
  onToggleFilter: (f: string) => void;
  topOffsetClass?: string;
}

const FILTER_DEFS = [
  { key: "internship", label: LANDING_COPY.filters.internship },
  { key: "newGrad", label: LANDING_COPY.filters.newGrad },
  { key: "remote", label: LANDING_COPY.filters.remote },
];

export function SearchBar({
  query,
  onQueryChange,
  activeFilters,
  onToggleFilter,
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

  return (
    <div className={`sticky z-20 bg-surface/90 backdrop-blur border-b border-line-subtle ${topOffsetClass}`}>
      <div className="px-4 sm:px-7 py-3">
        <div className="flex items-center gap-2 px-3 py-2 border border-orange-600/40 bg-brand-primary-tint">
          <span className="font-mono text-orange-700 dark:text-orange-400 text-sm font-bold">&gt;</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={LANDING_COPY.search.placeholder}
            aria-label="Search roles, companies, or skills"
            className="flex-1 bg-transparent outline-none font-mono text-label text-fg placeholder:text-fg-subtle"
          />
          <span className="hidden sm:inline font-mono text-[9px] text-fg-subtle">⌘K</span>
        </div>
        <div className="mt-2 flex gap-1.5 overflow-x-auto scrollbar-thin">
          {FILTER_DEFS.map(({ key, label }) => (
            <Chip
              key={key}
              as="button"
              variant={activeFilters.has(key) ? "active" : "neutral"}
              onClick={() => onToggleFilter(key)}
              aria-pressed={activeFilters.has(key)}
            >
              {label}
            </Chip>
          ))}
        </div>
      </div>
    </div>
  );
}
