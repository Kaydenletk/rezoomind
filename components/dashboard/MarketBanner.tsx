"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";

export function MarketBanner() {
  const [open, setOpen] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("market-banner");
    if (stored === "dismissed") setDismissed(true);
    if (stored === "closed") setOpen(false);
  }, []);

  function toggle() {
    const next = !open;
    setOpen(next);
    localStorage.setItem("market-banner", next ? "open" : "closed");
  }

  function dismiss() {
    setDismissed(true);
    localStorage.setItem("market-banner", "dismissed");
  }

  // Fully dismissed — just a tiny "show chart" link
  if (dismissed) {
    return (
      <button
        onClick={() => {
          setDismissed(false);
          setOpen(true);
          localStorage.setItem("market-banner", "open");
        }}
        className="flex items-center gap-1.5 px-5 lg:px-7 py-1.5 text-[10px] font-mono text-stone-400 hover:text-orange-600 transition-colors"
      >
        <ChevronDown className="w-3 h-3" />
        show market chart
      </button>
    );
  }

  return (
    <div className="border-b border-stone-200 dark:border-stone-800">
      {/* Toggle bar */}
      <div className="flex items-center justify-between px-5 lg:px-7 py-2">
        <button
          onClick={toggle}
          className="flex items-center gap-1.5 font-mono text-[11px] text-stone-500 dark:text-stone-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
        >
          {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          <span className="text-orange-600 font-bold">▸</span>
          job_market
          {!open && <span className="text-stone-400 dark:text-stone-500 ml-1">· click to expand</span>}
        </button>
        <button
          onClick={dismiss}
          className="text-stone-300 dark:text-stone-600 hover:text-stone-500 dark:hover:text-stone-400 transition-colors"
          aria-label="Dismiss chart"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Chart — collapsible */}
      {open && (
        <div className="px-5 lg:px-7 pb-4">
          <div className="border-[1.5px] border-stone-200 dark:border-stone-800 rounded-[10px] bg-white dark:bg-stone-900 p-3 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://www.speedyapply.com/api/jobs/chart"
              alt="Software Engineering College Job Market trends"
              className="w-full rounded-lg"
              loading="lazy"
            />
            <div className="flex items-center justify-between mt-2 px-1">
              <span className="text-[9px] text-stone-400 dark:text-stone-500 font-mono">
                source: speedyapply.com · USA & International · Intern + New Grad
              </span>
              <button
                onClick={toggle}
                className="text-[9px] font-mono text-stone-400 hover:text-orange-600 transition-colors"
              >
                collapse ↑
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
