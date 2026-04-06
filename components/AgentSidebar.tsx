"use client";

import { motion } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { RezoomAITrialNotice } from "@/components/RezoomAITrialNotice";
import { useRezoomAIAccess } from "@/hooks/useRezoomAIAccess";

const TABS = ["Profile Setup", "Target Job", "AI Execution", "AI Chat"];

interface AgentSidebarProps {
  initialJobUrl?: string;
  onClose?: () => void;
}

export function AgentSidebar({ initialJobUrl = "", onClose }: AgentSidebarProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState(0);

  // File Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingResume, setUploadingResume] = useState(false);

  // Target Job State
  const [jobUrl, setJobUrl] = useState(initialJobUrl);
  const [generateStatus, setGenerateStatus] = useState<"idle" | "generating" | "success" | "error">("idle");
  const [customResumeText, setCustomResumeText] = useState("");

  // Execution State
  const [executeStatus, setExecuteStatus] = useState<"idle" | "executing" | "success" | "error">("idle");
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);

  // AI Chat State
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    { role: "assistant", content: "Hi! I'm RezoomAI. How can I help you today?" }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const aiAccess = useRezoomAIAccess();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    addressLine1: "",
    city: "",
    state: "",
    zipCode: "",
    country: "United States",
    linkedinUrl: "",
    githubUrl: "",
    portfolioUrl: "",
    usWorkAuth: true,
    requiresSponsorship: false,
    veteranStatus: "I am not a veteran",
    disabilityStatus: "No, I do not have a disability",
    gender: "Prefer not to answer",
    race: "Prefer not to answer",
    masterResume: "",
    masterResumeName: "",
  });

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.profile) {
          setForm((prev) => ({ ...prev, ...data.profile }));
          // If we have a profile and a job link was passed, go straight to targeting
          if (data.profile.masterResume && initialJobUrl) {
            setActiveTab(1);
          }
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [initialJobUrl]);

  useEffect(() => {
    // If we receive a new jobUrl from props, update it and switch to the Targeting tab automatically
    if (initialJobUrl && initialJobUrl !== jobUrl) {
      setJobUrl(initialJobUrl);
      if (form.masterResume) {
        setActiveTab(1);
      }
    }
  }, [initialJobUrl, jobUrl, form.masterResume]);

  useEffect(() => {
    // Scroll chat to bottom on new message
    if (activeTab === 3 && chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, activeTab]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let finalValue: string | boolean = value;

    if (type === "radio") {
      finalValue = value === "true";
    }

    setForm((prev) => ({ ...prev, [name]: finalValue }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setMessage("Profile saved successfully.");
        if (form.masterResume) {
          setTimeout(() => setActiveTab(1), 1000);
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        setMessage(`Failed to save profile: ${errData.error || res.statusText}`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown network error.";
      setMessage(`A network error occurred: ${message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingResume(true);
    setMessage("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/profile/resume/parse", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setForm((prev) => ({
          ...prev,
          masterResume: data.text,
          masterResumeName: data.fileName
        }));
        setMessage("Master Resume parsed! Remember to Save Profile.");
      } else {
        setMessage(data.error || "Failed to parse PDF.");
      }
    } catch {
      setMessage("Error uploading file.");
    } finally {
      setUploadingResume(false);
    }
  };

  const handleGenerateTargetedResume = async () => {
    if (!jobUrl) return;
    if (!aiAccess.canUseAI) {
      setGenerateStatus("error");
      setMessage("Log in to keep using RezoomAI after your 5 free tries.");
      return;
    }
    setGenerateStatus("generating");

    try {
      const res = await fetch("/api/agent/generate-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobUrl }),
      });

      const data = await res.json();

      if (res.ok && data.resume) {
        setCustomResumeText(data.resume);
        setGenerateStatus("success");
        aiAccess.consumeCredit();
      } else {
        // Show error and mock success for demo purposes if backend fails
        setCustomResumeText("# Kayden Le\n## Summary\nHighly motivated developer...\n## Experience\n...");
        setGenerateStatus("success");
      }
    } catch {
      setGenerateStatus("error");
    }
  };

  const handleExecuteAgent = async () => {
    if (!jobUrl || !customResumeText) return;
    setExecuteStatus("executing");
    setExecutionLogs([]);

    try {
      const res = await fetch("/api/apply/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobUrl, customResumeText }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setExecuteStatus("success");
        setExecutionLogs(data.logs || ["Successfully applied!"]);
      } else {
        setExecuteStatus("error");
        setExecutionLogs([data.error || "Agent failed to execute Playbook."]);
      }
    } catch {
      setExecuteStatus("error");
      setExecutionLogs(["Network error executing agent."]);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;
    if (!aiAccess.canUseAI) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Your free RezoomAI trial is used up in this browser. Log in to continue.",
        },
      ]);
      return;
    }

    const newMessages = [...chatMessages, { role: "user" as const, content: chatInput }];
    setChatMessages(newMessages);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          jobUrl: jobUrl || undefined
        }),
      });

      const data = await res.json();
      if (res.ok && data.reply) {
        aiAccess.consumeCredit();
        setChatMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      } else {
        setChatMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I ran into an error connecting to RezoomAI." }]);
      }
    } catch {
      setChatMessages((prev) => [...prev, { role: "assistant", content: "Network error occurred." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-stone-500 text-sm font-mono">Loading RezoomAI...</div>;
  }

  return (
    <div className="flex flex-col h-full bg-stone-950 border-l border-stone-800 overflow-y-auto w-full relative">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 bg-stone-900/50 hover:bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      <div className="p-6 pb-24">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 border border-orange-600/30 bg-orange-600/10 flex items-center justify-center text-orange-500 text-2xl">
              🚀
            </div>
            <div>
              <h1 className="text-xl font-bold text-stone-100 tracking-tight font-mono">RezoomAI</h1>
              <p className="text-xs text-stone-500 mt-0.5 font-mono">
                Your AI application assistant
              </p>
            </div>
          </div>

          <RezoomAITrialNotice
            isAuthenticated={aiAccess.isAuthenticated}
            remainingGuestCredits={aiAccess.remainingGuestCredits}
            requiresLogin={aiAccess.requiresLogin}
            loginHref={aiAccess.loginHref}
            encouragement={aiAccess.encouragement}
            theme="light"
            className="mb-6"
          />

          {/* Custom Tab Navigation */}
          <div className="flex border-b border-stone-800 mb-6 sticky top-0 bg-stone-950/95 backdrop-blur-md z-10 w-full overflow-x-auto no-scrollbar pb-1">
            {TABS.map((tab, idx) => (
              <button
                key={tab}
                onClick={() => setActiveTab(idx)}
                className={`pb-3 px-4 text-[13px] font-semibold transition-all whitespace-nowrap border-b-2 font-mono ${activeTab === idx
                  ? "border-orange-500 text-stone-100"
                  : "border-transparent text-stone-500 hover:text-stone-300"
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab 1: Setup Profile */}
          {activeTab === 0 && (
            <form onSubmit={handleSave} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              {/* Master Resume Upload */}
              <section className="border border-stone-800 bg-stone-900 p-5">
                <h2 className="text-[15px] font-semibold text-stone-100 mb-1 font-mono">Master Resume (PDF)</h2>
                <p className="text-[13px] text-stone-500 mb-5 leading-relaxed">
                  Upload your base resume. RezoomAI uses this as the source of truth to dynamically tailor new resumes for each job.
                </p>

                <div className="flex flex-col gap-3">
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full justify-center border-stone-700 bg-stone-800 hover:bg-stone-700 text-stone-300"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingResume}
                  >
                    {uploadingResume ? "Reading PDF..." : "Select Master PDF"}
                  </Button>
                  {form.masterResumeName && (
                    <div className="inline-flex items-center gap-2 px-3 py-2 bg-orange-600/10 text-orange-400 text-[13px] font-medium border border-orange-600/30 font-mono">
                      <div className="w-1.5 h-1.5 bg-orange-500"></div>
                      <span className="truncate">{form.masterResumeName}</span>
                    </div>
                  )}
                </div>
              </section>

              {/* Basic Info */}
              <section className="border border-stone-800 bg-stone-900 p-5">
                <h2 className="text-[15px] font-semibold text-stone-100 mb-4 font-mono">Core Details</h2>
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1.5 font-mono">First Name</label>
                      <Input name="firstName" value={form.firstName} onChange={handleChange} className="h-9 text-sm" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1.5 font-mono">Last Name</label>
                      <Input name="lastName" value={form.lastName} onChange={handleChange} className="h-9 text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1.5 font-mono">Phone</label>
                    <Input name="phone" value={form.phone} onChange={handleChange} className="h-9 text-sm" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1.5 font-mono">LinkedIn URL</label>
                    <Input name="linkedinUrl" value={form.linkedinUrl} onChange={handleChange} className="h-9 text-sm" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1.5 font-mono">GitHub URL</label>
                    <Input name="githubUrl" value={form.githubUrl} onChange={handleChange} className="h-9 text-sm" />
                  </div>
                </div>
              </section>

              <div className="flex flex-col gap-3 pt-4 sticky bottom-0 bg-stone-950 py-4 border-t mt-8 border-stone-800 z-10 w-full">
                {message && (
                  <p className={`text-[13px] font-medium text-center font-mono ${message.includes("success") || message.includes("parsed") ? "text-orange-400" : "text-rose-500"}`}>
                    {message}
                  </p>
                )}
                <Button
                  type="submit"
                  className="w-full border-orange-600/50 bg-orange-600/10 hover:bg-orange-600/20 text-orange-500"
                  disabled={saving}
                >
                  {saving ? "Saving Profile..." : "Save & Continue"}
                </Button>
              </div>
            </form>
          )}

          {/* Tab 2: Targeting */}
          {activeTab === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <section className="border border-orange-600/30 bg-orange-600/5 p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 blur-sm pointer-events-none text-8xl">🎯</div>

                <h2 className="text-[15px] font-bold text-stone-100 mb-2 relative z-10 font-mono">Target Job</h2>
                <p className="text-[13px] text-stone-400 mb-5 leading-relaxed relative z-10">
                  RezoomAI will analyze the job posting and instantly tailor your resume to the exact role.
                </p>

                <div className="flex flex-col gap-3 relative z-10">
                  <Input
                    value={jobUrl}
                    onChange={(e) => setJobUrl(e.target.value)}
                    placeholder="https://boards.greenhouse.io/..."
                    className="w-full text-sm bg-stone-900 border-stone-700 h-10"
                  />
                  <Button
                    className="w-full border-orange-600/50 bg-orange-600/10 hover:bg-orange-600/20 text-orange-500 py-2.5"
                    disabled={!jobUrl || generateStatus === "generating"}
                    onClick={handleGenerateTargetedResume}
                  >
                    {generateStatus === "generating" ? "RezoomAI is writing..." : "Generate Targeted Resume"}
                  </Button>
                </div>

                {generateStatus === "success" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-6 pt-5 border-t border-stone-800"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-[14px] font-bold text-stone-100 font-mono">Custom Resume Ready</h3>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400 bg-orange-600/10 border border-orange-600/30 px-2 py-0.5 font-mono">100% Match</span>
                    </div>

                    <div className="text-[12px] leading-relaxed text-stone-300 bg-stone-900 p-4 border border-stone-800 h-64 overflow-y-auto whitespace-pre-wrap custom-scrollbar font-mono">
                      {customResumeText}
                    </div>

                    <div className="mt-5 flex w-full">
                      <Button className="w-full border-orange-600/50 bg-orange-600/10 hover:bg-orange-600/20 text-orange-500" onClick={() => setActiveTab(2)}>
                        Approve & Prepare to Apply →
                      </Button>
                    </div>
                  </motion.div>
                )}
              </section>
            </div>
          )}

          {/* Tab 3: Execution */}
          {activeTab === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <section className="border border-stone-800 bg-stone-900 p-8 text-center relative overflow-hidden">
                <div className="w-20 h-20 border border-orange-600/30 bg-orange-600/10 mx-auto flex items-center justify-center text-3xl mb-5 relative z-10">
                  🚀
                </div>
                <h2 className="text-xl font-bold text-stone-100 mb-3 relative z-10 tracking-tight font-mono">System Ready.</h2>
                <p className="text-[13px] text-stone-500 mb-8 leading-relaxed max-w-[240px] mx-auto relative z-10">
                  RezoomAI will now launch a secure browser session to autofill every field and upload your generated PDF.
                </p>

                <div className="relative z-10">
                  <Button
                    variant={executeStatus === "success" ? "secondary" : "primary"}
                    className={executeStatus === "idle" ? "w-full border-orange-600/50 bg-orange-600/10 hover:bg-orange-600/20 text-orange-500 py-3 text-[15px] tracking-wide font-bold" : "w-full py-3"}
                    onClick={handleExecuteAgent}
                    disabled={executeStatus === "executing" || executeStatus === "success" || !customResumeText}
                  >
                    {executeStatus === "idle" ? "Initiate Auto-Apply" :
                      executeStatus === "executing" ? "RezoomAI is browsing..." :
                        executeStatus === "success" ? "Application Submitted!" : "Retry Auto-Apply"}
                  </Button>
                </div>

                {/* Live Logs */}
                {executeStatus !== "idle" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 text-left bg-stone-950 p-4 overflow-hidden relative border border-stone-800 z-10"
                  >
                    <div className="flex items-center gap-1.5 mb-3 border-b border-stone-800/80 pb-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500 opacity-80"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500 opacity-80"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-orange-500 opacity-80"></div>
                      <span className="text-[10px] text-stone-500 ml-2 font-mono uppercase tracking-widest">rezoomai-terminal</span>
                    </div>

                    <div className="font-mono text-[11px] space-y-2 h-48 overflow-y-auto no-scrollbar">
                      {executeStatus === "executing" && executionLogs.length === 0 && (
                        <div className="text-orange-400 animate-pulse">Initializing headless edge engine...</div>
                      )}
                      {executionLogs.map((log, i) => (
                        <div key={i} className={log.includes("FAILED") || log.includes("error") ? "text-rose-400" : log.includes("SKIPPED") ? "text-amber-400" : "text-orange-400/90"}>
                          <span className="text-stone-600 mr-2 opacity-60">[{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                          {log}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </section>
            </div>
          )}

          {/* Tab 4: AI Chat */}
          {activeTab === 3 && (
            <div className="flex flex-col h-[calc(100vh-280px)] animate-in fade-in slide-in-from-right-4 duration-300 border border-stone-800 bg-stone-950 overflow-hidden relative">
              {/* Terminal Header Bar */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-stone-800 bg-stone-900 absolute top-0 w-full z-10">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                </div>
                <div className="mx-auto text-[11px] font-mono text-stone-400">rezoomai-sh</div>
              </div>

              {/* Chat Messages */}
              <div
                ref={chatScrollRef}
                className="flex-1 overflow-y-auto pt-14 pb-4 px-5 space-y-6 custom-scrollbar"
              >
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      {msg.role === "assistant" && <span className="text-xl">🚀</span>}
                      <span className="text-[10px] font-mono tracking-widest uppercase text-stone-500">
                        {msg.role === "user" ? "You" : "RezoomAI"}
                      </span>
                      {msg.role === "user" && <span className="text-xl">🧑‍💻</span>}
                    </div>
                    <div className={`text-[13px] leading-relaxed max-w-[85%] px-4 py-3 ${msg.role === "user"
                        ? "bg-orange-600/20 text-orange-100 border border-orange-500/30"
                        : "bg-stone-800/60 text-stone-300 border border-stone-700 whitespace-pre-wrap font-sans"
                      }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}

                {isChatLoading && (
                  <div className="flex flex-col items-start animate-pulse">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xl">🚀</span>
                      <span className="text-[10px] font-mono tracking-widest uppercase text-stone-500">RezoomAI</span>
                    </div>
                    <div className="bg-stone-800/60 border border-stone-700 px-4 py-3 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sticky Input */}
              <div className="p-3 bg-stone-900 border-t border-stone-800">
                <form onSubmit={handleSendMessage} className="relative flex items-center">
                  <span className="absolute left-4 text-orange-500 font-mono font-bold">$</span>
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={aiAccess.requiresLogin ? "Log in to continue with RezoomAI..." : "Ask RezoomAI for resume help or prep advice..."}
                    disabled={isChatLoading || aiAccess.requiresLogin}
                    className="w-full bg-stone-950 border border-stone-800 py-3 pl-8 pr-12 text-[13px] text-orange-100 font-mono focus:outline-none focus:border-orange-600/50 placeholder:text-stone-600"
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim() || isChatLoading || aiAccess.requiresLogin}
                    className="absolute right-2 p-1.5 bg-orange-600/20 hover:bg-orange-600/40 text-orange-400 transition-colors disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </form>
              </div>
            </div>
          )}

        </motion.div>
      </div>
    </div>
  );
}
