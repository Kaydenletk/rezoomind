"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { RezoomAITrialNotice } from "@/components/RezoomAITrialNotice";
import { useAuth } from "@/components/AuthProvider";
import { useRezoomAIAccess } from "@/hooks/useRezoomAIAccess";

type AnalysisResult = {
  score: number;
  strengths: string[];
  gaps: string[];
  bulletSuggestions: string[];
  keywords: string[];
};

export default function ResumeAnalysisPage() {
  const { isAuthenticated, signIn } = useAuth();
  const aiAccess = useRezoomAIAccess();
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [fileMeta, setFileMeta] = useState<{ name: string; size: number } | null>(
    null
  );
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [note, setNote] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!aiAccess.canUseAI) {
      setStatus("error");
      setNote("Log in to keep using RezoomAI after your 5 free tries.");
      return;
    }

    if (!resumeText.trim() && !fileMeta) {
      setStatus("error");
      setNote("Add resume text or upload a file.");
      return;
    }

    try {
      setStatus("loading");
      setNote("");
      setResult(null);

      const response = await fetch("/api/resume/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: resumeText.trim() || null,
          jobDescription: jobDescription.trim() || null,
          fileName: fileMeta?.name ?? null,
          fileSize: fileMeta?.size ?? null,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) {
        setStatus("error");
        setNote(data?.error ?? "Unable to analyze resume.");
        return;
      }

      setStatus("success");
      aiAccess.consumeCredit();
      setResult({
        score: data.score,
        strengths: data.strengths,
        gaps: data.gaps,
        bulletSuggestions: data.bulletSuggestions,
        keywords: data.keywords,
      });
    } catch {
      setStatus("error");
      setNote("Network error. Try again.");
    }
  };

  const handleCopy = async () => {
    if (!result?.bulletSuggestions?.length) return;
    await navigator.clipboard.writeText(result.bulletSuggestions.join("\n"));
  };

  const formDisabled = status === "loading" || aiAccess.requiresLogin;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-20">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-brand">
          RezoomAI Resume Analysis
        </p>
        <h1 className="mt-2 text-3xl font-semibold font-mono text-stone-100 sm:text-4xl">
          Tailor your resume to this role in minutes.
        </h1>
        <p className="mt-3 text-sm text-stone-400">
          Get ATS-friendly bullets, match score, and keyword suggestions.
        </p>
      </div>

      {!isAuthenticated ? (
        <Card className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-stone-100">5 free RezoomAI tries</h2>
            <p className="mt-1 text-sm text-stone-400">
              Start with 5 free RezoomAI actions in this browser, then log in to keep unlimited access and save your results.
            </p>
          </div>
          <Button onClick={() => signIn()}>Log in</Button>
        </Card>
      ) : null}

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <RezoomAITrialNotice
            isAuthenticated={aiAccess.isAuthenticated}
            remainingGuestCredits={aiAccess.remainingGuestCredits}
            requiresLogin={aiAccess.requiresLogin}
            loginHref={aiAccess.loginHref}
            encouragement={aiAccess.encouragement}
            theme="light"
          />

          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
              Resume file (PDF or DOCX)
            </label>
            <Input
              type="file"
              accept="application/pdf,.doc,.docx"
              className="mt-3"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                if (!file) {
                  setFileMeta(null);
                  return;
                }
                setFileMeta({ name: file.name, size: file.size });
              }}
              disabled={formDisabled}
            />
            {fileMeta ? (
              <p className="mt-2 text-xs text-stone-500">
                Selected: {fileMeta.name} ({Math.round(fileMeta.size / 1024)}kb)
              </p>
            ) : null}
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
              Resume text
            </label>
            <textarea
              rows={6}
              value={resumeText}
              onChange={(event) => setResumeText(event.target.value)}
              placeholder="Paste your resume text here..."
              className="mt-3 w-full border border-stone-800 bg-stone-900 px-4 py-3 text-sm text-stone-100 placeholder:text-stone-600 focus:border-orange-600 focus:outline-none font-mono"
              disabled={formDisabled}
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
              Job description (optional)
            </label>
            <textarea
              rows={4}
              value={jobDescription}
              onChange={(event) => setJobDescription(event.target.value)}
              placeholder="Paste the job description to tailor the analysis..."
              className="mt-3 w-full border border-stone-800 bg-stone-900 px-4 py-3 text-sm text-stone-100 placeholder:text-stone-600 focus:border-orange-600 focus:outline-none font-mono"
              disabled={formDisabled}
            />
          </div>

          {note ? (
            <p
              className={`text-sm ${status === "success" ? "text-emerald-600" : "text-rose-500"
                }`}
            >
              {note}
            </p>
          ) : null}

          <Button type="submit" disabled={formDisabled}>
            {status === "loading" ? "Running analysis..." : "Run analysis"}
          </Button>
        </form>
      </Card>

      {result ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <Card>
            <h2 className="text-lg font-semibold text-stone-100">Match score</h2>
            <p className="mt-2 text-4xl font-semibold text-stone-100">
              {result.score}
              <span className="text-base text-stone-500">/100</span>
            </p>
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-stone-300">Strengths</h3>
              <ul className="mt-2 space-y-2 text-sm text-stone-400">
                {result.strengths.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-stone-300">Gaps</h3>
              <ul className="mt-2 space-y-2 text-sm text-stone-400">
                {result.gaps.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-stone-100">
                Suggested bullets
              </h2>
              <Button size="sm" variant="secondary" onClick={handleCopy}>
                Copy
              </Button>
            </div>
            <ul className="mt-4 space-y-3 text-sm text-stone-400">
              {result.bulletSuggestions.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-stone-300">
                Recommended keywords
              </h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {result.keywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="border border-orange-600/30 bg-orange-600/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-orange-500"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
