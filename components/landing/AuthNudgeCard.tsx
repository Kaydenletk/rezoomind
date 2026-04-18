"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LANDING_COPY } from "./copy";

const DISMISS_KEY = "landing.authNudge.dismissed";

export function AuthNudgeCard() {
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    setHidden(sessionStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  if (hidden) return null;

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setHidden(true);
  };

  return (
    <div className="mx-4 sm:mx-7 my-2 px-4 py-3 border border-orange-600/40 bg-brand-primary-tint flex items-center justify-between gap-3">
      <Link
        href="/resume"
        className="font-mono text-label text-orange-700 dark:text-orange-400 flex items-center gap-2 flex-1"
      >
        {LANDING_COPY.authNudge.text}
        <span aria-hidden>{LANDING_COPY.authNudge.cta}</span>
      </Link>
      <button
        onClick={dismiss}
        aria-label={LANDING_COPY.authNudge.dismissLabel}
        className="font-mono text-fg-subtle hover:text-fg text-label px-2"
      >
        ×
      </button>
    </div>
  );
}
