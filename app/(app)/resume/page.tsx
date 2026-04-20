"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useSession } from "next-auth/react";

type ResumeRecord = {
  resume_text: string | null;
  file_url: string | null;
  created_at: string;
};

type SaveStatus = "idle" | "loading" | "success" | "error";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

export default function ResumePage() {
  const { data: session } = useSession();
  const user = session?.user;
  const sessionLoading = session === undefined;

  const [resumeText, setResumeText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [existing, setExisting] = useState<ResumeRecord | null>(null);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!user) return;
    let active = true;

    fetch("/api/resume/data", { credentials: "include" })
      .then(async (response) => {
        if (!active) return;
        const data = await response.json().catch(() => null);
        if (!response.ok || !data?.ok) return;
        setExisting(data.resume);
        if (data.resume?.resume_text) {
          setResumeText(data.resume.resume_text);
        }
      })
      .catch(() => null);

    return () => {
      active = false;
    };
  }, [user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      setStatus("error");
      setNote("Sign in to save your resume.");
      return;
    }

    if (!file && resumeText.trim().length === 0) {
      setStatus("error");
      setNote("Upload a PDF/DOCX or paste your resume text.");
      return;
    }

    try {
      setStatus("loading");
      setNote("");

      const formData = new FormData();
      if (resumeText.trim()) formData.append("resumeText", resumeText.trim());
      if (file) formData.append("file", file);

      const response = await fetch("/api/resume/data", {
        method: "POST",
        body: formData,
      });

      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) {
        setStatus("error");
        setNote(data?.error ?? "Unable to save resume.");
        return;
      }

      setExisting(data.resume);
      setFile(null);
      setStatus("success");
      setNote("Resume saved.");
    } catch {
      setStatus("error");
      setNote("Network error. Try again.");
    }
  }

  const isSaving = status === "loading";
  const noteTone =
    status === "success"
      ? "text-status-success"
      : status === "error"
      ? "text-status-error"
      : "text-fg-muted";

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-surface text-fg font-mono">
      {/* subtle terminal grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 opacity-[0.035] dark:opacity-[0.05] text-fg"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative mx-auto flex max-w-3xl flex-col gap-8 px-6 py-16 sm:py-20">
        <header>
          <p className="text-[10px] uppercase tracking-[0.2em] text-fg-subtle">
            ~/resume
          </p>
          <h1 className="mt-2 font-mono text-3xl font-bold tracking-tight sm:text-4xl">
            resume.dat
          </h1>
          <p className="mt-3 max-w-prose text-sm text-fg-muted">
            Upload a PDF/DOCX or paste your resume text. We extract skills and keywords
            to power match scoring.
          </p>
        </header>

        {/* Window chrome card */}
        <section
          aria-labelledby="resume-form-heading"
          className="border border-line bg-surface-raised"
        >
          <div className="flex items-center gap-2 border-b border-line bg-surface-sunken px-4 py-2">
            <div className="flex items-center gap-1.5" aria-hidden="true">
              <div className="w-2 h-2 rounded-full bg-fg-subtle/40" />
              <div className="w-2 h-2 rounded-full bg-fg-subtle/40" />
              <div className="w-2 h-2 rounded-full bg-fg-subtle/40" />
            </div>
            <span
              id="resume-form-heading"
              className="ml-2 text-[10px] uppercase tracking-[0.2em] text-fg-muted"
            >
              resume.exe
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8 p-6 sm:p-8">
            <div>
              <label
                htmlFor="resume-file"
                className="text-[10px] font-semibold uppercase tracking-[0.24em] text-fg-muted"
              >
                resume_file
              </label>
              <input
                id="resume-file"
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                disabled={sessionLoading || isSaving}
                className={`mt-3 block w-full border border-line bg-surface px-3 py-2 text-sm text-fg file:mr-3 file:rounded-none file:border file:border-line file:bg-surface-sunken file:px-3 file:py-1 file:text-xs file:font-mono file:text-fg-muted hover:file:border-orange-600/60 disabled:opacity-50 ${focusRing}`}
              />
              {existing?.file_url ? (
                <p className="mt-2 text-xs text-fg-subtle">
                  <span className="text-status-success" aria-hidden="true">▸ </span>
                  stored: <span className="text-fg-muted">{existing.file_url}</span>
                </p>
              ) : null}
            </div>

            <div>
              <label
                htmlFor="resume-text"
                className="text-[10px] font-semibold uppercase tracking-[0.24em] text-fg-muted"
              >
                resume_text
              </label>
              <div className="mt-3 flex border-b border-line focus-within:border-orange-600">
                <span
                  aria-hidden="true"
                  className="pt-2 pr-2 text-sm text-orange-600"
                >
                  {">"}
                </span>
                <textarea
                  id="resume-text"
                  value={resumeText}
                  onChange={(event) => setResumeText(event.target.value)}
                  rows={10}
                  placeholder="paste your resume here..."
                  disabled={sessionLoading || isSaving}
                  className="w-full resize-none bg-transparent py-2 text-sm text-fg placeholder:text-fg-subtle focus:outline-none disabled:opacity-50"
                />
              </div>
              <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-fg-subtle">
                extracted keywords drive match scoring
              </p>
            </div>

            {note ? (
              <p
                role={status === "error" ? "alert" : undefined}
                aria-live="polite"
                className={`flex items-center gap-2 text-sm ${noteTone}`}
              >
                <span aria-hidden="true">
                  {status === "success" ? "▸" : status === "error" ? "✗" : "⋯"}
                </span>
                <span>{note}</span>
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isSaving || sessionLoading}
              className={`w-full border border-orange-600/60 bg-orange-600/10 px-6 py-3 font-mono text-sm font-semibold tracking-wide text-orange-700 dark:text-orange-400 transition-colors hover:bg-orange-600/20 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
            >
              {isSaving ? "saving..." : "save_resume →"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
