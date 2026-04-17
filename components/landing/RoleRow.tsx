"use client";

import { MouseEvent, KeyboardEvent } from "react";
import { Chip } from "@/components/ui/Chip";
import { LANDING_COPY } from "./copy";

export interface LandingRole {
  id: string;
  role: string;
  company: string;
  location: string | null;
  url: string | null;
  datePosted: string | null;
  tags: string[];
}

type Tier = "apply" | "explore" | "tailor" | "skip";

function tierForScore(score: number | null): Tier | null {
  if (score === null) return null;
  if (score >= 75) return "apply";
  if (score >= 50) return "explore";
  if (score >= 30) return "tailor";
  return "skip";
}

function ringStyle(tier: Tier, score: number): React.CSSProperties {
  const colorMap: Record<Tier, string> = {
    apply: "rgb(var(--brand-primary))",
    explore: "rgb(var(--brand-info))",
    tailor: "rgb(var(--brand-ai))",
    skip: "#44403c",
  };
  return {
    background: `conic-gradient(${colorMap[tier]} 0 ${score}%, rgba(41,37,36,0.3) ${score}%)`,
  };
}

function formatAge(datePosted: string | null): string {
  if (!datePosted) return "";
  const date = new Date(datePosted);
  const hours = (Date.now() - date.getTime()) / 36e5;
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${Math.round(hours)}h`;
  const days = Math.round(hours / 24);
  return `${days}d`;
}

interface RoleRowProps {
  role: LandingRole;
  score: number | null;
  onSelect: (role: LandingRole) => void;
}

export function RoleRow({ role, score, onSelect }: RoleRowProps) {
  const tier = tierForScore(score);

  const handleRowClick = () => onSelect(role);
  const handleKey = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect(role);
    }
  };

  const stop = (e: MouseEvent) => e.stopPropagation();

  const ctaLabel =
    tier === "apply"
      ? LANDING_COPY.ctas.apply
      : tier === "tailor"
      ? LANDING_COPY.ctas.tailor
      : LANDING_COPY.ctas.explore;
  const ctaVariant =
    tier === "apply"
      ? "border-orange-600 text-orange-400 bg-brand-primary-tint"
      : tier === "tailor"
      ? "border-violet-500/50 text-violet-300 bg-brand-ai-tint"
      : "border-cyan-500/50 text-cyan-300 bg-brand-info-tint";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleRowClick}
      onKeyDown={handleKey}
      aria-label={`${role.role} at ${role.company}${role.location ? `, ${role.location}` : ""}${score !== null ? `, match score ${score} of 100` : ""}`}
      className="grid grid-cols-[32px_1fr_auto] sm:grid-cols-[32px_1fr_auto_auto] gap-2 sm:gap-3 items-center px-2 py-3 border-t border-stone-800/60 hover:bg-stone-900 transition-colors cursor-pointer"
    >
      {tier ? (
        <div
          aria-hidden
          className="w-8 h-8 rounded-full p-[2.5px] flex items-center justify-center"
          style={ringStyle(tier, score!)}
        >
          <div className="w-[27px] h-[27px] rounded-full bg-stone-950 flex items-center justify-center">
            <span
              className="font-mono text-[10px] font-bold"
              style={{
                color:
                  tier === "apply"
                    ? "#fb923c"
                    : tier === "explore"
                    ? "#22d3ee"
                    : tier === "tailor"
                    ? "#c4b5fd"
                    : "#78716c",
              }}
            >
              {score}
            </span>
          </div>
        </div>
      ) : (
        <div aria-hidden className="w-8 flex justify-center">
          <span className="block w-0.5 h-8 bg-stone-800" />
        </div>
      )}

      <div className="min-w-0">
        <div className="font-mono text-[12px] sm:text-[13px] text-stone-50 truncate">
          {role.role}
        </div>
        <div className="font-mono text-[9px] sm:text-[10px] text-stone-500 truncate">
          {role.company}
          {role.location && <span className="text-stone-700 mx-1">·</span>}
          {role.location}
          {role.datePosted && <span className="text-stone-700 mx-1">·</span>}
          {role.datePosted && formatAge(role.datePosted)}
        </div>
      </div>

      <div className="hidden sm:flex gap-1" onClick={stop}>
        {role.tags.slice(0, 2).map((tag) => (
          <Chip key={tag} variant="info">
            {tag}
          </Chip>
        ))}
      </div>

      <a
        href={role.url ?? "#"}
        target={role.url ? "_blank" : undefined}
        rel={role.url ? "noopener noreferrer" : undefined}
        onClick={stop}
        className={`font-mono text-[9px] sm:text-[10px] px-2 sm:px-2.5 py-1 sm:py-1.5 border ${ctaVariant} lowercase tracking-wider`}
      >
        {ctaLabel}
      </a>
    </div>
  );
}
