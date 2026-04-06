"use client";

import { useMemo, useState, useEffect, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useSession } from "next-auth/react";

type ResumeRecord = {
  resume_text: string | null;
  file_url: string | null;
  created_at: string;
};

export default function ResumePage() {
  const { data: session } = useSession();
  const user = session?.user;
  const loading = session === undefined;

  const [resumeText, setResumeText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [existing, setExisting] = useState<ResumeRecord | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
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
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-20">
      <div>
        <h1 className="text-3xl font-semibold text-stone-100 font-mono sm:text-4xl">Resume</h1>
        <p className="mt-2 text-sm text-stone-400">
          Upload a PDF/DOCX or paste your resume text for smarter matching.
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
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
              <p className="mt-2 text-xs text-stone-500">
                Stored file: {existing.file_url}
              </p>
            ) : null}
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
              Resume Text
            </label>
            <textarea
              value={resumeText}
              onChange={(event) => setResumeText(event.target.value)}
              rows={8}
              className="mt-3 w-full bg-transparent border-0 border-b border-stone-800 rounded-none px-0 py-2 text-sm text-stone-200 placeholder:text-stone-600 focus:border-orange-600 focus:outline-none focus:ring-0 font-mono resize-none"
              placeholder="Paste your resume text here..."
              disabled={loading}
            />
          </div>

          {note ? (
            <p
              className={`text-sm ${status === "success" ? "text-green-500" : "text-red-400"
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
