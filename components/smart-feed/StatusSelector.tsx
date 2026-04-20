"use client";

import { useRef, useEffect, useState } from "react";
import type { PipelineStatus } from "@/hooks/useJobPipeline";

interface StatusSelectorProps {
  status: PipelineStatus | null;
  onChange: (status: PipelineStatus) => void;
  onRemove?: () => void;
}

const OPTIONS: { value: PipelineStatus; label: string }[] = [
  { value: "saved", label: "Saved" },
  { value: "applied", label: "Applied" },
  { value: "interview", label: "Interview" },
  { value: "offer", label: "Offer" },
  { value: "rejected", label: "Rejected" },
];

const COLORS: Record<PipelineStatus, string> = {
  saved: "text-fg-muted bg-surface-sunken border-line",
  applied:
    "text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border-green-600/40",
  interview:
    "text-orange-700 dark:text-orange-400 bg-orange-600/10 border-orange-600/40",
  offer:
    "text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/30 border-violet-600/40",
  rejected: "text-fg-subtle bg-surface-sunken border-line line-through",
};

export function StatusSelector({ status, onChange, onRemove }: StatusSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  const active = status ?? "saved";
  const activeLabel = OPTIONS.find((o) => o.value === active)?.label ?? "Saved";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={[
          "inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.15em] border px-2 py-1 leading-none transition-colors",
          COLORS[active],
        ].join(" ")}
      >
        <span>{activeLabel}</span>
        <span className="opacity-60">▾</span>
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-30 bg-surface-raised border border-line min-w-[140px]">
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={[
                "block w-full text-left px-3 py-2 font-mono text-[11px] transition-colors",
                opt.value === active
                  ? "bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400"
                  : "text-fg-muted hover:bg-surface-sunken/60 hover:text-fg",
              ].join(" ")}
            >
              {opt.value === active && <span className="mr-1.5">✓</span>}
              {opt.label}
            </button>
          ))}
          {onRemove && (
            <button
              type="button"
              onClick={() => {
                onRemove();
                setOpen(false);
              }}
              className="block w-full text-left px-3 py-2 font-mono text-[11px] border-t border-line-subtle text-fg-subtle hover:bg-surface-sunken/60 hover:text-red-500 transition-colors"
            >
              remove from pipeline
            </button>
          )}
        </div>
      )}
    </div>
  );
}
