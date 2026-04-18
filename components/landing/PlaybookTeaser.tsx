import Link from "next/link";
import { LANDING_COPY } from "./copy";

const CARDS = [
  LANDING_COPY.playbook.cards.beforeYouApply,
  LANDING_COPY.playbook.cards.theTimingGame,
  LANDING_COPY.playbook.cards.hiddenGems,
] as const;

export function PlaybookTeaser() {
  return (
    <section
      aria-labelledby="playbook-heading"
      className="max-w-[980px] mx-auto px-4 sm:px-7 mt-14 sm:mt-20 pt-10 border-t border-line-subtle"
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-violet-700 dark:text-violet-300 mb-3">
        {LANDING_COPY.playbook.sectionEyebrow}
      </p>
      <h2
        id="playbook-heading"
        className="font-display font-semibold tracking-[-0.02em] text-[28px] sm:text-[32px] leading-[1.1] text-fg"
      >
        {LANDING_COPY.playbook.sectionHeadline}
      </h2>
      <p className="mt-3 max-w-[640px] font-sans text-[14px] sm:text-[15px] leading-[1.6] text-fg-muted">
        {LANDING_COPY.playbook.sectionSub}
      </p>
      <ul className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-0 sm:gap-6">
        {CARDS.map((card, i) => (
          <li key={card.slug} className="relative">
            <Link
              href={`/playbook/${card.slug}`}
              className="block group py-6 sm:py-0 sm:p-0 border-t sm:border-t-0 sm:border-l border-line-subtle sm:pl-6 first:border-t-0 sm:first:border-l-0 sm:first:pl-0"
              aria-label={`${card.label} — ${card.teaser}`}
            >
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-fg-subtle">
                0{i + 1}
              </div>
              <h3 className="mt-3 font-display font-semibold text-[19px] sm:text-[22px] leading-[1.2] tracking-[-0.01em] text-fg group-hover:text-violet-700 dark:group-hover:text-violet-300 transition-colors">
                {card.label}
              </h3>
              <p className="mt-2 font-sans text-[13px] leading-[1.55] text-fg-muted">
                {card.teaser}
              </p>
              <span className="mt-4 inline-block font-mono text-label text-violet-700 dark:text-violet-300 group-hover:translate-x-0.5 transition-transform">
                {LANDING_COPY.playbook.readAffordance}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
