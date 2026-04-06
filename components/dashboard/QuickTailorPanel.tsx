"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";

interface TailorResult {
  matchScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: string[];
}

interface QuickTailorPanelProps {
  isOpen: boolean;
  onClose: () => void;
  jobContext: { company: string; role: string; description?: string } | null;
  savedResumeText?: string | null;
}

export function QuickTailorPanel({ isOpen, onClose, jobContext, savedResumeText }: QuickTailorPanelProps) {
  const [jobDescription, setJobDescription] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TailorResult | null>(null);

  const prevOpenRef = useRef(false);

  // Pre-fill only when panel transitions from closed → open
  useEffect(() => {
    if (isOpen && !prevOpenRef.current) {
      if (savedResumeText) setResumeText(savedResumeText);
      if (jobContext?.description) setJobDescription(jobContext.description);
      setResult(null);
    }
    prevOpenRef.current = isOpen;
  }, [isOpen]);

  const handleTailor = async () => {
    if (!jobDescription.trim() || !resumeText.trim()) return;
    
    setLoading(true);
    try {
      const res = await fetch("/api/quick-tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription, resumeText })
      });
      
      const data = await res.json();
      if (data.success) {
        setResult(data.result);
      } else {
        console.error("Tailor failed:", data.error);
        alert("Wait, something went wrong crunching these words.");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to reach tailor server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-stone-900/40 dark:bg-black/60 backdrop-blur-sm z-40 transition-opacity"
          />

          {/* Slide-over Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white dark:bg-stone-950 border-l border-stone-200 dark:border-stone-800 shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 dark:border-stone-900">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-500" />
                <h2 className="font-mono text-sm font-bold text-stone-900 dark:text-stone-50">
                  Quick Tailor
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 rounded-md hover:bg-stone-100 dark:hover:bg-stone-900 transition-colors"
                title="Close panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5 text-sm">
              {jobContext && (
                <div className="bg-orange-50/50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/50 rounded-lg p-3">
                  <p className="text-orange-800 dark:text-orange-400 font-medium">
                    Tailoring for <span className="font-bold">{jobContext.role}</span> @ {jobContext.company}
                  </p>
                </div>
              )}

              {!result ? (
                <>
                  <div className="flex flex-col gap-2">
                    <label className="font-mono text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                      1. Paste Job Description
                    </label>
                    <textarea
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      placeholder="Paste the requirements or description here..."
                      className="w-full h-32 p-3 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-md text-stone-700 dark:text-stone-300 resize-none focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-mono text-[11px]"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="font-mono text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                      2. Paste Current Resume
                    </label>
                    <textarea
                      value={resumeText}
                      onChange={(e) => setResumeText(e.target.value)}
                      placeholder="Paste your base resume content here..."
                      className="w-full h-40 p-3 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-md text-stone-700 dark:text-stone-300 resize-none focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-mono text-[11px]"
                    />
                  </div>

                  <button
                    onClick={handleTailor}
                    disabled={loading || !jobDescription.trim() || !resumeText.trim()}
                    className="mt-2 w-full flex items-center justify-center gap-2 py-3 bg-stone-950 dark:bg-orange-600 text-stone-50 font-monotext-xs font-bold rounded-lg hover:bg-stone-800 dark:hover:bg-orange-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="animate-pulse">Crunching keywords...</span>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Analyze Match
                      </>
                    )}
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  {/* Score Board */}
                  <div className="flex items-center justify-between p-4 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg">
                    <div>
                      <p className="text-xs text-stone-500 dark:text-stone-400 font-mono mb-1">Match Score</p>
                      <h3 className="text-3xl font-bold text-stone-900 dark:text-white">
                        {result.matchScore}%
                      </h3>
                    </div>
                    <div>
                    <button onClick={() => setResult(null)} className="text-orange-600 text-[11px] font-mono hover:underline">
                      ← Start Over
                    </button>
                    </div>
                  </div>

                  {/* Keywords Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                       <h4 className="flex items-center gap-1.5 text-[11px] font-mono text-green-600 mb-3 font-semibold tracking-wide">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        MATCHED ({result.matchedKeywords.length})
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {result.matchedKeywords.length === 0 ? <span className="text-xs text-stone-400">None</span> : 
                         result.matchedKeywords.map(kw => (
                           <span key={kw} className="px-2 py-0.5 bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-400 rounded text-[10px] border border-green-200 dark:border-green-900/50">{kw}</span>
                         ))
                        }
                      </div>
                    </div>
                    <div>
                       <h4 className="flex items-center gap-1.5 text-[11px] font-mono text-red-500 mb-3 font-semibold tracking-wide">
                        <AlertCircle className="w-3.5 h-3.5" />
                        MISSING ({result.missingKeywords.length})
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {result.missingKeywords.length === 0 ? <span className="text-xs text-stone-400">None</span> : 
                         result.missingKeywords.map(kw => (
                           <span key={kw} className="px-2 py-0.5 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded text-[10px] border border-red-100 dark:border-red-900/40 opacity-80">{kw}</span>
                         ))
                        }
                      </div>
                    </div>
                  </div>

                  <hr className="border-stone-100 dark:border-stone-800" />

                  {/* Suggested Tweaks */}
                  <div>
                    <h4 className="text-[11px] font-mono text-stone-900 dark:text-stone-300 mb-3 font-semibold uppercase tracking-wider">
                      Top 3 Fixes to boost win-rate
                    </h4>
                    <ul className="flex flex-col gap-3">
                      {result.suggestions.map((suggestion, i) => (
                        <li key={i} className="flex gap-2 text-[11.5px] leading-relaxed text-stone-700 dark:text-stone-400 bg-stone-50 dark:bg-stone-900/50 p-3 rounded-md border border-stone-100 dark:border-stone-800/80">
                          <span className="text-orange-500 font-mono font-bold">{i+1}.</span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
