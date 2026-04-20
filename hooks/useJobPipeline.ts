"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type PipelineStatus =
  | "saved"
  | "applied"
  | "interview"
  | "offer"
  | "rejected";

export interface PipelineEntry {
  status: PipelineStatus;
  appliedAt?: string;
  interviewAt?: string;
  notes?: string;
  updatedAt: string;
}

const STORAGE_KEY = "rezoomind:pipeline:v1";

function readAll(): Record<string, PipelineEntry> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeAll(entries: Record<string, PipelineEntry>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function useJobPipeline() {
  const [entries, setEntries] = useState<Record<string, PipelineEntry>>({});

  useEffect(() => {
    setEntries(readAll());

    // Listen for cross-tab updates
    function handleStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) {
        setEntries(readAll());
      }
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const updateStatus = useCallback(
    (jobId: string, status: PipelineStatus, extras?: Partial<PipelineEntry>) => {
      setEntries((prev) => {
        const now = new Date().toISOString();
        const existing = prev[jobId];
        const entry: PipelineEntry = {
          ...(existing ?? { status: "saved", updatedAt: now }),
          ...extras,
          status,
          updatedAt: now,
        };
        if (status === "applied" && !entry.appliedAt) entry.appliedAt = now;
        if (status === "interview" && !entry.interviewAt) entry.interviewAt = now;
        const next = { ...prev, [jobId]: entry };
        writeAll(next);
        return next;
      });
    },
    []
  );

  const setNotes = useCallback((jobId: string, notes: string) => {
    setEntries((prev) => {
      const existing = prev[jobId];
      if (!existing) return prev;
      const next = {
        ...prev,
        [jobId]: { ...existing, notes, updatedAt: new Date().toISOString() },
      };
      writeAll(next);
      return next;
    });
  }, []);

  const removeEntry = useCallback((jobId: string) => {
    setEntries((prev) => {
      if (!(jobId in prev)) return prev;
      const next = { ...prev };
      delete next[jobId];
      writeAll(next);
      return next;
    });
  }, []);

  const derived = useMemo(() => {
    const appliedIds = new Set<string>();
    const interviewIds = new Set<string>();
    const offerIds = new Set<string>();
    const rejectedIds = new Set<string>();

    for (const [id, entry] of Object.entries(entries)) {
      if (entry.status === "applied") appliedIds.add(id);
      else if (entry.status === "interview") interviewIds.add(id);
      else if (entry.status === "offer") offerIds.add(id);
      else if (entry.status === "rejected") rejectedIds.add(id);
    }

    return { appliedIds, interviewIds, offerIds, rejectedIds };
  }, [entries]);

  const getEntry = useCallback(
    (jobId: string): PipelineEntry | null => entries[jobId] ?? null,
    [entries]
  );

  return {
    entries,
    appliedJobIds: derived.appliedIds,
    interviewJobIds: derived.interviewIds,
    offerJobIds: derived.offerIds,
    rejectedJobIds: derived.rejectedIds,
    trackingJobIds: useMemo(
      () =>
        new Set([
          ...derived.appliedIds,
          ...derived.interviewIds,
          ...derived.offerIds,
        ]),
      [derived]
    ),
    getEntry,
    updateStatus,
    setNotes,
    removeEntry,
  };
}
