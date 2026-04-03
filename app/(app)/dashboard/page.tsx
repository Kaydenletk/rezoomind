"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { RezoomAITrialNotice } from "@/components/RezoomAITrialNotice";
import { useRezoomAIAccess } from "@/hooks/useRezoomAIAccess";

// Types
interface JobPosting {
  id: string;
  role: string;
  company: string;
  location: string | null;
  url: string | null;
  tags: string[] | null;
  date_posted: string | null;
  created_at: string;
  description?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_interval?: string | null;
}

interface JobMatchRow {
  match_score: number | null;
  match_reasons: string[] | null;
  is_saved: boolean | null;
  is_applied: boolean | null;
  job_postings: JobPosting | null;
  // AI-computed match breakdown
  experience_match?: number;
  skills_match?: number;
  industry_match?: number;
}

// Utility functions
const getRelativeTime = (dateStr?: string | null) => {
  if (!dateStr) return "Recently";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "Recently";
  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return diffDays === 1 ? "1d ago" : `${diffDays}d ago`;
};

const formatSalary = (min?: number | null, max?: number | null, interval?: string | null) => {
  if (!min && !max) return null;
  const fmt = (n: number) => n >= 1000 ? `$${Math.round(n / 1000)}k` : `$${n}`;
  if (min && max) return `${fmt(min)} - ${fmt(max)}${interval === 'hourly' ? '/hr' : '/yr'}`;
  if (min) return `${fmt(min)}+${interval === 'hourly' ? '/hr' : '/yr'}`;
  return `Up to ${fmt(max!)}${interval === 'hourly' ? '/hr' : '/yr'}`;
};

