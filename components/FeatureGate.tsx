"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

type FeatureGateProps = {
  children: ReactNode;
  className?: string;
  showOverlay?: boolean;
  title?: string;
  description?: string;
};

export function FeatureGate({
  children,
  className,
  showOverlay = true,
  title = "Track Applied & Tried jobs",
  description = "Sign in to unlock one-click tracking and reminders.",
}: FeatureGateProps) {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) return <>{children}</>;

  return (
    <div className={cn("relative", className)}>
      <div className="pointer-events-none select-none blur-sm opacity-60">
        {children}
      </div>
      {showOverlay ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 text-center shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-900">
              {title}
            </p>
            <p className="mt-1 text-xs text-slate-500">{description}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <Button href="/login" size="sm">
                Sign in
              </Button>
              <Button href="/signup" variant="secondary" size="sm">
                Create account
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
