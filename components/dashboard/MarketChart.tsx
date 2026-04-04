"use client";

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";

interface Props {
  swe: number;
  pm: number;
  dsml: number;
  quant: number;
  hardware: number;
  total: number;
}

const CATEGORIES = [
  { key: "swe", label: "SWE", emoji: "💻", color: "#3b82f6" },
  { key: "dsml", label: "DS/ML", emoji: "🤖", color: "#a855f7" },
  { key: "hardware", label: "Hardware", emoji: "🔧", color: "#f97316" },
  { key: "pm", label: "PM", emoji: "📱", color: "#22c55e" },
  { key: "quant", label: "Quant", emoji: "📈", color: "#ef4444" },
] as const;

export function MarketChart(props: Props) {
  const data = CATEGORIES.map((c) => ({
    name: c.label,
    value: props[c.key],
    color: c.color,
    emoji: c.emoji,
  })).sort((a, b) => b.value - a.value);

  return (
    <div className="border-[1.5px] border-stone-200 dark:border-stone-800 rounded-[10px] p-4 bg-white dark:bg-stone-900">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <span className="text-orange-600 font-mono text-xs">▸</span>
          <span className="font-mono text-xs font-bold text-stone-950 dark:text-stone-50">roles_breakdown</span>
        </div>
        <span className="text-[10px] text-stone-400 font-mono tabular-nums">{props.total} total</span>
      </div>

      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 4, top: 4, bottom: 0 }}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            width={52}
            tick={{ fontSize: 10, fill: "#a8a29e" }}
            axisLine={false}
            tickLine={false}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={14}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend with counts */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
        {data.map((d) => (
          <span key={d.name} className="text-[9px] text-stone-500 dark:text-stone-400 font-mono">
            {d.emoji} {d.value}
          </span>
        ))}
      </div>
    </div>
  );
}
