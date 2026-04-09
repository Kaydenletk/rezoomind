"use client";

import { useState, useRef, useEffect } from "react";

export interface Filters {
  search: string;
  roleType: string | null; // "swe" | "pm" | "dsml" | "quant" | "hardware" | null
  location: string | null;
  remote: string | null; // "remote" | "onsite" | "hybrid" | null
  recency: string | null; // "day" | "week" | "month" | null
  h1b: boolean;
}

export const DEFAULT_FILTERS: Filters = {
  search: "",
  roleType: null,
  location: null,
  remote: null,
  recency: null,
  h1b: false,
};

interface FilterBarProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

// ── Option definitions ──────────────────────────────────────────────────────

const ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: "swe", label: "SWE" },
  { value: "pm", label: "PM" },
  { value: "dsml", label: "DS/ML" },
  { value: "quant", label: "Quant" },
  { value: "hardware", label: "Hardware" },
];

const REMOTE_OPTIONS: { value: string; label: string }[] = [
  { value: "remote", label: "Remote" },
  { value: "onsite", label: "Onsite" },
  { value: "hybrid", label: "Hybrid" },
];

const RECENCY_OPTIONS: { value: string; label: string }[] = [
  { value: "day", label: "Past day" },
  { value: "week", label: "Past week" },
  { value: "month", label: "Past month" },
];

// ── Dropdown chip ───────────────────────────────────────────────────────────

interface DropdownChipProps {
  label: string;
  value: string | null;
  options: { value: string; label: string }[];
  onSelect: (value: string | null) => void;
}

function DropdownChip({ label, value, options, onSelect }: DropdownChipProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  const activeLabel = value
    ? options.find((o) => o.value === value)?.label ?? null
    : null;

  const isActive = value !== null;

  return (
    <div className="relative" ref={ref}>
      {isActive ? (
        /* Active state: show selected value + dismiss button */
        <div className="flex items-center gap-0 bg-orange-100 dark:bg-orange-900/50 border border-orange-300 dark:border-orange-700 font-mono text-[11px] text-orange-700 dark:text-orange-400">
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="px-3 py-1.5 hover:bg-orange-200/60 dark:hover:bg-orange-800/40 transition-colors"
          >
            {activeLabel}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(null);
              setOpen(false);
            }}
            className="px-1.5 py-1.5 hover:bg-orange-200/60 dark:hover:bg-orange-800/40 transition-colors border-l border-orange-300 dark:border-orange-700"
            aria-label={`Clear ${label} filter`}
          >
            ✕
          </button>
        </div>
      ) : (
        /* Inactive state */
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 font-mono text-[11px] px-3 py-1.5 cursor-pointer hover:border-stone-300 dark:hover:border-stone-600 transition-colors"
        >
          {label}
        </button>
      )}

      {/* Dropdown panel */}
      {open && (
        <div className="absolute left-0 top-full mt-1 z-30 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 min-w-[120px]">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onSelect(opt.value === value ? null : opt.value);
                setOpen(false);
              }}
              className={[
                "block w-full text-left px-3 py-2 font-mono text-[11px] transition-colors",
                opt.value === value
                  ? "bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400"
                  : "text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-900 hover:text-stone-900 dark:hover:text-stone-200",
              ].join(" ")}
            >
              {opt.value === value && <span className="mr-1.5">✓</span>}
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main FilterBar ──────────────────────────────────────────────────────────

export function FilterBar({ filters, onChange }: FilterBarProps) {
  function update(partial: Partial<Filters>) {
    onChange({ ...filters, ...partial });
  }

  const hasActiveFilters =
    filters.roleType !== null ||
    filters.remote !== null ||
    filters.recency !== null ||
    filters.h1b;

  return (
    <div className="px-5 py-2.5 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/50">
      {/* Search row */}
      <div className="flex items-center gap-2">
        <span className="text-orange-600 font-mono text-sm select-none shrink-0">
          &gt;
        </span>
        <input
          type="text"
          value={filters.search}
          onChange={(e) => update({ search: e.target.value })}
          placeholder="search jobs..."
          className="flex-1 bg-transparent border-b border-stone-300 dark:border-stone-700 focus:border-orange-600 focus:outline-none font-mono text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-600 py-0.5 transition-colors"
        />
        {filters.search && (
          <button
            type="button"
            onClick={() => update({ search: "" })}
            className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 font-mono text-xs transition-colors shrink-0"
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {/* Filter chips row */}
      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
        <DropdownChip
          label="Role"
          value={filters.roleType}
          options={ROLE_OPTIONS}
          onSelect={(v) => update({ roleType: v })}
        />
        <DropdownChip
          label="Remote"
          value={filters.remote}
          options={REMOTE_OPTIONS}
          onSelect={(v) => update({ remote: v })}
        />
        <DropdownChip
          label="Recency"
          value={filters.recency}
          options={RECENCY_OPTIONS}
          onSelect={(v) => update({ recency: v })}
        />

        {/* H1B toggle chip */}
        {filters.h1b ? (
          <div className="flex items-center gap-0 bg-orange-100 dark:bg-orange-900/50 border border-orange-300 dark:border-orange-700 font-mono text-[11px] text-orange-700 dark:text-orange-400">
            <button
              type="button"
              onClick={() => update({ h1b: false })}
              className="px-3 py-1.5 hover:bg-orange-200/60 dark:hover:bg-orange-800/40 transition-colors"
            >
              H1B Sponsored
            </button>
            <button
              type="button"
              onClick={() => update({ h1b: false })}
              className="px-1.5 py-1.5 hover:bg-orange-200/60 dark:hover:bg-orange-800/40 transition-colors border-l border-orange-300 dark:border-orange-700"
              aria-label="Clear H1B filter"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => update({ h1b: true })}
            className="bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 font-mono text-[11px] px-3 py-1.5 cursor-pointer hover:border-stone-300 dark:hover:border-stone-600 transition-colors"
          >
            H1B
          </button>
        )}

        {/* Clear all filters button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() =>
              onChange({
                ...filters,
                roleType: null,
                remote: null,
                recency: null,
                h1b: false,
              })
            }
            className="ml-1 font-mono text-[11px] text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
          >
            clear all
          </button>
        )}
      </div>
    </div>
  );
}
