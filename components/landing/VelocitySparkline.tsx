"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";
import type { LandingTrustStats } from "@/lib/dashboard";
import { LANDING_COPY } from "./copy";

interface VelocitySparklineProps {
  velocity7d: LandingTrustStats["velocity7d"];
}

export function VelocitySparkline({ velocity7d }: VelocitySparklineProps) {
  const data = velocity7d.daily.map((d) => ({ date: d.date, count: d.count }));

  return (
    <div>
      <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-fg-muted mb-4">
        {LANDING_COPY.trust.velocity.title}
      </h3>
      <div className="h-20 w-full">
        {data.length === 0 ? (
          <div className="h-full w-full border border-dashed border-line-subtle grid place-items-center">
            <span className="font-mono text-[10px] text-fg-subtle">
              building history…
            </span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="velocityFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(var(--brand-info))" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="rgb(var(--brand-info))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip
                cursor={{ stroke: "rgb(var(--border-color))", strokeDasharray: "2 2" }}
                contentStyle={{
                  background: "rgb(var(--bg-primary))",
                  border: "1px solid rgb(var(--border-color))",
                  fontSize: 11,
                  fontFamily: "var(--font-dm-mono), monospace",
                  padding: "4px 8px",
                }}
                labelStyle={{ color: "rgb(var(--text-muted))", fontSize: 10 }}
                formatter={(value) => [`${String(value)} new`, "count"]}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="rgb(var(--brand-info))"
                strokeWidth={1.5}
                fill="url(#velocityFill)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
      <p className="mt-3 font-mono text-[10px] text-fg-subtle">
        {LANDING_COPY.trust.velocity.caption(velocity7d.newThisWeek)}
      </p>
    </div>
  );
}
