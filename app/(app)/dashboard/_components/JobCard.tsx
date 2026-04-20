"use client";

import { motion } from "framer-motion";
import { MatchScoreRing } from "@/components/dashboard/MatchScoreRing";
import { getRelativeTime, formatSalary } from "@/lib/job-utils";
import { Icons } from "./icons";
import type { JobPosting, JobMatchRow } from "../_types";

function MatchProgressBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "orange" | "purple" | "blue";
}) {
  const colorClasses = {
    orange: "bg-orange-600",
    purple: "bg-purple-500",
    blue: "bg-blue-500",
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-stone-500 w-16 font-mono">{label}</span>
      <div className="flex-1 h-1.5 bg-stone-800 rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${colorClasses[color]} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(value, 100)}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      <span className="text-[10px] text-stone-500 w-8 text-right font-mono">{value}%</span>
    </div>
  );
}

export function JobCard({
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
  const isInternship = job.tags?.some((t) => t.toLowerCase().includes("intern"));
  const isH1B = job.tags?.some(
    (t) => t.toLowerCase().includes("h1b") || t.toLowerCase().includes("sponsor")
  );
  const isEarly = true;

  return (
    <motion.div
      onClick={onClick}
      className={`p-4 cursor-pointer transition-all ${
        isSelected
          ? "bg-stone-800/50 border-l-2 border-orange-600"
          : "hover:bg-stone-800/30 border-l-2 border-transparent"
      }`}
      whileHover={{ x: 2 }}
    >
      <div className="flex gap-4">
        <div className="w-12 h-12 border border-stone-800 bg-stone-900 flex items-center justify-center text-stone-300 font-bold text-lg shrink-0 font-mono">
          {job.company.charAt(0)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-stone-100 truncate font-mono">{job.role}</h3>
              <p className="text-sm text-stone-400">{job.company}</p>
              <span className="text-xs text-stone-500 font-mono">
                {getRelativeTime(job.date_posted ?? job.created_at)}
              </span>
            </div>
            <MatchScoreRing score={score} />
          </div>

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {job.location && (
              <span className="text-xs text-stone-500">{job.location}</span>
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

          <div className="mt-3 space-y-1.5">
            <MatchProgressBar label="Skills" value={match.skills_match ?? 0} color="purple" />
            <MatchProgressBar label="Experience" value={match.experience_match ?? 0} color="orange" />
          </div>

          <div className="flex gap-2 mt-3">
            {isH1B && (
              <span className="px-2 py-1 bg-purple-500/10 text-purple-400 text-[10px] font-medium border border-purple-500/20 font-mono">
                H1B Sponsor
              </span>
            )}
            {isEarly && (
              <span className="px-2 py-1 bg-orange-600/10 text-orange-500 text-[10px] font-medium border border-orange-600/20 font-mono">
                Early applicant
              </span>
            )}
          </div>

          <div className="flex gap-2 mt-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAutofill();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600/10 text-orange-500 text-xs font-semibold font-mono border border-orange-600/20 hover:bg-orange-600/20 transition-all"
            >
              <Icons.Lightning />
              Autofill
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTailorResume();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 text-purple-400 text-xs font-semibold font-mono border border-purple-500/20 hover:bg-purple-500/20 transition-all"
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
