"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { AuthHeader } from "./AuthHeader";
import { MatchingPreviewCard } from "./MatchingPreviewCard";
import { ResumeUploadCard } from "./ResumeUploadCard";
import { ResumeStatusCard } from "./ResumeStatusCard";
import { MarketChart } from "./MarketChart";
import { JobsTable } from "./JobsTable";
import { DashboardFooter } from "./DashboardFooter";

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

interface HomeClientShellProps {
  // Server-rendered content passed through
  children: React.ReactNode; // SummaryStrip + MainInsightCard + MarketBanner + InsightCards + stats bar
  // Data from server
  postings: Posting[];
  priorities: Record<string, PriorityBadge | null>;
  fitBadges: Record<string, string[]>;
  counts: { swe: number; pm: number; dsml: number; quant: number; hardware: number; total: number };
}

interface ResumeData {
  resumeText: string;
  keywords: string[];
  parsedAt: string | null;
}

export function HomeClientShell({
  children,
  postings,
  priorities,
  fitBadges,
  counts,
}: HomeClientShellProps) {
  const { status } = useSession();
  const isAuth = status === "authenticated";

  const [resume, setResume] = useState<ResumeData | null>(null);
  const [matchScores, setMatchScores] = useState<Record<string, number>>({});
  const [showUpload, setShowUpload] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch resume data when authenticated
  // API shape: { ok: true, resume: { resume_text, resume_keywords, parsed_at, ... } }
  const fetchResume = useCallback(async () => {
    if (!isAuth) return;
    try {
      const res = await fetch("/api/resume/data");
      if (res.ok) {
        const json = await res.json();
        if (json.ok && json.resume?.resume_text) {
          setResume({
            resumeText: json.resume.resume_text,
            keywords: json.resume.resume_keywords || [],
            parsedAt: json.resume.parsed_at || null,
          });
          setShowUpload(false);
        }
      }
    } catch {
      // Silently fail — user just won't see match scores
    }
  }, [isAuth]);

  // Fetch match scores when resume is available
  // API shape: { ok, hasResume, matchRows: [{ match_score, job_postings: { company, role, ... } }] }
  //
  // IMPORTANT: The dashboard API returns jobs from the DATABASE (Prisma job_postings),
  // but the homepage JobsTable displays jobs from the GITHUB CSV source.
  // These have DIFFERENT IDs. We match by composite key: "company|role" (lowercased).
  const fetchMatchScores = useCallback(async () => {
    if (!resume) return;
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/data");
      if (res.ok) {
        const data = await res.json();
        const scores: Record<string, number> = {};
        if (data.ok && data.matchRows) {
          for (const row of data.matchRows) {
            if (row.match_score == null || !row.job_postings) continue;
            const jp = row.job_postings;
            // Composite key matches GitHub jobs by company+role
            const key = `${(jp.company || "").toLowerCase().trim()}|${(jp.role || "").toLowerCase().trim()}`;
            scores[key] = Math.round(row.match_score);
          }
        }
        setMatchScores(scores);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [resume]);

  useEffect(() => { fetchResume(); }, [fetchResume]);
  useEffect(() => { fetchMatchScores(); }, [fetchMatchScores]);

  const handleUploaded = () => {
    fetchResume(); // Re-fetch resume data after upload
  };

  // Determine sidebar content
  const renderSidebar = () => {
    if (!isAuth) {
      return <MatchingPreviewCard />;
    }
    if (!resume || showUpload) {
      return (
        <ResumeUploadCard onUploaded={handleUploaded} />
      );
    }
    return (
      <ResumeStatusCard
        keywords={resume.keywords}
        parsedAt={resume.parsedAt}
        onReUpload={() => setShowUpload(true)}
        matchLoading={loading}
      />
    );
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col transition-colors">
      <AuthHeader />

      {/* Server-rendered insight components */}
      {children}

      {/* Main: Jobs + Sidebar */}
      <div className="flex-1 px-5 lg:px-7 pb-4">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-3.5">
          <JobsTable
            postings={postings}
            priorities={priorities}
            fitBadges={fitBadges}
            matchScores={matchScores}
            savedResumeText={resume?.resumeText}
            isAuthenticated={isAuth}
          />

          <div className="flex flex-col gap-3.5" id="resume-upload">
            <MarketChart
              swe={counts.swe}
              pm={counts.pm}
              dsml={counts.dsml}
              quant={counts.quant}
              hardware={counts.hardware}
              total={counts.total}
            />
            {renderSidebar()}
          </div>
        </div>
      </div>

      <DashboardFooter />
    </div>
  );
}
