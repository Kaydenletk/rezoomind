"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { LANDING_COPY } from "./copy";

type HeroState =
  | { kind: "unauthed"; liveCount: number; ago: string }
  | { kind: "authedNoResume"; liveCount: number; ago: string }
  | {
      kind: "authedMirror";
      matchCount: number;
      breakdown: { strong: number; stretch: number; breadth: number };
      liveCount: number;
      ago: string;
    };

interface LandingHeroProps {
  state: HeroState;
  loadingMirror?: boolean;
}

const EASE_OUT_QUART = (t: number) => 1 - Math.pow(1 - t, 4);

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function useCountUp(target: number, durationMs = 1200): number {
  const [value, setValue] = useState(target);

  useEffect(() => {
    if (prefersReducedMotion() || target <= 0) {
      setValue(target);
      return;
    }
    const start = performance.now();
    const from = 0;
    setValue(from);
    let rafId = 0;
    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / durationMs);
      const eased = EASE_OUT_QUART(t);
      setValue(Math.round(from + (target - from) * eased));
      if (t < 1) rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [target, durationMs]);

  return value;
}

function HeroFrame({
  eyebrow,
  headline,
  sub,
  primary,
  secondary,
  trust,
}: {
  eyebrow: string;
  headline: React.ReactNode;
  sub: React.ReactNode;
  primary: { label: string; href: string };
  secondary?: { label: string; href: string };
  trust: string;
}) {
  return (
    <section
      className="px-4 sm:px-7 pt-12 pb-10 sm:pt-20 sm:pb-14 max-w-[980px] mx-auto"
      aria-labelledby="hero-heading"
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-fg-subtle mb-4">
        {eyebrow}
      </p>
      <h1
        id="hero-heading"
        className="font-display font-semibold tracking-[-0.03em] leading-[0.98] text-fg"
        style={{ fontSize: "clamp(40px, 6vw, 72px)" }}
      >
        {headline}
      </h1>
      <p className="mt-5 max-w-[640px] font-sans text-[15px] sm:text-[17px] leading-[1.55] text-fg-muted">
        {sub}
      </p>
      <div className="mt-8 flex items-center gap-3 flex-wrap">
        <Button variant="primary-solid" size="md" href={primary.href}>
          {primary.label}
        </Button>
        {secondary && (
          <Button variant="ghost" size="md" href={secondary.href}>
            {secondary.label}
          </Button>
        )}
      </div>
      <p className="mt-6 font-mono text-label text-fg-subtle">{trust}</p>
    </section>
  );
}

export function LandingHero({ state, loadingMirror = false }: LandingHeroProps) {
  if (state.kind === "unauthed") {
    const copy = LANDING_COPY.hero.unauthed;
    return (
      <HeroFrame
        eyebrow={copy.eyebrow}
        headline={copy.headline}
        sub={copy.sub}
        primary={{ label: copy.primaryCta, href: "/signup" }}
        secondary={{ label: copy.secondaryCta, href: "#roles" }}
        trust={LANDING_COPY.hero.trustLine(state.liveCount, state.ago)}
      />
    );
  }

  if (state.kind === "authedNoResume") {
    const copy = LANDING_COPY.hero.authedNoResume;
    return (
      <HeroFrame
        eyebrow={copy.eyebrow}
        headline={copy.headline}
        sub={copy.sub}
        primary={{ label: copy.primaryCta, href: "/resume" }}
        secondary={{ label: copy.secondaryCta, href: "#roles" }}
        trust={LANDING_COPY.hero.trustLine(state.liveCount, state.ago)}
      />
    );
  }

  const copy = LANDING_COPY.hero.authedMirror;
  return <MirrorHero state={state} loading={loadingMirror} copy={copy} />;
}

function MirrorHero({
  state,
  loading,
  copy,
}: {
  state: Extract<HeroState, { kind: "authedMirror" }>;
  loading: boolean;
  copy: typeof LANDING_COPY.hero.authedMirror;
}) {
  const animatedMatch = useCountUp(state.matchCount);
  const headlineNumber = loading ? "…" : animatedMatch.toLocaleString();
  const headline = (
    <>
      You match{" "}
      <span className="font-numeric text-brand-primary tabular-nums">
        {headlineNumber}
      </span>{" "}
      roles this week.
    </>
  );
  const sub = loading
    ? copy.loading
    : copy.sub(state.breakdown.strong, state.breakdown.stretch, state.breakdown.breadth);

  return (
    <HeroFrame
      eyebrow={copy.eyebrow}
      headline={headline}
      sub={sub}
      primary={{ label: copy.primaryCta, href: "#roles" }}
      secondary={{ label: copy.secondaryCta, href: "#roles" }}
      trust={LANDING_COPY.hero.trustLine(state.liveCount, state.ago)}
    />
  );
}
