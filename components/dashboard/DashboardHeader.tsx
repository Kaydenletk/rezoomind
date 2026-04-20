import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

export function DashboardHeader() {
  return (
    <>
      <a
        href="#main-content"
        className={`sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-3 focus:py-1.5 focus:bg-surface focus:border focus:border-orange-600 focus:text-orange-700 dark:focus:text-orange-400 focus:font-mono focus:text-xs ${focusRing}`}
      >
        skip_to_content
      </a>
      <header
        role="banner"
        className="flex items-center justify-between px-7 py-3.5 border-b border-line bg-surface"
      >
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <div className="w-2.5 h-2.5 rounded-full border-[1.5px] border-orange-600 bg-orange-600" />
            <div className="w-2.5 h-2.5 rounded-full border-[1.5px] border-orange-300 dark:border-orange-700" />
            <div className="w-2.5 h-2.5 rounded-full border-[1.5px] border-line" />
          </div>
          <Link
            href="/"
            aria-label="rezoomind home"
            className={`font-mono font-bold text-orange-700 dark:text-orange-400 text-[15px] tracking-wider lowercase hover:text-orange-600 transition-colors ${focusRing}`}
          >
            rezoomind
          </Link>
          <span aria-hidden="true" className="text-line">|</span>
          <nav aria-label="Primary" className="hidden sm:flex gap-4">
            <a
              href="#jobs"
              className={`font-mono text-xs text-fg-muted hover:text-orange-600 dark:hover:text-orange-400 transition-colors ${focusRing}`}
            >
              ~/jobs
            </a>
            <Link
              href="/insights"
              className={`font-mono text-xs text-fg-muted hover:text-orange-600 dark:hover:text-orange-400 transition-colors ${focusRing}`}
            >
              ~/insights
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/login"
            className={`border-[1.5px] border-orange-600 text-orange-700 dark:text-orange-400 px-4 py-1.5 rounded font-mono text-xs font-semibold tracking-wide hover:bg-orange-600 hover:text-white transition-colors ${focusRing}`}
          >
            sign_in →
          </Link>
        </div>
      </header>
    </>
  );
}
