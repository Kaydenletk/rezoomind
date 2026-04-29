"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export function parseFiltersParam(raw: string | null): Set<string> {
  if (!raw) return new Set();
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
  );
}

export function serializeFilters(filters: Set<string>): string | null {
  if (filters.size === 0) return null;
  return Array.from(filters).sort().join(",");
}

interface UseSearchFiltersResult {
  query: string;
  setQuery: (q: string) => void;
  filters: Set<string>;
  toggleFilter: (f: string) => void;
  clearFilters: () => void;
}

export function useSearchFilters(): UseSearchFiltersResult {
  const [query, setQuery] = useState<string>("");
  const [filters, setFilters] = useState<Set<string>>(new Set());
  const hydratedRef = useRef(false);

  useEffect(() => {
    // Hydrate state from URL once on mount. setState-in-effect is intentional here:
    // window.location is unavailable during SSR, so reading URL params has to happen
    // post-mount.
    const params = new URLSearchParams(window.location.search);
    setQuery(params.get("q") ?? "");
    setFilters(parseFiltersParam(params.get("filters")));
    hydratedRef.current = true;
  }, []);

  // URL sync runs after commit — never during render — so the Next.js
  // router never observes a history mutation while React is rendering.
  useEffect(() => {
    if (!hydratedRef.current) return;
    const url = new URL(window.location.href);
    if (query) url.searchParams.set("q", query);
    else url.searchParams.delete("q");
    const serialized = serializeFilters(filters);
    if (serialized) url.searchParams.set("filters", serialized);
    else url.searchParams.delete("filters");
    window.history.replaceState({}, "", url.toString());
  }, [query, filters]);

  const toggleFilter = useCallback((f: string) => {
    setFilters((prev) => {
      const next = new Set(prev);
      if (next.has(f)) next.delete(f);
      else next.add(f);
      return next;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(new Set());
  }, []);

  return useMemo(
    () => ({ query, setQuery, filters, toggleFilter, clearFilters }),
    [query, filters, toggleFilter, clearFilters]
  );
}
