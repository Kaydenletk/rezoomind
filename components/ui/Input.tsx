"use client";

import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "w-full bg-transparent border-0 border-b border-stone-800 rounded-none px-0 py-2 text-sm text-stone-200 placeholder:text-stone-600 transition focus:border-orange-600 focus:outline-none focus:ring-0 font-mono",
        className
      )}
      {...props}
    />
  );
}
