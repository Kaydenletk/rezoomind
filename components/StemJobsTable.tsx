"use client";

import { useEffect, useMemo, useState } from "react";

import { FeatureGate } from "@/components/FeatureGate";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

export type StemJob = {
  id: string;
  role: string;
  company: string;
  location: string | null;
  url: string | null;
  tags: string[] | null;
  datePosted?: string | null;
};

type JobTracking = {
  applied?: boolean;
  tried?: boolean;
  saved?: boolean;
  notes?: string;
};

type StemJobsTableProps = {
  jobs: StemJob[];
};

const storageKeyForUser = (userId: string) => `stem-tracking:${userId}`;

export function StemJobsTable({ jobs }: StemJobsTableProps) {
  const { user, isAuthenticated } = useAuth();
  const [tracking, setTracking] = useState<Record<string, JobTracking>>({});
  const [openNoteId, setOpenNoteId] = useState<string | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

  const storageKey = useMemo(() => {
    if (!user?.id) return null;
    return storageKeyForUser(user.id);
  }, [user?.id]);

  useEffect(() => {
    if (!isAuthenticated || !storageKey) {
      setTracking({});
      return;
    }

    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, JobTracking>;
      setTracking(parsed ?? {});
    } catch {
      setTracking({});
    }
  }, [isAuthenticated, storageKey]);

  useEffect(() => {
    if (!isAuthenticated || !storageKey) return;
    window.localStorage.setItem(storageKey, JSON.stringify(tracking));
  }, [isAuthenticated, storageKey, tracking]);

  const updateTracking = (jobId: string, updates: Partial<JobTracking>) => {
    setTracking((prev) => ({
      ...prev,
      [jobId]: { ...prev[jobId], ...updates },
    }));
  };

  const toggleNote = (jobId: string) => {
    if (openNoteId === jobId) {
      setOpenNoteId(null);
      return;
    }
    setOpenNoteId(jobId);
    setNoteDrafts((prev) => ({
      ...prev,
      [jobId]: prev[jobId] ?? tracking[jobId]?.notes ?? "",
    }));
  };

  const saveNote = (jobId: string) => {
    const draft = noteDrafts[jobId] ?? "";
    updateTracking(jobId, { notes: draft.trim() });
    setOpenNoteId(null);
  };

  if (jobs.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-slate-600">
          No STEM jobs yet. Check back soon for fresh postings.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {jobs.map((job, index) => {
        const state = tracking[job.id] ?? {};
        const showOverlay = !isAuthenticated && index === 0;

        return (
          <div
            key={job.id}
            className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)] md:grid-cols-[2fr_1.2fr_1fr_1fr_1.4fr]"
          >
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold text-slate-900">
                  {job.role}
                </h3>
                {job.url ? (
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold uppercase tracking-[0.24em] text-[rgb(var(--brand-rgb))] hover:text-[rgb(var(--brand-hover-rgb))]"
                  >
                    View
                  </a>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-slate-600">{job.company}</p>
            </div>

            <div className="text-sm text-slate-600">
              {job.location ?? "Remote"}
            </div>

            <div className="flex flex-wrap gap-2">
              {(job.tags ?? ["STEM"]).slice(0, 3).map((tag) => (
                <span
                  key={`${job.id}-${tag}`}
                  className="rounded-full border border-slate-200 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="text-xs text-slate-400">
              {job.datePosted ? `Posted ${new Date(job.datePosted).toLocaleDateString()}` : ""}
            </div>

            <FeatureGate
              showOverlay={showOverlay}
              className="rounded-2xl"
              title="Track Applied & Tried jobs"
              description="Sign in to unlock one-click tracking and reminders."
            >
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">
                    <input
                      type="checkbox"
                      checked={Boolean(state.applied)}
                      onChange={() => updateTracking(job.id, { applied: !state.applied })}
                      className="h-4 w-4 accent-[rgb(var(--brand-rgb))]"
                    />
                    Applied
                  </label>
                  <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">
                    <input
                      type="checkbox"
                      checked={Boolean(state.tried)}
                      onChange={() => updateTracking(job.id, { tried: !state.tried })}
                      className="h-4 w-4 accent-[rgb(var(--brand-rgb))]"
                    />
                    Tried
                  </label>
                  <button
                    type="button"
                    onClick={() => updateTracking(job.id, { saved: !state.saved })}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] transition",
                      state.saved
                        ? "border-[rgba(var(--brand-rgb),0.5)] bg-[var(--brand-tint)] text-slate-900"
                        : "border-slate-200 text-slate-500 hover:border-[rgba(var(--brand-rgb),0.5)]"
                    )}
                  >
                    <svg viewBox="0 0 20 20" className="h-3 w-3" aria-hidden="true">
                      <path
                        d="M6 3h8a1 1 0 0 1 1 1v13l-5-3-5 3V4a1 1 0 0 1 1-1z"
                        fill="currentColor"
                      />
                    </svg>
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleNote(job.id)}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 transition hover:border-[rgba(var(--brand-rgb),0.5)]"
                  >
                    <svg viewBox="0 0 20 20" className="h-3 w-3" aria-hidden="true">
                      <path
                        d="M5 4h10a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H8l-3 3v-3H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"
                        fill="currentColor"
                      />
                    </svg>
                    Notes
                  </button>
                </div>

                {openNoteId === job.id ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                    <textarea
                      value={noteDrafts[job.id] ?? ""}
                      onChange={(event) =>
                        setNoteDrafts((prev) => ({
                          ...prev,
                          [job.id]: event.target.value,
                        }))
                      }
                      rows={3}
                      placeholder="Add a quick note..."
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 focus:border-[rgb(var(--brand-hover-rgb))] focus:outline-none focus:ring-2 focus:ring-[var(--brand-ring)]"
                    />
                    <div className="mt-2 flex justify-end gap-2">
                      <Button size="sm" variant="secondary" onClick={() => setOpenNoteId(null)}>
                        Cancel
                      </Button>
                      <Button size="sm" onClick={() => saveNote(job.id)}>
                        Save Note
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            </FeatureGate>
          </div>
        );
      })}

      {!isAuthenticated ? (
        <div className="rounded-3xl border border-[rgba(var(--brand-rgb),0.3)] bg-[var(--brand-tint)] p-5 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">Track Applied & Tried jobs</p>
          <p className="mt-1 text-slate-600">
            Sign in to unlock one-click tracking, reminders, and notes across jobs.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button href="/login" size="sm">
              Sign in
            </Button>
            <Button href="/signup" variant="secondary" size="sm">
              Create account
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
