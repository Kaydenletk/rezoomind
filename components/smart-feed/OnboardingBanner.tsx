"use client";

import { useState } from "react";
import Link from "next/link";

interface OnboardingBannerProps {
  onDismiss?: () => void;
}

export function OnboardingBanner({ onDismiss }: OnboardingBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  function handleDismiss() {
    setDismissed(true);
    onDismiss?.();
  }

  return (
    <div className="mx-4 my-3 border border-orange-200 dark:border-orange-800/60 bg-orange-50 dark:bg-orange-950/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <p className="font-mono text-xs font-semibold text-orange-700 dark:text-orange-400 tracking-wide">
            ⚡ unlock your personal feed
          </p>
          <ul className="space-y-1">
            {[
              "AI match scores ranked for your resume",
              "Streaming explanation of why each job fits",
              "One-click cover letter generator",
            ].map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 font-mono text-[11px] text-orange-800 dark:text-orange-300"
              >
                <span className="text-orange-400 mt-px shrink-0">▸</span>
                {item}
              </li>
            ))}
          </ul>
          <Link
            href="/resume"
            className="inline-block mt-1 border border-orange-600/60 bg-orange-600/10 hover:bg-orange-600/20 text-orange-700 dark:text-orange-400 font-mono text-[11px] px-4 py-1.5 transition-colors"
          >
            upload resume →
          </Link>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="shrink-0 text-orange-400 hover:text-orange-600 dark:hover:text-orange-300 font-mono text-sm transition-colors"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
