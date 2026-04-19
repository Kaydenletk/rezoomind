"use client";

import { motion } from "framer-motion";

interface MatchScoreRingProps {
  score: number | null;
  size?: number;
  muted?: boolean;
}

export function MatchScoreRing({ score, size = 52, muted = false }: MatchScoreRingProps) {
  const strokeWidth = 3.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const wrapperClass = [
    "relative shrink-0",
    muted ? "opacity-60" : "",
  ].filter(Boolean).join(" ");

  if (score === null) {
    return (
      <div className={wrapperClass} style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            className="stroke-stone-200 dark:stroke-stone-800"
            strokeWidth={strokeWidth}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold" style={{ color: "#a8a29e" }}>
            —
          </span>
        </div>
      </div>
    );
  }

  const progress = Math.min(score, 100) / 100;
  const offset = circumference * (1 - progress);
  const color = score >= 80 ? "#ea580c" : score >= 60 ? "#f59e0b" : "#78716c";

  return (
    <div className={wrapperClass} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className="stroke-stone-200 dark:stroke-stone-800"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold" style={{ color }}>
          {score}%
        </span>
      </div>
    </div>
  );
}
