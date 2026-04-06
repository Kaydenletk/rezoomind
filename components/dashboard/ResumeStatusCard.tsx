"use client";

import { FileText, RefreshCw } from "lucide-react";

interface ResumeStatusCardProps {
  keywords: string[];
  parsedAt: string | null;
  onReUpload: () => void;
  matchLoading?: boolean;
}

export function ResumeStatusCard({ keywords, parsedAt, onReUpload, matchLoading }: ResumeStatusCardProps) {
  const topSkills = keywords.slice(0, 8);
  const remaining = keywords.length - topSkills.length;

  return (
    <div className="border-[1.5px] border-stone-200 dark:border-stone-800 rounded-[10px] p-5 bg-white dark:bg-stone-900 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <span className="text-green-500 font-mono text-xs font-bold">▸</span>
          <span className="font-mono text-[11px] font-bold text-stone-500 dark:text-stone-400">
            resume_loaded
          </span>
        </div>
        <button
          onClick={onReUpload}
          className="flex items-center gap-1 text-[10px] text-stone-400 hover:text-orange-500 font-mono transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          re-upload
        </button>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded bg-green-600/10 border border-green-600/20 flex items-center justify-center">
          <FileText className="w-4 h-4 text-green-500" />
        </div>
        <div>
          <p className="text-[11px] font-mono text-stone-700 dark:text-stone-300 font-medium">
            Resume active
          </p>
          {parsedAt && (
            <p className="text-[9px] text-stone-400 font-mono">
              parsed {new Date(parsedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-2">
        {topSkills.map((skill) => (
          <span
            key={skill}
            className="px-2 py-0.5 bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 rounded text-[10px] border border-orange-100 dark:border-orange-900/40"
          >
            {skill}
          </span>
        ))}
        {remaining > 0 && (
          <span className="px-2 py-0.5 text-[10px] text-stone-400">
            +{remaining} more
          </span>
        )}
      </div>

      {matchLoading ? (
        <p className="text-[10px] text-orange-400 font-mono mt-1 animate-pulse">
          ⋯ computing match scores...
        </p>
      ) : (
        <p className="text-[10px] text-stone-400 font-mono mt-1">
          ✦ match scores active on all jobs below
        </p>
      )}
    </div>
  );
}
