'use client';

import { useState } from 'react';
import { useStreamingText } from '@/hooks/useStreamingText';

type CoverLetterTone = 'professional' | 'enthusiastic' | 'creative' | 'technical';

interface CoverLetterStreamProps {
  resumeText: string;
  jobTitle: string;
  companyName: string;
  jobDescription: string;
  companyInfo?: string;
  defaultTone?: CoverLetterTone;
}

export function CoverLetterStream({
  resumeText,
  jobTitle,
  companyName,
  jobDescription,
  companyInfo,
  defaultTone = 'professional',
}: CoverLetterStreamProps) {
  const [tone, setTone] = useState<CoverLetterTone>(defaultTone);
  const [copied, setCopied] = useState(false);

  const { text, isLoading, error, trigger, stop, reset } = useStreamingText(
    '/api/resume/cover-letter/stream',
    {
      onFinish: () => setCopied(false),
    }
  );

  const handleGenerate = () => {
    reset();
    setCopied(false);
    trigger({
      resumeText,
      jobTitle,
      companyName,
      jobDescription,
      companyInfo,
      tone,
    });
  };

  const handleCopy = async () => {
    if (text) {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const toneOptions: { value: CoverLetterTone; label: string }[] = [
    { value: 'professional', label: 'Professional' },
    { value: 'enthusiastic', label: 'Enthusiastic' },
    { value: 'creative', label: 'Creative' },
    { value: 'technical', label: 'Technical' },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400">
          Cover Letter Generator
        </span>
        <div className="flex items-center gap-2">
          {text && !isLoading && (
            <button
              onClick={handleCopy}
              className="text-[10px] uppercase tracking-[0.2em] text-orange-600 hover:text-orange-500 dark:text-orange-500"
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          )}
          {isLoading && (
            <button
              onClick={stop}
              className="text-[10px] uppercase tracking-[0.2em] text-red-500 hover:text-red-400"
            >
              Stop
            </button>
          )}
        </div>
      </div>

      {/* Tone selector */}
      <div className="flex gap-2">
        {toneOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setTone(option.value)}
            disabled={isLoading}
            className={`border px-3 py-1.5 font-mono text-xs transition-colors ${
              tone === option.value
                ? 'border-orange-600/50 bg-orange-600/10 text-orange-600 dark:text-orange-500'
                : 'border-stone-200 text-stone-500 hover:border-stone-300 hover:text-stone-700 dark:border-stone-700 dark:text-stone-400 dark:hover:border-stone-600'
            } ${isLoading ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Content area */}
      <div className="min-h-[200px] max-h-[400px] overflow-y-auto rounded border border-stone-200 bg-stone-50 p-4 font-mono text-sm leading-relaxed text-stone-700 dark:border-stone-800 dark:bg-stone-900/50 dark:text-stone-300">
        {error ? (
          <div className="text-red-500">
            <span className="mr-2">✗</span>
            {error.message}
          </div>
        ) : text ? (
          <div className="whitespace-pre-wrap">
            {text}
            {isLoading && (
              <span className="ml-1 inline-block h-4 w-2 animate-pulse bg-orange-500" />
            )}
          </div>
        ) : isLoading ? (
          <div className="flex items-center gap-2 text-stone-400">
            <span className="animate-pulse">⋯</span>
            Crafting your cover letter...
          </div>
        ) : (
          <div className="text-stone-400">
            Select a tone and click "Generate" to create a tailored cover letter
          </div>
        )}
      </div>

      {/* Generate button */}
      {!isLoading && (
        <button
          onClick={handleGenerate}
          className="w-full border border-orange-600/50 bg-orange-600/10 px-4 py-2 font-mono text-sm text-orange-600 transition-colors hover:bg-orange-600/20 dark:text-orange-500"
        >
          {text ? '↻ Regenerate' : '▸ Generate Cover Letter'}
        </button>
      )}
    </div>
  );
}
