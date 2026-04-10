import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const authCardTitleClassName =
  "text-xl font-semibold tracking-[-0.02em] text-stone-950 dark:text-stone-100";

export const authCardSubtitleClassName =
  "mt-2 max-w-sm text-sm leading-6 text-stone-600 dark:text-stone-400";

export const authFieldLabelClassName =
  "block text-[11px] font-medium uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400";

export const authInputClassName =
  "w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-500/10 placeholder:text-stone-400 dark:border-stone-800 dark:bg-stone-900/70 dark:text-stone-100 dark:focus:border-orange-500 dark:focus:bg-stone-950 dark:focus:ring-orange-500/20 dark:placeholder:text-stone-500";

export const authStatusClassName =
  "rounded-xl border px-3 py-2 text-sm transition-colors";

export const authStatusToneClassNames = {
  success:
    "border-emerald-200 bg-emerald-50/80 text-emerald-800 dark:border-emerald-900/80 dark:bg-emerald-950/40 dark:text-emerald-300",
  error:
    "border-red-200 bg-red-50/80 text-red-700 dark:border-red-950/80 dark:bg-red-950/40 dark:text-red-300",
  neutral:
    "border-stone-200 bg-stone-50/80 text-stone-600 dark:border-stone-800 dark:bg-stone-900/60 dark:text-stone-300",
} as const;

export const authPrimaryButtonClassName =
  "group flex w-full items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(234,88,12,0.18)] transition hover:border-orange-300 hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-orange-500/70 dark:bg-orange-500 dark:hover:bg-orange-400";

export const authSecondaryButtonClassName =
  "w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-medium text-stone-700 transition hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-900/70 dark:text-stone-200 dark:hover:bg-stone-900";

export const authFooterClassName =
  "border-t border-stone-200/80 pt-4 text-center text-sm text-stone-600 dark:border-stone-800/80 dark:text-stone-400";

export const authInlineLinkClassName =
  "font-medium text-orange-600 transition-colors hover:text-orange-500 dark:text-orange-400 dark:hover:text-orange-300";

type AuthCardShellProps = {
  children: ReactNode;
  className?: string;
};

export function AuthCardShell({ children, className }: AuthCardShellProps) {
  return (
    <div className={cn("w-full max-w-md", className)}>
      <div className="relative overflow-hidden rounded-[28px] border border-stone-200 bg-white/95 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur dark:border-stone-800 dark:bg-stone-950/90 dark:shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-500/60 to-transparent" />
        <div className="px-6 py-6 sm:px-7">{children}</div>
      </div>
    </div>
  );
}
