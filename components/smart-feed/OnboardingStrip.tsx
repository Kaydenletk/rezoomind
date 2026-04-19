"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FEED_COPY } from "./copy";

interface OnboardingStripProps {
  hasResume: boolean;
  hasInterest: boolean;
  hasFirstAction: boolean;
  onStepClick?: (step: 1 | 2 | 3) => void;
}

const DISMISS_KEY = "onboarding_dismissed";

export function OnboardingStrip({
  hasResume,
  hasInterest,
  hasFirstAction,
  onStepClick,
}: OnboardingStripProps) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setDismissed(window.sessionStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  const allDone = hasResume && hasInterest && hasFirstAction;
  if (allDone || dismissed) return null;

  const steps = [
    { n: 1 as const, label: FEED_COPY.onboarding.step1, done: hasResume },
    { n: 2 as const, label: FEED_COPY.onboarding.step2, done: hasInterest },
    { n: 3 as const, label: FEED_COPY.onboarding.step3, done: hasFirstAction },
  ];

  function handleDismiss() {
    window.sessionStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }

  return (
    <div className="px-5 py-2 border-b border-line bg-surface-sunken/60 flex items-center gap-5 flex-wrap">
      <span className="text-[10px] uppercase tracking-[0.2em] text-fg-subtle font-mono">
        ╭─ {FEED_COPY.onboarding.title}
      </span>
      {steps.map((s) => {
        const content = (
          <span
            className={[
              "font-mono text-[11px]",
              s.done
                ? "text-status-success line-through"
                : "text-orange-700 dark:text-orange-400 hover:text-orange-600",
            ].join(" ")}
          >
            [{s.done ? "✓" : " "}] {s.label}
          </span>
        );

        if (s.done) return <span key={s.n}>{content}</span>;

        if (s.n === 1) {
          return (
            <Link key={s.n} href="/resume" className="cursor-pointer">
              {content}
            </Link>
          );
        }

        return (
          <button
            key={s.n}
            type="button"
            onClick={() => onStepClick?.(s.n)}
            className="cursor-pointer"
          >
            {content}
          </button>
        );
      })}

      <button
        type="button"
        onClick={handleDismiss}
        className="ml-auto text-fg-subtle hover:text-fg-muted font-mono text-xs"
        aria-label="Dismiss onboarding"
      >
        ×
      </button>
    </div>
  );
}
