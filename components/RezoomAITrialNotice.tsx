"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";

type RezoomAITrialNoticeProps = {
  isAuthenticated: boolean;
  remainingGuestCredits: number;
  requiresLogin: boolean;
  loginHref: string;
  encouragement: string;
  className?: string;
  theme?: "dark" | "light";
};

export function RezoomAITrialNotice({
  isAuthenticated,
  remainingGuestCredits,
  requiresLogin,
  loginHref,
  encouragement,
  className,
  theme = "dark",
}: RezoomAITrialNoticeProps) {
  if (isAuthenticated) {
    return null;
  }

  const palette =
    theme === "dark"
      ? "border border-orange-600/20 bg-orange-600/10 text-orange-100"
      : "border border-orange-600/30 bg-orange-600/5 text-stone-300";

  return (
    <div className={cn("px-3 py-2 text-xs leading-relaxed", palette, className)}>
      <div className="flex items-center justify-between gap-3">
        <span className="font-semibold uppercase tracking-[0.18em]">
          {requiresLogin ? "Login to continue" : `${remainingGuestCredits}/5 free tries left`}
        </span>
        <Link
          href={loginHref}
          className={cn(
            "px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] transition",
            theme === "dark"
              ? "border border-orange-600/50 bg-orange-600/10 text-orange-400 hover:bg-orange-600/20"
              : "border border-stone-700 bg-stone-900 text-stone-100 hover:bg-stone-800"
          )}
        >
          Log in
        </Link>
      </div>
      <p className="mt-1">{encouragement}</p>
    </div>
  );
}
