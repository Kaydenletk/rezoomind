"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/AuthProvider";

type SavedJobInput = {
  id: string;
  company: string;
  role: string;
  location?: string | null;
  url?: string | null;
};

const GUEST_SAVED_JOBS_KEY = "rezoomind:guest-saved-jobs:v1";

function readGuestSavedJobs() {
  try {
    const raw = window.localStorage.getItem(GUEST_SAVED_JOBS_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as SavedJobInput[];
    return Array.isArray(parsed)
      ? parsed.filter(
          (job) =>
            job &&
            typeof job.id === "string" &&
            typeof job.company === "string" &&
            typeof job.role === "string"
        )
      : [];
  } catch {
    return [];
  }
}

function writeGuestSavedJobs(jobs: SavedJobInput[]) {
  const deduped = Array.from(new Map(jobs.map((job) => [job.id, job])).values());
  window.localStorage.setItem(GUEST_SAVED_JOBS_KEY, JSON.stringify(deduped));
}

export function useSavedJobs() {
  const { isAuthenticated } = useAuth();
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<"account" | "browser">("browser");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!isAuthenticated) {
        if (!cancelled) {
          setSavedJobIds(readGuestSavedJobs().map((job) => job.id));
          setSource("browser");
          setLoading(false);
        }
        return;
      }

      try {
        const response = await fetch("/api/jobs/saved", { cache: "no-store" });
        const result = await response.json();

        if (cancelled) return;

        setSavedJobIds(Array.isArray(result.savedJobIds) ? result.savedJobIds : []);
        setSource("account");
      } catch {
        if (!cancelled) {
          setSavedJobIds(readGuestSavedJobs().map((job) => job.id));
          setSource("browser");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const saveJobs = useCallback(
    async (jobs: SavedJobInput[]) => {
      const normalizedJobs = jobs.filter((job) => job.id);
      if (normalizedJobs.length === 0) return;

      if (!isAuthenticated) {
        const existing = readGuestSavedJobs();
        const nextJobs = Array.from(new Map([...existing, ...normalizedJobs].map((job) => [job.id, job])).values());
        const next = nextJobs.map((job) => job.id);
        setSavedJobIds(next);
        setSource("browser");
        writeGuestSavedJobs(nextJobs);
        return;
      }

      const next = [...new Set([...savedJobIds, ...normalizedJobs.map((job) => job.id)])];
      setSavedJobIds(next);
      setSource("account");

      try {
        const response = await fetch("/api/jobs/saved", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobs: normalizedJobs }),
        });
        const result = await response.json().catch(() => null);
        if (response.ok && Array.isArray(result?.savedJobIds)) {
          setSavedJobIds(result.savedJobIds);
        }
      } catch {
        // Keep optimistic state.
      }
    },
    [isAuthenticated, savedJobIds]
  );

  const removeJobs = useCallback(
    async (jobs: SavedJobInput[]) => {
      const idsToRemove = jobs.map((job) => job.id).filter(Boolean);
      if (idsToRemove.length === 0) return;

      const next = savedJobIds.filter((jobId) => !idsToRemove.includes(jobId));
      setSavedJobIds(next);

      if (!isAuthenticated) {
        const nextJobs = readGuestSavedJobs().filter((job) => !idsToRemove.includes(job.id));
        writeGuestSavedJobs(nextJobs);
        return;
      }

      try {
        const response = await fetch("/api/jobs/saved", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobs }),
        });
        const result = await response.json().catch(() => null);
        if (response.ok && Array.isArray(result?.savedJobIds)) {
          setSavedJobIds(result.savedJobIds);
        }
      } catch {
        // Keep optimistic state.
      }
    },
    [isAuthenticated, savedJobIds]
  );

  const toggleSavedJob = useCallback(
    async (job: SavedJobInput) => {
      if (savedJobIds.includes(job.id)) {
        await removeJobs([job]);
        return;
      }

      await saveJobs([job]);
    },
    [removeJobs, saveJobs, savedJobIds]
  );

  return useMemo(
    () => ({
      savedJobIds,
      loading,
      source,
      isSaved: (jobId: string) => savedJobIds.includes(jobId),
      saveJobs,
      removeJobs,
      toggleSavedJob,
    }),
    [loading, removeJobs, saveJobs, savedJobIds, source, toggleSavedJob]
  );
}
