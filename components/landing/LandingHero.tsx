import { LANDING_COPY } from "./copy";

interface LandingHeroProps {
  liveCount: number;
}

export function LandingHero({ liveCount }: LandingHeroProps) {
  return (
    <section className="px-4 sm:px-7 py-6 sm:py-8" aria-labelledby="hero-heading">
      <h1
        id="hero-heading"
        className="font-mono font-extrabold text-[28px] sm:text-[32px] leading-none tracking-[-0.02em] text-stone-50"
      >
        <span className="text-brand-primary">{liveCount.toLocaleString()}</span>{" "}
        live roles.
      </h1>
      <p className="mt-2 font-mono text-[11px] text-stone-500">
        {LANDING_COPY.hero.sub}
      </p>
    </section>
  );
}
