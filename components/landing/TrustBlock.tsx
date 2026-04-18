import type { LandingTrustStats } from "@/lib/dashboard";
import { LANDING_COPY } from "./copy";
import { TopHiringStrip } from "./TopHiringStrip";
import { VelocitySparkline } from "./VelocitySparkline";

interface TrustBlockProps {
  trustData: LandingTrustStats;
}

export function TrustBlock({ trustData }: TrustBlockProps) {
  return (
    <section
      aria-labelledby="trust-heading"
      className="max-w-[980px] mx-auto px-4 sm:px-7 mt-14 sm:mt-20 pt-10 border-t border-line-subtle"
    >
      <h2
        id="trust-heading"
        className="font-display font-semibold tracking-[-0.02em] text-[28px] sm:text-[32px] leading-[1.1] text-fg"
      >
        {LANDING_COPY.trust.headline}
      </h2>
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12">
        <div>
          <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-fg-muted mb-4">
            {LANDING_COPY.trust.sources.title}
          </h3>
          <p className="font-sans text-[13px] leading-[1.6] text-fg-muted">
            {LANDING_COPY.trust.sources.body(trustData.totalLive)}
          </p>
        </div>
        <TopHiringStrip topHiring={trustData.topHiring} />
        <VelocitySparkline velocity7d={trustData.velocity7d} />
      </div>
    </section>
  );
}
