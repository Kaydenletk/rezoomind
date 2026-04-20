"use client";

import { motion, AnimatePresence } from "framer-motion";
import { getRelativeTime } from "@/lib/job-utils";
import { Icons } from "./icons";
import type { JobPosting, JobMatchRow } from "../_types";

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
    <div className="border-t border-stone-800 py-4">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between text-sm font-semibold text-stone-300 hover:text-stone-100 transition-colors font-mono uppercase tracking-[0.15em] text-[10px]"
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

export function JobDetailPane({
  job,
  match,
  expandedSections,
  toggleSection,
}: {
  job: JobPosting;
  match: JobMatchRow;
  expandedSections: string[];
  toggleSection: (section: string) => void;
}) {
  const matchedSkills = (match.match_reasons ?? [])
    .find((r) => r.startsWith("Matching skills:"))
    ?.replace("Matching skills:", "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean) ?? [];

  const missingSkills = match.missing_skills ?? [];

  const skills = [
    ...matchedSkills.map((name) => ({ name, matched: true })),
    ...missingSkills.map((name) => ({ name, matched: false })),
  ];

  return (
    <div className="p-6">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-14 h-14 border border-stone-800 bg-stone-900 flex items-center justify-center text-stone-200 font-bold text-xl shrink-0 font-mono">
          {job.company.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-stone-100 font-mono">{job.role}</h1>
          <p className="text-stone-400">{job.company}</p>
          <div className="flex items-center gap-3 mt-2 text-sm text-stone-500 font-mono">
            {job.location && <span>{job.location}</span>}
            <span>{getRelativeTime(job.date_posted ?? job.created_at)}</span>
          </div>
        </div>
      </div>

      <a
        href={job.url || "#"}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-orange-600/50 bg-orange-600/10 text-orange-500 font-semibold text-sm font-mono hover:bg-orange-600/20 transition-all mb-6"
      >
        <Icons.Lightning />
        Apply with Autofill
      </a>

      <div className="mb-6">
        <h2 className="text-sm font-semibold text-stone-300 mb-3 font-mono uppercase tracking-[0.2em] text-[10px]">
          Job Description
        </h2>
        <div className="text-sm text-stone-400 leading-relaxed space-y-3">
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

      <AccordionSection
        title="Skills Checklist"
        isExpanded={expandedSections.includes("skills")}
        onToggle={() => toggleSection("skills")}
      >
        <div className="grid grid-cols-2 gap-2">
          {skills.map((skill) => (
            <div
              key={skill.name}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-mono ${
                skill.matched
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-stone-800 text-stone-500"
              }`}
            >
              {skill.matched ? (
                <span className="text-emerald-400">
                  <Icons.Check />
                </span>
              ) : (
                <span className="w-4 h-4 border border-stone-600" />
              )}
              {skill.name}
            </div>
          ))}
        </div>
      </AccordionSection>
    </div>
  );
}
