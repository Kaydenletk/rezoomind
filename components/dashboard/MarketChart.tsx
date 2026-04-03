"use client";

import { useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface TrendPoint {
  date: string;
  usaInternships: number;
  usaNewGrad: number;
  intlInternships: number;
  intlNewGrad: number;
}

interface Props {
  data: TrendPoint[];
}

type Period = "3M" | "6M" | "ALL";

const LINES = [
  { key: "usaInternships", color: "#3b82f6", label: "USA Internships" },
  { key: "usaNewGrad", color: "#22c55e", label: "USA New Grad" },
  { key: "intlInternships", color: "#a855f7", label: "Intl Internships" },
  { key: "intlNewGrad", color: "#ef4444", label: "Intl New Grad" },
] as const;

function filterByPeriod(data: TrendPoint[], period: Period): TrendPoint[] {
  if (period === "ALL") return data;
  const now = new Date();
  const months = period === "3M" ? 3 : 6;
  const cutoff = new Date(now.getFullYear(), now.getMonth() - months, 1);
  return data.filter((d) => new Date(d.date) >= cutoff);
}

export function MarketChart({ data }: Props) {
  const [period, setPeriod] = useState<Period>("ALL");
  const filtered = useMemo(() => filterByPeriod(data, period), [data, period]);

  if (data.length === 0) {
    return (
      <div className="border-[1.5px] border-stone-200 rounded-[10px] p-6 bg-white mx-7">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-orange-600 font-mono text-[13px]">▸</span>
          <span className="font-mono text-[15px] font-bold text-stone-950">Software Engineering College Job Market</span>
        </div>
        <div className="flex items-center justify-center h-[200px] text-stone-400 text-sm">
          Collecting data... Chart will populate as daily snapshots accumulate.
        </div>
      </div>
    );
  }

  return (
    <div id="insights" className="border-[1.5px] border-stone-200 rounded-[10px] p-6 bg-white mx-7">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="text-orange-600 font-mono text-[13px]">▸</span>
          <span className="font-mono text-[15px] font-bold text-stone-950">Software Engineering College Job Market</span>
        </div>
        <div className="flex gap-1">
          {(["3M", "6M", "ALL"] as Period[]).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={`text-[10px] px-2.5 py-1 rounded font-semibold transition-colors ${period === p ? "bg-orange-600 text-white" : "border border-stone-200 text-stone-400 hover:text-stone-600"}`}>
              {p}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={filtered}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#a8a29e" }} tickFormatter={(d: string) => { const date = new Date(d); return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" }); }} />
          <YAxis tick={{ fontSize: 10, fill: "#a8a29e" }} width={40} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1.5px solid #e7e5e4" }} />
          {LINES.map((line) => (
            <Line key={line.key} type="monotone" dataKey={line.key} stroke={line.color} strokeWidth={2} dot={{ r: 3, fill: "white", stroke: line.color, strokeWidth: 2 }} activeDot={{ r: 5 }} />
          ))}
          <Legend formatter={(value: string) => { const line = LINES.find((l) => l.key === value); return <span style={{ color: "#44403c", fontSize: 11 }}>{line?.label ?? value}</span>; }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
