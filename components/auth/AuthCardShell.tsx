import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AuthCardShellProps = {
  children: ReactNode;
  className?: string;
};

export function AuthCardShell({ children, className }: AuthCardShellProps) {
  return (
    <div className={cn("w-full max-w-md", className)}>
      <div className="relative overflow-hidden border border-stone-200 bg-white/95 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur dark:border-stone-800 dark:bg-stone-950/90 dark:shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-500/60 to-transparent" />
        <div className="px-6 py-5">
          {children}
        </div>
      </div>
    </div>
  );
}
