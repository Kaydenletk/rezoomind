"use client";

import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-[rgb(var(--brand-hover-rgb))] focus:outline-none focus:ring-2 focus:ring-[var(--brand-ring)]",
        className
      )}
      {...props}
    />
  );
}
