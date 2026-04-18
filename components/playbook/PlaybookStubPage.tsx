import Link from "next/link";
import { LANDING_COPY } from "@/components/landing/copy";
import { LandingTopbar } from "@/components/landing/LandingTopbar";
import { LandingFooter } from "@/components/landing/LandingFooter";

interface PlaybookStubPageProps {
  label: string;
}

export function PlaybookStubPage({ label }: PlaybookStubPageProps) {
  return (
    <div className="min-h-dvh bg-surface text-fg">
      <LandingTopbar />
      <main className="max-w-[720px] mx-auto px-4 sm:px-7 pt-16 sm:pt-24 pb-16">
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-violet-700 dark:text-violet-300 mb-3">
          {LANDING_COPY.playbook.sectionEyebrow}
        </p>
        <h1 className="font-display font-semibold tracking-[-0.03em] text-[40px] sm:text-[52px] leading-[1.05] text-fg">
          {label}
        </h1>
        <p className="mt-8 font-sans text-[17px] leading-[1.6] text-fg-muted">
          {LANDING_COPY.playbook.comingSoon.headline}
        </p>
        <p className="mt-3 font-sans text-[15px] leading-[1.6] text-fg-muted">
          {LANDING_COPY.playbook.comingSoon.body}
        </p>
        <Link
          href="/"
          className="mt-10 inline-block font-mono text-label text-violet-700 dark:text-violet-300 hover:text-violet-600 dark:hover:text-violet-200 transition-colors"
        >
          {LANDING_COPY.playbook.comingSoon.backLink}
        </Link>
      </main>
      <LandingFooter lastSynced={new Date().toISOString()} />
    </div>
  );
}
