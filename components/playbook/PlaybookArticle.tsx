import Link from "next/link";
import type { PlaybookArticle as Article, PlaybookSection } from "@/content/playbook";
import { LandingTopbar } from "@/components/landing/LandingTopbar";
import { LandingFooter } from "@/components/landing/LandingFooter";

interface PlaybookArticleProps {
  article: Article;
}

function SectionCallout({ callout }: { callout: NonNullable<PlaybookSection["callout"]> }) {
  const isRule = callout.kind === "rule";
  return (
    <aside
      className={`my-5 px-4 sm:px-5 py-3 border-l-2 font-sans text-[14px] leading-[1.55] ${
        isRule
          ? "border-brand-ai bg-brand-ai-tint/30 text-fg"
          : "border-red-400/60 bg-red-500/5 text-fg"
      }`}
      role="note"
    >
      <span
        className={`block font-mono text-[10px] uppercase tracking-[0.2em] mb-1 ${
          isRule
            ? "text-violet-700 dark:text-violet-300"
            : "text-red-600 dark:text-red-400"
        }`}
      >
        {isRule ? "Rule" : "Avoid"}
      </span>
      {callout.text}
    </aside>
  );
}

export function PlaybookArticle({ article }: PlaybookArticleProps) {
  return (
    <div className="min-h-dvh bg-surface text-fg">
      <LandingTopbar />
      <main className="max-w-[720px] mx-auto px-4 sm:px-7 pt-12 sm:pt-20 pb-16">
        <header className="mb-10">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-violet-700 dark:text-violet-300 mb-4">
            {article.eyebrow}
          </p>
          <h1 className="font-display font-semibold tracking-[-0.03em] text-[40px] sm:text-[52px] leading-[1.05] text-fg">
            {article.title}
          </h1>
          <p className="mt-6 font-sans text-[17px] sm:text-[19px] leading-[1.55] text-fg-muted max-w-[640px]">
            {article.lede}
          </p>
          <div className="mt-5 flex items-center gap-3 font-mono text-label text-fg-subtle">
            <span>{article.readTime}</span>
            <span aria-hidden>·</span>
            <span>updated {article.updated}</span>
          </div>
        </header>

        <div className="space-y-10 pt-8 border-t border-line-subtle">
          {article.sections.map((section, idx) => (
            <section key={section.heading}>
              <h2 className="font-display font-semibold tracking-[-0.02em] text-[24px] sm:text-[28px] leading-[1.2] text-fg mb-4">
                <span className="font-mono text-[13px] text-fg-subtle mr-3 align-middle">
                  0{idx + 1}
                </span>
                {section.heading}
              </h2>
              {section.paragraphs.map((p, i) => (
                <p
                  key={i}
                  className="mt-3 font-sans text-[15px] sm:text-[16px] leading-[1.7] text-fg-muted"
                >
                  {p}
                </p>
              ))}
              {section.callout && <SectionCallout callout={section.callout} />}
            </section>
          ))}
        </div>

        <section
          aria-labelledby="takeaways-heading"
          className="mt-14 pt-8 border-t border-line-subtle"
        >
          <h2
            id="takeaways-heading"
            className="font-mono text-[10px] uppercase tracking-[0.24em] text-violet-700 dark:text-violet-300 mb-5"
          >
            Key takeaways
          </h2>
          <ul className="space-y-3">
            {article.takeaways.map((t, i) => (
              <li
                key={i}
                className="flex gap-3 font-sans text-[15px] leading-[1.55] text-fg"
              >
                <span
                  aria-hidden
                  className="font-mono text-label text-violet-700 dark:text-violet-300 pt-[3px] shrink-0"
                >
                  0{i + 1}
                </span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-12 pt-8 border-t border-line-subtle">
          <Link
            href={article.cta.href}
            className="inline-flex items-center gap-2 border border-brand-primary bg-brand-primary text-white px-5 py-3 font-mono text-xs uppercase tracking-wider hover:bg-orange-500 transition-colors"
          >
            {article.cta.label}
          </Link>
        </div>
      </main>
      <LandingFooter lastSynced={new Date().toISOString()} />
    </div>
  );
}
