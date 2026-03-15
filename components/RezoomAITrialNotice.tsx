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
      ? "border border-teal-400/20 bg-teal-500/10 text-teal-100"
      : "border border-cyan-200 bg-cyan-50 text-slate-700";

  return (
    <div className={cn("rounded-xl px-3 py-2 text-xs leading-relaxed", palette, className)}>
      <div className="flex items-center justify-between gap-3">
        <span className="font-semibold uppercase tracking-[0.18em]">
          {requiresLogin ? "Login to continue" : `${remainingGuestCredits}/5 free tries left`}
        </span>
        <Link
          href={loginHref}
          className={cn(
            "rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] transition",
            theme === "dark"
              ? "bg-white text-slate-900 hover:bg-slate-100"
              : "bg-slate-900 text-white hover:bg-slate-800"
          )}
        >
          Log in
        </Link>
      </div>
      <p className="mt-1">{encouragement}</p>
    </div>
  );
}
