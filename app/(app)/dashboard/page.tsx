"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRezoomAIAccess } from "@/hooks/useRezoomAIAccess";
import { QuickTailorPanel } from "@/components/dashboard/QuickTailorPanel";
import { Icons } from "./_components/icons";
import { NavIcon } from "./_components/NavIcon";
import { JobCard } from "./_components/JobCard";
import { JobDetailPane } from "./_components/JobDetailPane";
import { CopilotPanel } from "./_components/CopilotPanel";
import type { JobPosting, JobMatchRow } from "./_types";

const INITIAL_COPILOT_MESSAGE = {
  role: "assistant" as const,
  content:
    "Hi! I'm RezoomAI. I can help you understand why this job is a good fit, generate a custom resume, or write a cover letter. What would you like help with?",
};

export default function DashboardPage() {
  const router = useRouter();
  const { status } = useSession();
  const aiAccess = useRezoomAIAccess();

  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<JobMatchRow[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobMatchRow | null>(null);
  const [hasResume, setHasResume] = useState<boolean | null>(null);
  const [resumeText, setResumeText] = useState<string | null>(null);
  const [tailorOpen, setTailorOpen] = useState(false);

  const [copilotMessages, setCopilotMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([INITIAL_COPILOT_MESSAGE]);
  const [copilotInput, setCopilotInput] = useState("");
  const [isCopilotLoading, setIsCopilotLoading] = useState(false);

  const [expandedSections, setExpandedSections] = useState<string[]>(["skills"]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?next=/dashboard");
    } else if (status === "authenticated") {
      loadUserData();
    }
  }, [status, router]);

  const loadUserData = async () => {
    try {
      const response = await fetch("/api/dashboard/data");
      if (response.status === 401) {
        router.push("/login?next=/dashboard");
        return;
      }

      const data = await response.json();
      if (!data.ok) {
        console.error("[dashboard] API error:", data.error);
        setHasResume(false);
        setMatches([]);
      } else {
        setHasResume(data.hasResume ?? false);
        setMatches(data.matchRows ?? []);
      }

      try {
        const resumeRes = await fetch("/api/resume/data");
        const resumeData = await resumeRes.json();
        if (resumeData.ok && resumeData.resume?.resume_text) {
          setResumeText(resumeData.resume.resume_text);
        }
      } catch {
        // Non-critical — Quick Tailor still works with manual paste
      }

      const rows = data?.matchRows ?? [];
      if (rows.length > 0) {
        setSelectedJob(rows[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const tailorJobContext = useMemo(() => {
    if (!selectedJob?.job_postings) return null;
    const jp = selectedJob.job_postings;
    return { company: jp.company, role: jp.role, description: jp.description ?? undefined };
  }, [selectedJob]);

  const filterOptions = useMemo(
    () => [
      { id: "intern", label: "Intern/New Grad" },
      { id: "remote", label: "Remote" },
      { id: "week", label: "Past week" },
      { id: "h1b", label: "H1B Sponsor" },
    ],
    []
  );

  const visibleMatches = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return matches.filter((match) => {
      const job = match.job_postings;
      if (!job) return false;
      const haystack = `${job.role} ${job.company} ${job.location ?? ""}`.toLowerCase();
      if (term && !haystack.includes(term)) return false;
      if (activeFilters.includes("remote") && !job.location?.toLowerCase().includes("remote"))
        return false;
      if (
        activeFilters.includes("intern") &&
        !job.tags?.some(
          (t) => t.toLowerCase().includes("intern") || t.toLowerCase().includes("new-grad")
        )
      )
        return false;
      return true;
    });
  }, [matches, searchTerm, activeFilters]);

  const toggleFilter = (filterId: string) => {
    setActiveFilters((prev) =>
      prev.includes(filterId) ? prev.filter((f) => f !== filterId) : [...prev, filterId]
    );
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]
    );
  };

  const handleCopilotSend = async (message?: string) => {
    const text = message || copilotInput.trim();
    if (!text || isCopilotLoading) return;
    if (!aiAccess.canUseAI) {
      setCopilotMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Your free RezoomAI trial is used up in this browser. Log in to keep using the assistant.",
        },
      ]);
      return;
    }

    const newMessages = [...copilotMessages, { role: "user" as const, content: text }];
    setCopilotMessages(newMessages);
    setCopilotInput("");
    setIsCopilotLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          jobId: selectedJob?.job_postings?.id || undefined,
          jobUrl: selectedJob?.job_postings?.url || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.reply) {
        aiAccess.consumeCredit();
      }
      setCopilotMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply || "I'm having trouble connecting right now. Please try again.",
        },
      ]);
    } catch {
      setCopilotMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Network error occurred. Please try again." },
      ]);
    } finally {
      setIsCopilotLoading(false);
    }
  };

  const handleTailorResume = (match: JobMatchRow) => {
    if (!match.job_postings) return;
    setSelectedJob(match);
    setTailorOpen(true);
  };

  const handleAutofill = (job: JobPosting) => {
    if (job.url) {
      window.open(job.url, "_blank", "noopener,noreferrer");
    }
  };

  const handleSignOut = async () => {
    const { signOut } = await import("next-auth/react");
    await signOut({ callbackUrl: "/" });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-950">
        <div className="flex items-center gap-3 text-stone-400 text-sm font-mono">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-orange-600 animate-pulse" />
          Loading your dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex">
      {/* Left Column - Navigation Sidebar */}
      <aside className="w-[72px] bg-stone-950 border-r border-stone-800 flex flex-col items-center py-6 shrink-0">
        <div className="w-10 h-10 border border-orange-600/50 bg-orange-600/10 flex items-center justify-center text-orange-500 font-bold text-lg mb-8 font-mono">
          R
        </div>

        <nav className="flex-1 flex flex-col items-center gap-2">
          <NavIcon icon={<Icons.Jobs />} label="Jobs" active />
          <NavIcon icon={<Icons.Resume />} label="Resume" href="/resume" />
          <NavIcon icon={<Icons.Profile />} label="Profile" href="/dashboard/profile" />
          <NavIcon icon={<Icons.Agent />} label="AI Agent" badge="Beta" badgeColor="purple" />
        </nav>

        <div className="flex flex-col items-center gap-2 pt-4 border-t border-stone-800 mt-auto">
          <NavIcon icon={<Icons.Extension />} label="Autofill" small />
          <NavIcon icon={<Icons.Messages />} label="Messages" small />
          <NavIcon icon={<Icons.Feedback />} label="Feedback" small />
          <button
            onClick={handleSignOut}
            className="w-10 h-10 flex items-center justify-center text-stone-500 hover:text-rose-400 hover:bg-stone-800/50 transition-all"
            title="Logout"
          >
            <Icons.Logout />
          </button>
        </div>
      </aside>

      {/* Middle Column - Job Feed & Search */}
      <main className="flex-1 flex flex-col min-w-0 max-w-2xl border-r border-stone-800">
        <header className="p-4 border-b border-stone-800 sticky top-0 bg-stone-950/95 backdrop-blur-sm z-10">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500">
              <Icons.Search />
            </span>
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search jobs by title, company, or location..."
              className="w-full bg-stone-900 border-b border-stone-800 rounded-none pl-10 pr-4 py-3 text-sm text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-orange-600 focus:ring-0 transition-all font-mono"
            />
          </div>

          <div className="flex gap-2 mt-3 flex-wrap">
            {filterOptions.map((filter) => (
              <button
                key={filter.id}
                onClick={() => toggleFilter(filter.id)}
                className={`px-3 py-1.5 text-xs font-medium font-mono transition-all ${
                  activeFilters.includes(filter.id)
                    ? "bg-orange-600/10 text-orange-500 border border-orange-600/40"
                    : "bg-stone-900 text-stone-400 border border-stone-800 hover:border-stone-600"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {hasResume === false && (
            <div className="mx-4 mt-4 p-4 border border-orange-600/30 bg-orange-600/5">
              <p className="text-sm text-orange-400 font-mono">
                ▸ Upload your resume to see real match scores
              </p>
              <Link
                href="/resume"
                className="text-xs text-orange-500 font-mono hover:underline mt-1 block"
              >
                ~/resume/upload →
              </Link>
            </div>
          )}
          {visibleMatches.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-stone-900 border border-stone-800 flex items-center justify-center">
                <Icons.Jobs />
              </div>
              <p className="text-lg font-semibold text-stone-300 font-mono">No matches found</p>
              <p className="text-sm text-stone-500 mt-2">
                Try adjusting your filters or upload your resume for better matches.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-stone-800">
              {visibleMatches.map((match) => {
                const job = match.job_postings;
                if (!job) return null;
                return (
                  <JobCard
                    key={job.id}
                    job={job}
                    match={match}
                    isSelected={selectedJob?.job_postings?.id === job.id}
                    onClick={() => setSelectedJob(match)}
                    onTailorResume={() => handleTailorResume(match)}
                    onAutofill={() => handleAutofill(job)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Right Column - Job Details & AI Copilot */}
      <aside className="w-[480px] flex flex-col shrink-0 bg-stone-950">
        {selectedJob?.job_postings ? (
          <>
            <div className="flex-1 overflow-y-auto custom-scrollbar border-b border-stone-800">
              <JobDetailPane
                job={selectedJob.job_postings}
                match={selectedJob}
                expandedSections={expandedSections}
                toggleSection={toggleSection}
              />
            </div>

            <div className="h-[360px] flex flex-col bg-stone-950 border-t border-stone-800">
              <CopilotPanel
                messages={copilotMessages}
                input={copilotInput}
                setInput={setCopilotInput}
                onSend={handleCopilotSend}
                isLoading={isCopilotLoading}
                aiAccess={aiAccess}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 text-center">
            <div>
              <div className="w-20 h-20 mx-auto mb-4 bg-stone-900 border border-stone-800 flex items-center justify-center text-stone-600">
                <Icons.Jobs />
              </div>
              <p className="text-stone-400 font-mono">Select a job to view details</p>
            </div>
          </div>
        )}
      </aside>

      <QuickTailorPanel
        isOpen={tailorOpen}
        onClose={() => setTailorOpen(false)}
        jobContext={tailorJobContext}
        savedResumeText={resumeText}
      />
    </div>
  );
}
