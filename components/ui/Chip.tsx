import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ChipVariant = "neutral" | "info" | "ai" | "active";

const baseStyles =
  "inline-flex items-center gap-1 text-[10px] px-2 py-0.5 tracking-wide lowercase transition-colors";

export const chipVariants: Record<ChipVariant, string> = {
  neutral:
    "font-mono border border-stone-700 bg-transparent text-stone-400 hover:border-stone-600",
  info:
    "font-mono border border-cyan-500/40 bg-brand-info-tint text-cyan-300 hover:border-cyan-500/70",
  ai:
    "font-mono border border-violet-500/40 bg-brand-ai-tint text-violet-300 hover:border-violet-500/70",
  active:
    "font-mono border border-orange-600/40 bg-brand-primary-tint text-orange-400 hover:border-orange-600/70",
};

interface ChipBaseProps {
  variant?: ChipVariant;
  children: ReactNode;
  className?: string;
}

type ChipSpanProps = ChipBaseProps &
  Omit<HTMLAttributes<HTMLSpanElement>, "className" | "children"> & {
    as?: "span";
  };
type ChipButtonProps = ChipBaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & {
    as: "button";
  };
export type ChipProps = ChipSpanProps | ChipButtonProps;

export function Chip({
  variant = "neutral",
  className,
  children,
  as,
  ...props
}: ChipProps) {
  const classes = cn(baseStyles, chipVariants[variant], className);
  if (as === "button") {
    return (
      <button
        className={classes}
        {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}
      >
        {children}
      </button>
    );
  }
  return (
    <span
      className={classes}
      {...(props as HTMLAttributes<HTMLSpanElement>)}
    >
      {children}
    </span>
  );
}
