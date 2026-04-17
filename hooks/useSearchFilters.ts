"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

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
  const [query, setQueryState] = useState<string>("");
  const [filters, setFilters] = useState<Set<string>>(new Set());

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setQueryState(params.get("q") ?? "");
    setFilters(parseFiltersParam(params.get("filters")));
  }, []);

  const syncUrl = useCallback((q: string, f: Set<string>) => {
    const url = new URL(window.location.href);
    if (q) url.searchParams.set("q", q);
    else url.searchParams.delete("q");
    const serialized = serializeFilters(f);
    if (serialized) url.searchParams.set("filters", serialized);
    else url.searchParams.delete("filters");
    window.history.replaceState({}, "", url.toString());
  }, []);

  const setQuery = useCallback(
    (q: string) => {
      setQueryState(q);
      syncUrl(q, filters);
    },
    [filters, syncUrl]
  );

  const toggleFilter = useCallback(
    (f: string) => {
      setFilters((prev) => {
        const next = new Set(prev);
        if (next.has(f)) next.delete(f);
        else next.add(f);
        syncUrl(query, next);
        return next;
      });
    },
    [query, syncUrl]
  );

  const clearFilters = useCallback(() => {
    setFilters(new Set());
    syncUrl(query, new Set());
  }, [query, syncUrl]);

  return useMemo(
    () => ({ query, setQuery, filters, toggleFilter, clearFilters }),
    [query, setQuery, filters, toggleFilter, clearFilters]
  );
}
