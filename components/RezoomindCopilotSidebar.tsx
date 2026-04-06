"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { RezoomAITrialNotice } from "@/components/RezoomAITrialNotice";
import { useRezoomAIAccess } from "@/hooks/useRezoomAIAccess";

type CopilotJob = {
  id: string;
  role: string;
  company: string;
  url: string | null;
  location: string | null;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type RezoomindCopilotSidebarProps = {
  activeJob: CopilotJob | null;
  layout?: "fixed" | "embedded";
  className?: string;
  actionRequest?: CopilotActionRequest | null;
  showTrialNotice?: boolean;
  needsProfileSetup?: boolean;
  setupHref?: string;
};

export type CopilotActionRequest = {
  token: number;
  type: "tailor-bullets" | "skill-gap" | "why-fit" | "custom";
  content?: string;
  systemPrompt?: string;
};

const starterMessage: ChatMessage = {
  role: "assistant",
  content:
    "Select a job and RezoomAI will explain the fit, tailor your resume, surface missing skills, and draft outreach.",
};

export function RezoomindCopilotSidebar({
  activeJob,
  layout = "fixed",
  className = "",
  actionRequest = null,
  showTrialNotice = true,
  needsProfileSetup = false,
  setupHref = "/dashboard/profile?next=/jobs",
}: RezoomindCopilotSidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([starterMessage]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const handledActionTokenRef = useRef<number | null>(null);
  const aiAccess = useRezoomAIAccess();

  useEffect(() => {
    if (!scrollerRef.current) return;
    scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
  }, [messages, sending]);

  useEffect(() => {
    let cancelled = false;

    const loadMatchScore = async () => {
      if (!activeJob?.id) {
        setMatchScore(null);
        setMatchError(null);
        setMatchLoading(false);
        return;
      }

      setMatchLoading(true);
      setMatchError(null);
      try {
        const res = await fetch("/api/matches/score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId: activeJob.id }),
        });

        const data = await res.json();
        if (cancelled) return;

        if (res.ok && data?.ok && typeof data.overallScore === "number") {
          setMatchScore(Math.round(data.overallScore));
          return;
        }

        setMatchScore(null);
        if (res.status !== 401 && data?.error) {
          setMatchError(String(data.error));
        }
      } catch {
        if (!cancelled) {
          setMatchScore(null);
          setMatchError("Could not load match score");
        }
      } finally {
        if (!cancelled) {
          setMatchLoading(false);
        }
      }
    };

    void loadMatchScore();

    return () => {
      cancelled = true;
    };
  }, [activeJob?.id]);

  const quickActions = useMemo(
    () => {
      const actions = [
        {
          key: "why-fit",
          label: "Why I'm a Fit",
          userText: activeJob
            ? `Why am I a strong fit for ${activeJob.role} at ${activeJob.company}?`
            : "Why am I a strong fit for this role?",
          systemPrompt:
            "Analyze why the user's profile is a strong fit for this role. Give concise, evidence-based points and include any likely gaps.",
        },
        {
          key: "tailor-bullets",
          label: "Tailor Bullets",
          userText: activeJob
            ? `Tailor my top bullets for ${activeJob.role} at ${activeJob.company}.`
            : "Tailor my top bullets for this role.",
          systemPrompt: activeJob
            ? `Take the user's master resume and rewrite the top 3 bullets for the ${activeJob.role} at ${activeJob.company} using active verbs and tools like Python and Django.`
            : "Take the user's master resume and rewrite the top 3 bullets for the Active Job using active verbs and tools like Python and Django.",
        },
        {
          key: "skill-gap",
          label: "Find Missing Skills",
          userText: activeJob
            ? `Show me the skill gaps for ${activeJob.role} at ${activeJob.company}.`
            : "Show me the skill gaps for this role.",
          systemPrompt:
            "Identify exactly which skills are missing from the user's resume for this role.",
        },
        {
          key: "custom",
          label: "Draft Outreach",
          userText: activeJob
            ? `Draft a short outreach message for ${activeJob.role} at ${activeJob.company}.`
            : "Draft a short outreach message for this role.",
          systemPrompt:
            "Write a concise outreach message that sounds credible, specific to the role, and ready to send to a recruiter or hiring manager.",
        },
      ];
      return actions;
    },
    [activeJob]
  );

  const sendMessage = useCallback(
    async (content: string, quickSystemPrompt?: string) => {
      const trimmed = content.trim();
      if (!trimmed || sending) return;
      if (needsProfileSetup) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "Add your resume and profile first so RezoomAI can give job-specific fit, skill-gap, and tailoring help.",
          },
        ]);
        return;
      }
      if (!aiAccess.canUseAI) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "Your free RezoomAI trial is used up in this browser. Log in to keep chatting and unlock the full assistant.",
          },
        ]);
        return;
      }

      const nextMessages = [...messages, { role: "user" as const, content: trimmed }];
      setMessages(nextMessages);
      setInput("");
      setSending(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: nextMessages,
            jobId: activeJob?.id,
            jobUrl: activeJob?.url ?? undefined,
            quickActionSystemPrompt: quickSystemPrompt,
          }),
        });

        const data = await res.json();
        const reply =
          res.ok && data?.reply
            ? String(data.reply)
            : "I hit an error while generating that in RezoomAI. Please try again.";
        if (res.ok && data?.reply) {
          aiAccess.consumeCredit();
        }
        setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Network error while reaching RezoomAI." },
        ]);
      } finally {
        setSending(false);
      }
    },
    [activeJob?.id, activeJob?.url, aiAccess, messages, needsProfileSetup, sending]
  );

  useEffect(() => {
    if (!actionRequest) return;
    if (handledActionTokenRef.current === actionRequest.token) return;

    handledActionTokenRef.current = actionRequest.token;

    if (actionRequest.type === "custom" && actionRequest.content) {
      void sendMessage(actionRequest.content, actionRequest.systemPrompt);
      return;
    }

    const mapped = quickActions.find((item) => item.key === actionRequest.type);
    if (mapped) {
      void sendMessage(mapped.userText, mapped.systemPrompt);
    }
  }, [actionRequest, quickActions, sendMessage]);

  const renderPanelBody = () => (
    <div className="flex h-full flex-col bg-stone-950 text-stone-100">
      <div className="border-b border-stone-800 px-4 py-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-wide text-orange-400 font-mono">RezoomAI</h2>
          <span className="border border-orange-600/40 bg-orange-600/10 px-2 py-0.5 text-[11px] font-medium text-orange-300 font-mono">
            AI
          </span>
        </div>

        {activeJob ? (
          <div className="border border-stone-800 bg-stone-900 p-3">
            <p className="text-[11px] uppercase tracking-wide text-stone-400 font-mono">Active Job</p>
            <p className="mt-1 text-sm font-semibold text-stone-100">{activeJob.role}</p>
            <p className="text-xs text-stone-300">{activeJob.company}</p>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-stone-400">Match Score</span>
              <span className="font-semibold text-orange-400 font-mono">
                {matchLoading ? "Calculating..." : matchScore !== null ? `${matchScore}%` : "N/A"}
              </span>
            </div>
            {matchError ? <p className="mt-1 text-[11px] text-amber-300">{matchError}</p> : null}
          </div>
        ) : (
          <div className="border border-stone-800 bg-stone-900 p-3 text-xs text-stone-300">
            Select a job to unlock job-specific RezoomAI actions.
          </div>
        )}

        {showTrialNotice ? (
          <RezoomAITrialNotice
            isAuthenticated={aiAccess.isAuthenticated}
            remainingGuestCredits={aiAccess.remainingGuestCredits}
            requiresLogin={aiAccess.requiresLogin}
            loginHref={aiAccess.loginHref}
            encouragement={aiAccess.encouragement}
            className="mt-3"
          />
        ) : null}
      </div>

      <div ref={scrollerRef} className="custom-scrollbar flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {needsProfileSetup ? (
          <div className="border border-amber-400/25 bg-amber-500/10 p-4 text-sm text-amber-50">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200">
              Add resume first
            </p>
            <p className="mt-2 leading-relaxed text-amber-50/90">
              RezoomAI is most useful when it can compare your resume against the active job. Upload your resume once and this panel will switch to job-specific help.
            </p>
            <Link
              href={setupHref}
              className="mt-3 inline-flex border border-orange-600/50 bg-orange-600/10 px-3 py-1.5 text-xs font-semibold text-orange-500 transition hover:bg-orange-600/20 font-mono"
            >
              Add Resume and Profile
            </Link>
          </div>
        ) : null}

        {messages.map((msg, index) => (
          <div key={`${msg.role}-${index}`} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[90%] px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-stone-700 text-stone-100"
                  : "border border-orange-600/35 bg-orange-600/10 text-orange-100"
              }`}
            >
              {msg.role === "assistant" ? (
                <span className="mb-1 inline-block bg-orange-600/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-orange-300 font-mono">
                  Actionable
                </span>
              ) : null}
              <p>{msg.content}</p>
            </div>
          </div>
        ))}

        {sending ? <p className="text-xs text-stone-400 font-mono">RezoomAI is thinking...</p> : null}
      </div>

      <div className="border-t border-stone-800 bg-stone-950/95 p-3">
        <div className="mb-3 flex flex-wrap gap-2">
          {quickActions.map((action) => (
            <button
              key={action.key}
              type="button"
              disabled={sending || aiAccess.requiresLogin || needsProfileSetup}
              onClick={() => {
                void sendMessage(action.userText, action.systemPrompt);
              }}
              className="border border-stone-700 bg-stone-900 px-3 py-1.5 text-xs font-medium text-stone-200 transition hover:border-orange-600/70 hover:text-orange-400 disabled:opacity-50 font-mono"
            >
              {action.label}
            </button>
          ))}
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void sendMessage(input);
          }}
          className="flex items-center gap-2"
        >
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={
              needsProfileSetup
                ? "Add your resume to unlock job-specific RezoomAI..."
                : aiAccess.requiresLogin
                ? "Log in to continue using RezoomAI..."
                : "Ask RezoomAI for targeted help..."
            }
            disabled={sending || aiAccess.requiresLogin || needsProfileSetup}
            className="min-w-0 flex-1 border border-stone-700 bg-stone-900 px-3 py-2 text-sm text-stone-100 placeholder:text-stone-500 focus:border-orange-600 focus:outline-none font-mono"
          />
          <button
            type="submit"
            disabled={sending || !input.trim() || aiAccess.requiresLogin || needsProfileSetup}
            className="border border-orange-600/50 bg-orange-600/10 px-3 py-2 text-sm font-semibold text-orange-500 transition hover:bg-orange-600/20 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {layout === "embedded" ? (
        <div className={`h-full overflow-hidden border border-stone-800 ${className}`}>
          {renderPanelBody()}
        </div>
      ) : null}

      {layout !== "fixed" ? null : (
        <>
      <aside className="fixed inset-y-0 right-0 z-30 hidden w-[25rem] border-l border-stone-800 bg-stone-950 pt-16 lg:block">
        {renderPanelBody()}
      </aside>

      <button
        type="button"
        onClick={() => setIsMobileOpen(true)}
        className="fixed bottom-5 right-5 z-30 border border-orange-600/50 bg-orange-600/10 px-4 py-3 text-sm font-semibold text-orange-500 lg:hidden font-mono"
      >
        RezoomAI
      </button>

      <div className={`fixed inset-0 z-50 lg:hidden ${isMobileOpen ? "" : "pointer-events-none"}`}>
        <div
          role="button"
          tabIndex={0}
          aria-label="Close RezoomAI"
          onClick={() => setIsMobileOpen(false)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              setIsMobileOpen(false);
            }
          }}
          className={`absolute inset-0 bg-stone-950/60 transition-opacity ${isMobileOpen ? "opacity-100" : "opacity-0"}`}
        />

        <aside
          className={`absolute right-0 top-0 h-full w-[90vw] max-w-sm border-l border-stone-800 bg-stone-950 transition-transform ${
            isMobileOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <button
            type="button"
            onClick={() => setIsMobileOpen(false)}
            className="absolute right-3 top-3 z-10 border border-stone-700 px-2 py-1 text-xs text-stone-300 hover:bg-stone-800 font-mono"
          >
            Close
          </button>
          {renderPanelBody()}
        </aside>
      </div>
        </>
      )}
    </>
  );
}