// Icons
const Icons = {
  Jobs: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
    </svg>
  ),
  Resume: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  ),
  Profile: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  ),
  Agent: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  ),
  Extension: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 005.427-.63 48.05 48.05 0 00.582-4.717.532.532 0 00-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.96.401v0a.656.656 0 00.658-.663 48.422 48.422 0 00-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 01-.61-.58v0z" />
    </svg>
  ),
  Messages: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
    </svg>
  ),
  Feedback: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
    </svg>
  ),
  Logout: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
    </svg>
  ),
  Search: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  ),
  Check: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  ),
  ChevronDown: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  ),
  Lightning: () => (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.381z" />
    </svg>
  ),
  Send: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
    </svg>
  ),
  Close: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
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

  // AI Copilot state
  const [copilotMessages, setCopilotMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    { role: "assistant", content: "Hi! I'm RezoomAI. I can help you understand why this job is a good fit, generate a custom resume, or write a cover letter. What would you like help with?" }
  ]);
  const [copilotInput, setCopilotInput] = useState("");
  const [isCopilotLoading, setIsCopilotLoading] = useState(false);

  // Accordion states for job details
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
      if (!response.ok) throw new Error("Failed to load");

      const { matchRows } = await response.json();
      const enrichedMatches = (matchRows ?? []).map((match: JobMatchRow) => ({
        ...match,
        // Simulate AI-computed match breakdown (in production, this comes from API)
        experience_match: Math.round((match.match_score ?? 0) * (0.8 + Math.random() * 0.4)),
        skills_match: Math.round((match.match_score ?? 0) * (0.7 + Math.random() * 0.5)),
        industry_match: Math.round((match.match_score ?? 0) * (0.6 + Math.random() * 0.6)),
      }));
      setMatches(enrichedMatches);

      // Auto-select first job
      if (enrichedMatches.length > 0) {
        setSelectedJob(enrichedMatches[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filterOptions = useMemo(() => [
    { id: "intern", label: "Intern/New Grad" },
    { id: "remote", label: "Remote" },
    { id: "week", label: "Past week" },
    { id: "h1b", label: "H1B Sponsor" },
  ], []);

  const visibleMatches = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return matches.filter((match) => {
      const job = match.job_postings;
      if (!job) return false;
      const haystack = `${job.role} ${job.company} ${job.location ?? ""}`.toLowerCase();
      if (term && !haystack.includes(term)) return false;

      // Apply filters
      if (activeFilters.includes("remote") && !job.location?.toLowerCase().includes("remote")) return false;
      if (activeFilters.includes("intern") && !(job.tags?.some(t => t.toLowerCase().includes("intern") || t.toLowerCase().includes("new-grad")))) return false;

      return true;
    });
  }, [matches, searchTerm, activeFilters]);

  const toggleFilter = (filterId: string) => {
    setActiveFilters(prev =>
      prev.includes(filterId)
        ? prev.filter(f => f !== filterId)
        : [...prev, filterId]
    );
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const handleCopilotSend = async (message?: string) => {
    const text = message || copilotInput.trim();
    if (!text || isCopilotLoading) return;
    if (!aiAccess.canUseAI) {
      setCopilotMessages(prev => [...prev, {
        role: "assistant",
        content: "Your free RezoomAI trial is used up in this browser. Log in to keep using the assistant."
      }]);
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
      setCopilotMessages(prev => [...prev, {
        role: "assistant",
        content: data.reply || "I'm having trouble connecting right now. Please try again."
      }]);
    } catch {
      setCopilotMessages(prev => [...prev, {
        role: "assistant",
        content: "Network error occurred. Please try again."
      }]);
    } finally {
      setIsCopilotLoading(false);
    }
  };

  // Handle "Tailor Resume" button on job cards
  const handleTailorResume = (match: JobMatchRow) => {
    const job = match.job_postings;
    if (!job) return;
    // Select the job
    setSelectedJob(match);
    // Auto-populate the copilot with a tailored resume request
    const tailorMessage = `I want to tailor my resume for ${job.role} at ${job.company}. Please analyze the job requirements and suggest 3 specific, quantified bullet points per role that align with this position. Use active verbs and reference specific tools/technologies from the job description.`;
    handleCopilotSend(tailorMessage);
  };

  // Handle "Autofill" button on job cards
  const handleAutofill = (job: JobPosting) => {
    if (job.url) {
      window.open(job.url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleSignOut = async () => {
    const { signOut } = await import("next-auth/react");
    await signOut({ callbackUrl: "/" });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="flex items-center gap-3 text-slate-400 text-sm">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
          Loading your dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex">
      {/* Left Column - Navigation Sidebar */}
      <aside className="w-[72px] bg-slate-950 border-r border-slate-800 flex flex-col items-center py-6 shrink-0">
        {/* Logo */}
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg mb-8 neon-glow-teal">
          R
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 flex flex-col items-center gap-2">
          <NavIcon icon={<Icons.Jobs />} label="Jobs" active />
          <NavIcon icon={<Icons.Resume />} label="Resume" href="/resume" />
          <NavIcon icon={<Icons.Profile />} label="Profile" href="/dashboard/profile" />
          <NavIcon
            icon={<Icons.Agent />}
            label="AI Agent"
            badge="Beta"
            badgeColor="purple"
          />
        </nav>

        {/* Bottom Utilities */}
        <div className="flex flex-col items-center gap-2 pt-4 border-t border-slate-800 mt-auto">
          <NavIcon icon={<Icons.Extension />} label="Autofill" small />
          <NavIcon icon={<Icons.Messages />} label="Messages" small />
          <NavIcon icon={<Icons.Feedback />} label="Feedback" small />
          <button
            onClick={handleSignOut}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:text-rose-400 hover:bg-slate-800/50 transition-all"
            title="Logout"
          >
            <Icons.Logout />
          </button>
        </div>
      </aside>

      {/* Middle Column - Job Feed & Search */}
      <main className="flex-1 flex flex-col min-w-0 max-w-2xl border-r border-slate-800">
        {/* Search Header */}
        <header className="p-4 border-b border-slate-800 sticky top-0 bg-slate-900/95 backdrop-blur-sm z-10">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
              <Icons.Search />
            </span>
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search jobs by title, company, or location..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/20 transition-all"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex gap-2 mt-3 flex-wrap">
            {filterOptions.map((filter) => (
              <button
                key={filter.id}
                onClick={() => toggleFilter(filter.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeFilters.includes(filter.id)
                    ? "bg-teal-500/20 text-teal-400 border border-teal-500/40"
                    : "bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600"
                  }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </header>

        {/* Job Feed */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {visibleMatches.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800 flex items-center justify-center">
                <Icons.Jobs />
              </div>
              <p className="text-lg font-semibold text-slate-300">No matches found</p>
              <p className="text-sm text-slate-500 mt-2">
                Try adjusting your filters or upload your resume for better matches.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {visibleMatches.map((match) => {
                const job = match.job_postings;
                if (!job) return null;
                const isSelected = selectedJob?.job_postings?.id === job.id;

                return (
                  <JobCard
                    key={job.id}
                    job={job}
                    match={match}
                    isSelected={isSelected}
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
      <aside className="w-[480px] flex flex-col shrink-0 bg-slate-900">
        {selectedJob?.job_postings ? (
          <>
            {/* Job Details - Top Half */}
            <div className="flex-1 overflow-y-auto custom-scrollbar border-b border-slate-800">
              <JobDetails
                job={selectedJob.job_postings}
                expandedSections={expandedSections}
                toggleSection={toggleSection}
              />
            </div>

            {/* AI Copilot - Bottom Half */}
            <div className="h-[360px] flex flex-col bg-slate-950 border-t border-slate-800">
              <AICopilot
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
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-600">
                <Icons.Jobs />
              </div>
              <p className="text-slate-400">Select a job to view details</p>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

// Navigation Icon Component
function NavIcon({
  icon,
  label,
  active,
  href,
  badge,
  badgeColor,
  small,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  href?: string;
  badge?: string;
  badgeColor?: "purple" | "teal";
  small?: boolean;
}) {
  const size = small ? "w-9 h-9" : "w-10 h-10";
  const className = `${size} rounded-xl flex items-center justify-center transition-all relative group ${active
      ? "bg-teal-500/20 text-teal-400"
      : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
    }`;

  const content = (
    <>
      {icon}
      {badge && (
        <span className={`absolute -top-1 -right-1 px-1.5 py-0.5 text-[9px] font-bold rounded-md ${badgeColor === "purple"
            ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
            : "bg-teal-500/20 text-teal-400 border border-teal-500/30"
          }`}>
          {badge}
        </span>
      )}
      <span className="absolute left-full ml-3 px-2 py-1 bg-slate-800 text-slate-200 text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50">
        {label}
      </span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className} title={label}>
        {content}
      </Link>
    );
  }

  return (
    <button className={className} title={label}>
      {content}
    </button>
  );
}

// Circular Match Score Ring
function MatchScoreRing({ score, size = 52 }: { score: number; size?: number }) {
  const strokeWidth = 3.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(score, 100) / 100;
  const offset = circumference * (1 - progress);
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#64748b';

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1e293b"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold" style={{ color }}>{score}%</span>
      </div>
    </div>
  );
}

// Job Card Component
function JobCard({
  job,
  match,
  isSelected,
  onClick,
  onTailorResume,
  onAutofill,
}: {
  job: JobPosting;
  match: JobMatchRow;
  isSelected: boolean;
  onClick: () => void;
  onTailorResume: () => void;
  onAutofill: () => void;
}) {
  const score = Math.round(match.match_score ?? 0);
  const salary = formatSalary(job.salary_min, job.salary_max, job.salary_interval);
  const isInternship = job.tags?.some(t => t.toLowerCase().includes("intern"));
  const isH1B = job.tags?.some(t => t.toLowerCase().includes("h1b") || t.toLowerCase().includes("sponsor"));
  const isEarly = true;

  return (
    <motion.div
      onClick={onClick}
      className={`p-4 cursor-pointer transition-all ${isSelected
          ? "bg-slate-800/50 border-l-2 border-teal-500"
          : "hover:bg-slate-800/30 border-l-2 border-transparent"
        }`}
      whileHover={{ x: 2 }}
    >
      <div className="flex gap-4">
        {/* Company Logo */}
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-slate-300 font-bold text-lg shrink-0">
          {job.company.charAt(0)}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header with Circular Score */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-slate-100 truncate">{job.role}</h3>
              <p className="text-sm text-slate-400">{job.company}</p>
              <span className="text-xs text-slate-500">
                {getRelativeTime(job.date_posted ?? job.created_at)}
              </span>
            </div>
            <MatchScoreRing score={score} />
          </div>

          {/* Location & Tags */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {job.location && (
              <span className="text-xs text-slate-500">{job.location}</span>
            )}
            {isInternship && (
              <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 text-[10px] font-medium">
                Internship
              </span>
            )}
            {salary && (
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-medium">
                {salary}
              </span>
            )}
          </div>

          {/* Match Bars */}
          <div className="mt-3 space-y-1.5">
            <MatchProgressBar label="Skills" value={match.skills_match ?? 0} color="purple" />
            <MatchProgressBar label="Experience" value={match.experience_match ?? 0} color="teal" />
          </div>

          {/* Badges */}
          <div className="flex gap-2 mt-3">
            {isH1B && (
              <span className="px-2 py-1 rounded-md bg-purple-500/10 text-purple-400 text-[10px] font-medium border border-purple-500/20">
                H1B Sponsor
              </span>
            )}
            {isEarly && (
              <span className="px-2 py-1 rounded-md bg-teal-500/10 text-teal-400 text-[10px] font-medium border border-teal-500/20">
                Early applicant
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={(e) => { e.stopPropagation(); onAutofill(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500/10 text-teal-400 text-xs font-semibold border border-teal-500/20 hover:bg-teal-500/20 transition-all"
            >
              <Icons.Lightning />
              Autofill
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onTailorResume(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-400 text-xs font-semibold border border-purple-500/20 hover:bg-purple-500/20 transition-all"
            >
              <Icons.Agent />
              Tailor Resume
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Match Progress Bar
function MatchProgressBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "teal" | "purple" | "blue";
}) {
  const colorClasses = {
    teal: "bg-teal-500",
    purple: "bg-purple-500",
    blue: "bg-blue-500",
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-slate-500 w-16">{label}</span>
      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${colorClasses[color]} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(value, 100)}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      <span className="text-[10px] text-slate-500 w-8 text-right">{value}%</span>
    </div>
  );
}

// Job Details Component
function JobDetails({
  job,
  expandedSections,
  toggleSection,
}: {
  job: JobPosting;
  expandedSections: string[];
  toggleSection: (section: string) => void;
}) {
  // Mock skills data (in production, this would come from resume + job analysis)
  const skills = [
    { name: "Python", matched: true },
    { name: "Django", matched: true },
    { name: "PostgreSQL", matched: true },
    { name: "React", matched: false },
    { name: "AWS", matched: true },
    { name: "Docker", matched: false },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-slate-200 font-bold text-xl shrink-0">
          {job.company.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-slate-100">{job.role}</h1>
          <p className="text-slate-400">{job.company}</p>
          <div className="flex items-center gap-3 mt-2 text-sm text-slate-500">
            {job.location && <span>{job.location}</span>}
            <span>{getRelativeTime(job.date_posted ?? job.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Apply Button */}
      <a
        href={job.url || "#"}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold text-sm hover:from-teal-400 hover:to-teal-500 transition-all shadow-lg shadow-teal-500/25 neon-glow-teal mb-6"
      >
        <Icons.Lightning />
        Apply with Autofill
      </a>

      {/* Job Description */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-slate-300 mb-3">Job Description</h2>
        <div className="text-sm text-slate-400 leading-relaxed space-y-3">
          {job.description ? (
            <p className="whitespace-pre-wrap">{job.description.slice(0, 800)}...</p>
          ) : (
            <p>
              We are looking for a talented {job.role} to join our team at {job.company}.
              This is an exciting opportunity to work on cutting-edge projects and grow your career.
            </p>
          )}
        </div>
      </div>

      {/* Skills Checklist */}
      <AccordionSection
        title="Skills Checklist"
        isExpanded={expandedSections.includes("skills")}
        onToggle={() => toggleSection("skills")}
      >
        <div className="grid grid-cols-2 gap-2">
          {skills.map((skill) => (
            <div
              key={skill.name}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${skill.matched
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-slate-800 text-slate-500"
                }`}
            >
              {skill.matched ? (
                <span className="text-emerald-400">
                  <Icons.Check />
                </span>
              ) : (
                <span className="w-4 h-4 rounded-full border border-slate-600" />
              )}
              {skill.name}
            </div>
          ))}
        </div>
      </AccordionSection>

      {/* Insider Connections */}
      <AccordionSection
        title="Insider Connections"
        isExpanded={expandedSections.includes("connections")}
        onToggle={() => toggleSection("connections")}
      >
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 text-sm font-medium">
              JD
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-300">John Doe</p>
              <p className="text-xs text-slate-500">Software Engineer at {job.company}</p>
            </div>
            <button className="px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-400 text-xs font-medium hover:bg-purple-500/20 transition-colors">
              Connect
            </button>
          </div>
          <p className="text-xs text-slate-500 text-center">
            2nd degree connection via LinkedIn
          </p>
        </div>
      </AccordionSection>

      {/* Company Funding */}
      <AccordionSection
        title="Company Funding"
        isExpanded={expandedSections.includes("funding")}
        onToggle={() => toggleSection("funding")}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Total Raised</span>
            <span className="text-sm font-semibold text-teal-400">$50M Series B</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Last Round</span>
            <span className="text-sm text-slate-300">March 2024</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Investors</span>
            <span className="text-sm text-slate-300">a16z, Sequoia</span>
          </div>
        </div>
      </AccordionSection>

      {/* Leadership Team */}
      <AccordionSection
        title="Leadership Team"
        isExpanded={expandedSections.includes("leadership")}
        onToggle={() => toggleSection("leadership")}
      >
        <div className="space-y-3">
          {[
            { name: "Sarah Chen", role: "CEO & Co-founder" },
            { name: "Mike Johnson", role: "CTO" },
            { name: "Emily Davis", role: "VP Engineering" },
          ].map((leader) => (
            <div key={leader.name} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 text-xs font-medium">
                {leader.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-300">{leader.name}</p>
                <p className="text-xs text-slate-500">{leader.role}</p>
              </div>
            </div>
          ))}
        </div>
      </AccordionSection>
    </div>
  );
}

// Accordion Section Component
function AccordionSection({
  title,
  isExpanded,
  onToggle,
  children,
}: {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-slate-800 py-4">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between text-sm font-semibold text-slate-300 hover:text-slate-100 transition-colors"
      >
        {title}
        <motion.span
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <Icons.ChevronDown />
        </motion.span>
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// AI Copilot Component
function AICopilot({
  messages,
  input,
  setInput,
  onSend,
  isLoading,
  aiAccess,
}: {
  messages: { role: "user" | "assistant"; content: string }[];
  input: string;
  setInput: (v: string) => void;
  onSend: (message?: string) => void;
  isLoading: boolean;
  aiAccess: ReturnType<typeof useRezoomAIAccess>;
}) {
  const quickActions = [
    "Summarize this job",
    "Write cover letter",
    "Tailor my resume",
    "Interview prep tips",
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center neon-glow-purple">
          <Icons.Agent />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-200">RezoomAI</h3>
          <p className="text-[10px] text-slate-500">Powered by Gemini</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-neon" />
          <span className="text-[10px] text-slate-500">Online</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-3 flex gap-2 flex-wrap border-b border-slate-800/50">
        <div className="w-full">
          <RezoomAITrialNotice
            isAuthenticated={aiAccess.isAuthenticated}
            remainingGuestCredits={aiAccess.remainingGuestCredits}
            requiresLogin={aiAccess.requiresLogin}
            loginHref={aiAccess.loginHref}
            encouragement={aiAccess.encouragement}
            theme="dark"
          />
        </div>
        {quickActions.map((action) => (
          <button
            key={action}
            onClick={() => onSend(action)}
            disabled={isLoading || aiAccess.requiresLogin}
            className="px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-400 text-[11px] font-medium border border-purple-500/20 hover:bg-purple-500/20 transition-all disabled:opacity-50"
          >
            {action}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm ${msg.role === "user"
                  ? "bg-teal-500/20 text-teal-100 rounded-tr-sm"
                  : "bg-slate-800 text-slate-300 rounded-tl-sm"
                }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={aiAccess.requiresLogin ? "Log in to continue with RezoomAI..." : "Ask anything or tailor your resume..."}
            disabled={isLoading || aiAccess.requiresLogin}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading || aiAccess.requiresLogin}
            className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center hover:bg-purple-500/30 transition-colors disabled:opacity-50"
          >
            <Icons.Send />
          </button>
        </form>
      </div>
    </div>
  );
}
