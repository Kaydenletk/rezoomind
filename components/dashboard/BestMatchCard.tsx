"use client";

import { MatchScoreRing } from "./MatchScoreRing";

export interface TopMatch {
  matchScore: number;
  skillsMatch: number;
  experienceMatch: number;
  matchReasons: string[];
  missingSkills: string[];
  job: {
    id: string;
    company: string;
    role: string;
    location: string | null;
    url: string | null;
    description: string | null;
  };
}

interface BestMatchCardProps {
  topMatch: TopMatch;
  onTailorClick: () => void;
}

export function BestMatchCard({ topMatch, onTailorClick }: BestMatchCardProps) {
  // Parse matched skills from reasons like "Matching skills: react, typescript, node.js"
  const matchedSkills =
    topMatch.matchReasons
      .find((r) => r.startsWith("Matching skills:"))
      ?.replace("Matching skills:", "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean) ?? [];

  const missingSkills = topMatch.missingSkills.slice(0, 6);

  return (
    <div className="border border-stone-800 border-l-[3px] border-l-orange-600 bg-stone-900 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-orange-600 font-mono text-xs font-bold">▸</span>
          <span className="font-mono text-[11px] font-bold text-stone-400">
            best_match
          </span>
        </div>
        {topMatch.job.url && (
          <a
            href={topMatch.job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-orange-600 font-semibold font-mono hover:underline"
          >
            view_job →
          </a>
        )}
      </div>

      {/* Main content: info left, score ring right */}
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          {/* Job info */}
          <p className="text-sm font-bold font-mono text-stone-50 truncate">
            {topMatch.job.company}
          </p>
          <p className="text-xs text-stone-300 truncate mt-0.5">
            {topMatch.job.role}
          </p>
          {topMatch.job.location && (
            <p className="text-[11px] text-stone-500 truncate mt-0.5">
              {topMatch.job.location}
            </p>
          )}

          {/* Progress bars */}
          <div className="mt-3 space-y-1.5">
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] uppercase tracking-[0.2em] text-stone-500 font-mono">
                  Skills
                </span>
                <span className="text-[10px] text-stone-500 font-mono">
                  {topMatch.skillsMatch}%
                </span>
              </div>
              <div className="h-1 bg-stone-800 w-full">
                <div
                  className="h-1 bg-purple-500 transition-all duration-700"
                  style={{ width: `${topMatch.skillsMatch}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] uppercase tracking-[0.2em] text-stone-500 font-mono">
                  Experience
                </span>
                <span className="text-[10px] text-stone-500 font-mono">
                  {topMatch.experienceMatch}%
                </span>
              </div>
              <div className="h-1 bg-stone-800 w-full">
                <div
                  className="h-1 bg-orange-500 transition-all duration-700"
                  style={{ width: `${topMatch.experienceMatch}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Score ring */}
        <MatchScoreRing score={topMatch.matchScore} size={64} />
      </div>

      {/* Keywords */}
      {(matchedSkills.length > 0 || missingSkills.length > 0) && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {matchedSkills.slice(0, 6).map((skill) => (
            <span
              key={skill}
              className="px-2 py-0.5 text-[10px] font-mono bg-green-950/40 text-green-400 border border-green-900/50"
            >
              ✓ {skill}
            </span>
          ))}
          {missingSkills.map((skill) => (
            <span
              key={skill}
              className="px-2 py-0.5 text-[10px] font-mono bg-red-950/30 text-red-400 border border-red-900/40 opacity-80"
            >
              ✗ {skill}
            </span>
          ))}
        </div>
      )}

      {/* Tailor button */}
      <button
        onClick={onTailorClick}
        className="mt-3 border border-orange-600/50 bg-orange-600/10 text-orange-500 font-mono text-xs font-bold px-4 py-2 hover:bg-orange-600/20 transition-colors w-full"
      >
        ✦ Tailor with AI
      </button>
    </div>
  );
}
