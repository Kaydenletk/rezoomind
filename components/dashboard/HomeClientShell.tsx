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
  children: React.ReactNode;
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
      // Silently fail
    }
  }, [isAuth]);

  // Batch-score CSV jobs against resume using Gemini
  const fetchBatchScores = useCallback(async () => {
    if (!resume || postings.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/matches/batch-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobs: postings.map((p) => ({
            company: p.company,
            role: p.role,
            location: p.location,
            category: p.category,
          })),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.scores) {
          setMatchScores(data.scores);
        }
      }
    } catch {
      // Silently fail — user just won't see scores
    } finally {
      setLoading(false);
    }
  }, [resume, postings]);

  useEffect(() => { fetchResume(); }, [fetchResume]);
  useEffect(() => { fetchBatchScores(); }, [fetchBatchScores]);

  const handleUploaded = () => {
    fetchResume();
  };

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
