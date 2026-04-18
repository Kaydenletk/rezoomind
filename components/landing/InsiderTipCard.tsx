import Link from "next/link";
import type { InsiderTip } from "@/lib/insider-tips";
import { LANDING_COPY } from "./copy";

interface InsiderTipCardProps {
  tip: InsiderTip;
}

export function InsiderTipCard({ tip }: InsiderTipCardProps) {
  return (
    <section
      aria-labelledby="insider-heading"
      className="max-w-[980px] mx-auto px-4 sm:px-7 mt-10 sm:mt-14 mb-10 sm:mb-14"
    >
      <article className="relative border-l-2 border-brand-ai bg-brand-ai-tint/40 px-6 sm:px-8 py-6 sm:py-7">
        <div className="flex items-center gap-3 mb-3">
          <span className="font-mono text-[10px] font-bold tracking-[0.24em] text-violet-700 dark:text-violet-300">
            {LANDING_COPY.insider.eyebrow}
          </span>
          <span aria-hidden className="h-px w-6 bg-violet-500/30" />
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-fg-subtle">
            {tip.eyebrow}
          </span>
        </div>
        <h2
          id="insider-heading"
          className="font-display font-semibold tracking-[-0.02em] text-[22px] sm:text-[28px] leading-[1.2] text-fg"
        >
          {tip.headline}
        </h2>
        <p className="mt-3 font-sans text-[14px] sm:text-[15px] leading-[1.6] text-fg-muted max-w-[720px]">
          {tip.body}
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link
            href={`/playbook/${tip.playbookSlug}`}
            className="font-mono text-label text-violet-700 dark:text-violet-300 hover:text-violet-600 dark:hover:text-violet-200 transition-colors"
          >
            {LANDING_COPY.insider.readMore}
          </Link>
          <span className="font-mono text-[10px] text-fg-subtle">
            {LANDING_COPY.insider.sourceAttribution}
          </span>
        </div>
      </article>
    </section>
  );
}
