"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { QuickTailorPanel } from "./QuickTailorPanel";
import { MatchBadge } from "./MatchBadge";

import type { PriorityBadge } from "@/lib/job-priority";

interface Posting {
  id: string;
  company: string;
  role: string;
  location: string;
  url: string;
  datePosted: string;
  category: string;
}

const CATEGORY_DOT_COLORS: Record<string, string> = {
  "usa-intern": "#3b82f6",
  "usa-newgrad": "#22c55e",
  "intl-intern": "#a855f7",
  "intl-newgrad": "#ef4444",
};

const PRIORITY_STYLES: Record<string, string> = {
  urgent: "border-green-300 dark:border-green-800 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30",
  high: "border-orange-300 dark:border-orange-800 text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30",
  medium: "border-yellow-300 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/30",
};

export function JobsTable({
  postings,
  priorities,
  fitBadges,
  matchScores,
  savedResumeText,
  isAuthenticated,
}: {
  postings: Posting[];
  priorities?: Record<string, PriorityBadge | null>;
  fitBadges?: Record<string, string[]>;
  matchScores?: Record<string, number>;
  savedResumeText?: string | null;
  isAuthenticated?: boolean;
}) {
  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set());
  const [tailorJob, setTailorJob] = useState<{ company: string; role: string } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("rezoomind_applied_jobs");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setAppliedJobs(new Set(parsed));
        }
      } catch {
        // failed to parse or read, ignore
      }
    }
  }, []);

  const handleApply = (id: string, url: string) => {
    const newApplied = new Set(appliedJobs);
    newApplied.add(id);
    setAppliedJobs(newApplied);
    localStorage.setItem("rezoomind_applied_jobs", JSON.stringify(Array.from(newApplied)));
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div id="jobs" className="border-[1.5px] border-stone-200 dark:border-stone-800 rounded-[10px] bg-white dark:bg-stone-900 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-stone-100 dark:border-stone-800">
        <div className="flex items-center gap-1.5">
          <span className="text-orange-600 font-mono text-xs">▸</span>
          <span className="font-mono text-sm font-bold text-stone-950 dark:text-stone-50">internships</span>
          <span className="text-[10px] bg-orange-50 dark:bg-orange-950 text-orange-600 px-1.5 rounded font-semibold border border-orange-200 dark:border-orange-800 ml-1">
            {postings.length}
          </span>
        </div>
        <Link href="/jobs" className="text-[11px] text-orange-600 font-semibold font-mono hover:underline">
          view_all →
        </Link>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[2fr_1.5fr_1fr_60px_140px] gap-2 px-5 py-2 bg-stone-50 dark:bg-stone-950 border-b border-stone-100 dark:border-stone-800">
        <span className="text-[9px] text-stone-400 uppercase tracking-widest font-mono">Company</span>
        <span className="text-[9px] text-stone-400 uppercase tracking-widest font-mono">Role</span>
        <span className="text-[9px] text-stone-400 uppercase tracking-widest font-mono hidden md:block">Location</span>
        <span className="text-[9px] text-stone-400 uppercase tracking-widest font-mono hidden md:block">Age</span>
        <span className="text-[9px] text-stone-400 uppercase tracking-widest font-mono text-right">Action</span>
      </div>

      {/* Scrollable job rows */}
      <div className="overflow-y-auto max-h-[60vh] min-h-[200px]">
        {postings.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-stone-400">
            Loading jobs...
          </div>
        ) : (
          postings.map((job, i) => {
            const isApplied = appliedJobs.has(job.id);
            const matchKey = `${job.company.toLowerCase().trim()}|${job.role.toLowerCase().trim()}`;
            const matchScore = matchScores?.[matchKey];
            return (
              <div
                key={job.id}
                className={`grid grid-cols-[2fr_1.5fr_1fr_60px_140px] gap-2 px-5 py-2.5 items-center hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors ${
                  i < postings.length - 1 ? "border-b border-stone-50 dark:border-stone-800/50" : ""
                } ${isApplied ? "opacity-60 bg-stone-50/50 dark:bg-stone-900/50" : ""}`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: isApplied ? "#9ca3af" : (CATEGORY_DOT_COLORS[job.category] ?? "#a8a29e") }}
                  />
                  <span className={`text-xs font-semibold truncate ${isApplied ? 'text-stone-500 dark:text-stone-400' : 'text-stone-950 dark:text-stone-100'}`}>
                    {job.company}
                  </span>
                  {matchScore != null && (
                    <span className="hidden md:inline-flex">
                      <MatchBadge score={matchScore} />
                    </span>
                  )}
                  {(() => {
                    const p = priorities?.[job.id];
                    if (!p || isApplied) return null;
                    return (
                      <span className={`hidden md:inline-flex text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border whitespace-nowrap ${PRIORITY_STYLES[p.tier]}`}>
                        {p.label}
                      </span>
                    );
                  })()}
                </div>
                <div className="min-w-0">
                  <span className={`text-xs truncate block ${isApplied ? 'text-stone-400 dark:text-stone-500' : 'text-stone-700 dark:text-stone-300'}`}>{job.role}</span>
                  {!isApplied && fitBadges?.[job.id]?.length ? (
                    <div className="hidden md:flex gap-1 mt-0.5">
                      {fitBadges[job.id].map((badge) => (
                        <span key={badge} className="text-[8px] font-mono px-1 py-px rounded border border-stone-300 dark:border-stone-700 text-stone-500 dark:text-stone-400">
                          {badge}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
                <span className="text-[11px] text-stone-500 dark:text-stone-400 truncate hidden md:block">{job.location}</span>
                <span className="text-[10px] text-stone-400 dark:text-stone-500 font-mono hidden md:block">{job.datePosted || "—"}</span>
                <div className="text-right flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => {
                      if (!isAuthenticated) {
                        window.location.href = "/login";
                        return;
                      }
                      if (!savedResumeText) {
                        document.getElementById("resume-upload")?.scrollIntoView({ behavior: "smooth" });
                        return;
                      }
                      setTailorJob({ company: job.company, role: job.role });
                    }}
                    className="text-[10px] font-mono font-bold text-amber-600 hover:text-amber-500 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-all shadow-[0_0_8px_rgba(217,119,6,0.15)] hover:shadow-[0_0_12px_rgba(217,119,6,0.3)] animate-pulse hover:animate-none"
                    title={!isAuthenticated ? "Sign in to tailor" : !savedResumeText ? "Upload resume to tailor" : "Boost win-rate to 80%!"}
                  >
                    tailor ✨
                  </button>
                  {job.url ? (
                    <button
                      onClick={() => handleApply(job.id, job.url)}
                      className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded transition-colors border ${
                        isApplied
                          ? "text-stone-400 border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800"
                          : "text-orange-600 hover:text-orange-500 border-orange-200 dark:border-orange-800 hover:bg-orange-50 dark:hover:bg-orange-950"
                      }`}
                    >
                      {isApplied ? "applied ✔" : "apply →"}
                    </button>
                  ) : (
                    <span className="text-[10px] text-stone-300 dark:text-stone-600 font-mono">closed</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
      <QuickTailorPanel
        isOpen={tailorJob !== null}
        onClose={() => setTailorJob(null)}
        jobContext={tailorJob}
        savedResumeText={savedResumeText}
      />
    </div>
  );
}
