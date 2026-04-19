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
          className="bg-surface-sunken border border-line text-fg-muted font-mono text-[11px] px-3 py-1.5 cursor-pointer hover:border-fg-subtle transition-colors"
        >
          {label}
        </button>
      )}

      {/* Dropdown panel */}
      {open && (
        <div className="absolute left-0 top-full mt-1 z-30 bg-surface-raised border border-line min-w-[120px]">
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
                  : "text-fg-muted hover:bg-surface-sunken/60 hover:text-fg",
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
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!moreOpen) return;
    function handleOutside(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [moreOpen]);

  function update(partial: Partial<Filters>) {
    onChange({ ...filters, ...partial });
  }

  const hasActiveFilters =
    filters.roleType !== null ||
    filters.remote !== null ||
    filters.recency !== null ||
    filters.h1b;

  return (
    <div className="px-5 py-2 border-b border-line bg-surface-raised/90">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px] flex items-center gap-2">
          <span className="text-orange-600 font-mono text-sm select-none shrink-0">&gt;</span>
          <input
            id="feed-search-input"
            type="text"
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            placeholder="search jobs..."
            className="flex-1 bg-transparent border-b border-line focus:border-orange-600 focus:outline-none font-mono text-sm text-fg placeholder:text-fg-subtle/70 py-0.5 transition-colors peer"
          />
          {filters.search ? (
            <button
              type="button"
              onClick={() => update({ search: "" })}
              className="text-fg-muted hover:text-fg font-mono text-xs transition-colors shrink-0"
              aria-label="Clear search"
            >
              ✕
            </button>
          ) : (
            <span className="hidden sm:inline text-[10px] text-fg-subtle font-mono tracking-[0.15em] peer-focus:opacity-0 transition-opacity select-none">
              ⌘K
            </span>
          )}
        </div>

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
          label="Fresh"
          value={filters.recency}
          options={RECENCY_OPTIONS}
          onSelect={(v) => update({ recency: v })}
        />

        <div className="relative" ref={moreRef}>
          <button
            type="button"
            onClick={() => setMoreOpen((p) => !p)}
            className="bg-surface-sunken border border-line text-fg-muted font-mono text-[11px] px-3 py-1.5 hover:border-fg-subtle transition-colors"
          >
            more…
          </button>
          {moreOpen && (
            <div className="absolute right-0 top-full mt-1 z-30 bg-surface-raised border border-line p-3 min-w-[160px] space-y-2">
              <label className="flex items-center gap-2 font-mono text-[11px] text-fg-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.h1b}
                  onChange={(e) => update({ h1b: e.target.checked })}
                  className="accent-orange-600"
                />
                H1B sponsored
              </label>
            </div>
          )}
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={() =>
              onChange({ ...filters, roleType: null, remote: null, recency: null, h1b: false })
            }
            className="font-mono text-[11px] text-fg-muted hover:text-fg transition-colors"
          >
            clear all
          </button>
        )}
      </div>
    </div>
  );
}
