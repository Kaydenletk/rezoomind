"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, Legend, Tooltip,
} from "recharts";

interface TrendPoint {
  date: string;
  usaInternships: number;
  usaNewGrad: number;
  intlInternships: number;
  intlNewGrad: number;
}

interface Props {
  trend: TrendPoint[];
}

const LINES = [
  { key: "usaInternships", color: "#3b82f6", label: "USA Internships" },
  { key: "usaNewGrad", color: "#22c55e", label: "USA New Grad" },
  { key: "intlInternships", color: "#a855f7", label: "Intl Internships" },
  { key: "intlNewGrad", color: "#ef4444", label: "Intl New Grad" },
] as const;

type Period = "3M" | "6M" | "ALL";

export function MarketBanner({ trend }: Props) {
  const [open, setOpen] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [period, setPeriod] = useState<Period>("ALL");

  const filteredTrend = (() => {
    if (period === "ALL") return trend;
    const now = new Date();
    const months = period === "3M" ? 3 : 6;
    const cutoff = new Date(now.getFullYear(), now.getMonth() - months, now.getDate());
    const cutoffStr = cutoff.toISOString().split("T")[0];
    return trend.filter((t) => t.date >= cutoffStr);
  })();

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
        show market trend
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
          Software Engineering College Job Market
          {!open && <span className="text-stone-400 dark:text-stone-500 ml-1">· click to expand</span>}
        </button>

        {/* Period toggles */}
        <div className="flex items-center gap-1 ml-auto mr-3">
          {(["3M", "6M", "ALL"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                period === p
                  ? "bg-orange-600 text-white"
                  : "text-stone-400 hover:text-stone-600 border border-stone-200 dark:border-stone-700"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

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
          <div className="border-[1.5px] border-stone-200 dark:border-stone-800 rounded-[10px] bg-white dark:bg-stone-900 p-4 overflow-hidden">
            {trend.length === 0 ? (
              <div className="flex items-center justify-center h-[140px] text-stone-400 dark:text-stone-500 text-xs font-mono">
                Collecting data — chart will build over time as daily snapshots accumulate.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={filteredTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 9, fill: "#a8a29e" }}
                    tickFormatter={(d: string) => {
                      const dt = new Date(d + "T00:00:00Z");
                      return dt.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }) + " '" + String(dt.getUTCFullYear()).slice(2);
                    }}
                  />
                  <YAxis tick={{ fontSize: 9, fill: "#a8a29e" }} width={36} />
                  <Tooltip
                    contentStyle={{
                      fontSize: 11,
                      borderRadius: 8,
                      border: "1.5px solid #e7e5e4",
                      fontFamily: "monospace",
                    }}
                  />
                  {LINES.map((line) => (
                    <Line
                      key={line.key}
                      type="monotone"
                      dataKey={line.key}
                      stroke={line.color}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
                  <Legend
                    formatter={(value: string) => {
                      const line = LINES.find((l) => l.key === value);
                      return <span style={{ fontSize: 10, color: "#78716c" }}>{line?.label ?? value}</span>;
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
            <div className="text-[9px] text-stone-400 dark:text-stone-500 font-mono text-right mt-1">
              source: SimplifyJobs · {filteredTrend.length} data point{filteredTrend.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
