import type { LandingTrustStats } from "@/lib/dashboard";
import { LANDING_COPY } from "./copy";

interface TopHiringStripProps {
  topHiring: LandingTrustStats["topHiring"];
}

export function TopHiringStrip({ topHiring }: TopHiringStripProps) {
  const visible = topHiring.slice(0, 5);
  const rest = topHiring.length > 5 ? topHiring.length - 5 : 0;

  return (
    <div>
      <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-fg-muted mb-4">
        {LANDING_COPY.trust.topHiring.title}
      </h3>
      <ul
        aria-label="Companies currently hiring"
        className="flex flex-wrap items-center gap-x-5 gap-y-2"
      >
        {visible.map((item) => (
          <li
            key={item.company}
            className="font-sans text-[13px] tracking-[-0.01em] text-fg-muted"
            title={`${item.company} · ${item.count} open roles`}
          >
            {item.company}
          </li>
        ))}
        {rest > 0 && (
          <li
            className="font-mono text-label text-fg-subtle border border-line-subtle px-2 py-[3px] rounded-sm"
            aria-label={`and ${rest} more companies`}
          >
            +{rest}
          </li>
        )}
      </ul>
      <p className="mt-3 font-mono text-[10px] text-fg-subtle">
        {LANDING_COPY.trust.topHiring.caption}
      </p>
    </div>
  );
}
