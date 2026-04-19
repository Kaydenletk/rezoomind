'use client';

import { useEffect } from 'react';
import { useStreamingText } from '@/hooks/useStreamingText';

interface MatchExplanationStreamProps {
  jobTitle: string;
  companyName: string;
  overallScore: number;
  skillMatch: number;
  experienceMatch: number;
  matchingSkills: string[];
  missingSkills: string[];
  resumeYears?: number;
  requiredYears?: number;
  autoStart?: boolean;
  compact?: boolean;
}

export function MatchExplanationStream({
  jobTitle,
  companyName,
  overallScore,
  skillMatch,
  experienceMatch,
  matchingSkills,
  missingSkills,
  resumeYears,
  requiredYears,
  autoStart = false,
  compact = false,
}: MatchExplanationStreamProps) {
  const { text, isLoading, error, trigger, stop, reset } = useStreamingText(
    '/api/matches/explain/stream'
  );

  const requestBody = {
    jobTitle,
    companyName,
    overallScore,
    skillMatch,
    experienceMatch,
    matchingSkills,
    missingSkills,
    resumeYears,
    requiredYears,
  };

  useEffect(() => {
    if (autoStart && !text && !isLoading) {
      trigger(requestBody);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  const handleExplain = () => {
    reset();
    trigger(requestBody);
  };

  if (compact) {
    return (
      <div className="border-t border-line-subtle pt-3 mt-3 font-mono text-xs text-fg-muted leading-relaxed">
        {error ? (
          <div className="text-red-500">
            <span className="mr-2">✗</span>
            {error.message}
          </div>
        ) : text ? (
          <>
            <span className="text-[10px] uppercase tracking-[0.2em] text-fg-subtle block mb-1.5">
              AI Analysis
            </span>
            {text}
            {isLoading && (
              <span className="ml-1 inline-block h-3 w-1.5 animate-pulse bg-orange-500 align-middle" />
            )}
          </>
        ) : isLoading ? (
          <div className="flex items-center gap-2 text-fg-muted">
            <span className="animate-pulse">⋯</span>
            Analyzing match...
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.2em] text-fg-muted">AI Analysis</span>
        {isLoading && (
          <button
            onClick={stop}
            className="text-[10px] uppercase tracking-[0.2em] text-red-500 hover:text-red-400"
          >
            Stop
          </button>
        )}
      </div>

      <div className="min-h-[80px] rounded border border-line bg-surface-sunken/60 p-3 font-mono text-sm text-fg-muted">
        {error ? (
          <div className="text-red-500">
            <span className="mr-2">✗</span>
            {error.message}
          </div>
        ) : text ? (
          <>
            {text}
            {isLoading && (
              <span className="ml-1 inline-block h-4 w-2 animate-pulse bg-orange-500" />
            )}
          </>
        ) : isLoading ? (
          <div className="flex items-center gap-2 text-fg-muted">
            <span className="animate-pulse">⋯</span>
            Analyzing match...
          </div>
        ) : (
          <div className="text-fg-muted">Click "Explain Match" to see AI analysis</div>
        )}
      </div>

      {!isLoading && (
        <button
          onClick={handleExplain}
          className="w-full border border-orange-600/50 bg-orange-600/10 px-4 py-2 font-mono text-sm text-orange-600 transition-colors hover:bg-orange-600/20 dark:text-orange-500"
        >
          {text ? '↻ Regenerate' : '▸ Explain Match'}
        </button>
      )}
    </div>
  );
}
