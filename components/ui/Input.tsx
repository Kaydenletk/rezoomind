"use client";

import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 transition focus:border-cyan-300/50 focus:outline-none focus:ring-2 focus:ring-cyan-300/30",
        className
      )}
      {...props}
    />
  );
}
