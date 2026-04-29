import type { LandingTrustStats } from "@/lib/dashboard";
import { formatTimeAgo } from "@/lib/format-time";
import { LANDING_COPY } from "./copy";

interface DailyDigestStripProps {
  trustData: LandingTrustStats;
}

function Stat({
  value,
  label,
  sublabel,
  emphasis,
}: {
  value: string;
  label: string;
  sublabel: string;
  emphasis?: "up" | "down";
}) {
  const subClass =
    emphasis === "up"
      ? "text-brand-primary"
      : emphasis === "down"
        ? "text-fg-subtle"
        : "text-fg-subtle";
  return (
    <div className="px-4 sm:px-6 py-5 min-w-0">
      <div className="font-numeric text-[28px] sm:text-[32px] font-medium tabular-nums text-fg leading-none">
        {value}
      </div>
      <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-fg-muted">
        {label}
      </div>
      <div className={`mt-1 font-mono text-label truncate ${subClass}`}>
        {sublabel}
      </div>
    </div>
  );
}

export function DailyDigestStrip({ trustData }: DailyDigestStripProps) {
  const { totalLive, lastSynced, velocity7d, remoteCount, h1bCount } = trustData;
  const ago = formatTimeAgo(lastSynced);

  return (
    <section
      aria-labelledby="digest-heading"
      className="max-w-[980px] mx-auto px-4 sm:px-7 mt-8 sm:mt-10 mb-10 sm:mb-14"
    >
      <h2 id="digest-heading" className="sr-only">
        Daily digest
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-line-subtle border-y border-line-subtle">
        <Stat
          value={totalLive.toLocaleString()}
          label={LANDING_COPY.digest.liveRoles.label}
          sublabel={LANDING_COPY.digest.liveRoles.sublabel(ago)}
        />
        <Stat
          value={velocity7d.newThisWeek.toLocaleString()}
          label={LANDING_COPY.digest.freshThisWeek.label}
          sublabel={LANDING_COPY.digest.freshThisWeek.sublabel(velocity7d.deltaVsLastWeek)}
          emphasis={velocity7d.deltaVsLastWeek > 0 ? "up" : undefined}
        />
        <Stat
          value={remoteCount.toLocaleString()}
          label={LANDING_COPY.digest.remote.label}
          sublabel={LANDING_COPY.digest.remote.sublabel(totalLive)}
        />
        <Stat
          value={h1bCount.toLocaleString()}
          label={LANDING_COPY.digest.h1bFriendly.label}
          sublabel={LANDING_COPY.digest.h1bFriendly.sublabel}
        />
      </div>
    </section>
  );
}
