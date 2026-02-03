"use client";

import { useMemo, useState, useEffect, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/components/AuthProvider";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type ResumeRecord = {
  resume_text: string | null;
  file_url: string | null;
  created_at: string;
};

export default function ResumePage() {
  const { user, loading } = useAuth();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [resumeText, setResumeText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [existing, setExisting] = useState<ResumeRecord | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!user) return;
    let active = true;

    fetch("/api/resume", { credentials: "include" })
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
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

      let fileUrl = existing?.file_url ?? null;

      if (file) {
        const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
        const isDocx =
          file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
          file.name.toLowerCase().endsWith(".docx");
        if (!isPdf && !isDocx) {
          setStatus("error");
          setNote("Please upload a PDF or DOCX file.");
          return;
        }

        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const filePath = `${user.id}/${Date.now()}-${safeName}`;

        const { error: uploadError } = await supabase.storage
          .from("resumes")
          .upload(filePath, file, { upsert: true });

        if (uploadError) {
          setStatus("error");
          setNote(uploadError.message);
          return;
        }

        fileUrl = filePath;
      }

      const response = await fetch("/api/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          resumeText: resumeText.trim() || null,
          fileUrl,
        }),
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
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-20">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">Resume</h1>
        <p className="mt-2 text-sm text-slate-600">
          Upload a PDF/DOCX or paste your resume text for smarter matching.
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Resume File
            </label>
            <Input
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="mt-3"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              disabled={loading}
            />
            {existing?.file_url ? (
              <p className="mt-2 text-xs text-slate-500">
                Stored file: {existing.file_url}
              </p>
            ) : null}
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Resume Text
            </label>
            <textarea
              value={resumeText}
              onChange={(event) => setResumeText(event.target.value)}
              rows={8}
              className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[rgb(var(--brand-hover-rgb))] focus:outline-none focus:ring-2 focus:ring-[var(--brand-ring)]"
              placeholder="Paste your resume text here..."
              disabled={loading}
            />
          </div>

          {note ? (
            <p
              className={`text-sm ${
                status === "success" ? "text-emerald-600" : "text-rose-500"
              }`}
            >
              {note}
            </p>
          ) : null}

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={status === "loading" || loading}
          >
            {status === "loading" ? "Saving..." : "Save Resume"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
