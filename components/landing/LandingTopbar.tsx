"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { LANDING_COPY } from "./copy";

type AccentKey = "orange" | "cyan";

const NAV_ITEMS: ReadonlyArray<{ href: string; label: string; accent: AccentKey }> = [
  { href: "/", label: "~/feed", accent: "orange" },
  { href: "/insights", label: "~/insights", accent: "cyan" },
];

const ACCENT_ACTIVE: Record<AccentKey, { text: string; underline: string }> = {
  orange: {
    text: "text-orange-700 dark:text-orange-400",
    underline: "bg-brand-primary",
  },
  cyan: {
    text: "text-cyan-700 dark:text-cyan-300",
    underline: "bg-brand-info",
  },
};

export function LandingTopbar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-7 h-12 sm:h-14 bg-surface/85 backdrop-blur border-b border-line-subtle">
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-3">
          <span aria-hidden className="inline-flex gap-1">
            <span className="w-2 h-2 rounded-full bg-brand-primary" />
            <span className="w-2 h-2 rounded-full border border-orange-600/40" />
            <span className="w-2 h-2 rounded-full border border-line" />
          </span>
          <Link
            href="/"
            className="font-mono text-sm font-bold tracking-[0.08em] text-orange-700 dark:text-orange-400"
          >
            rezoomind
          </Link>
        </div>
        <nav
          aria-label="Primary"
          className="hidden sm:flex items-center gap-0 text-label font-mono"
        >
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && !!pathname?.startsWith(item.href));
            const accent = ACCENT_ACTIVE[item.accent];
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative px-3 py-2 transition-colors ${
                  isActive
                    ? accent.text
                    : "text-fg-subtle hover:text-fg-muted"
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden
                    className={`absolute left-3 right-3 bottom-0 h-[2px] ${accent.underline}`}
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-2">
        {session?.user ? (
          <>
            <span className="hidden sm:inline font-mono text-label text-fg-muted">
              {session.user.name || session.user.email?.split("@")[0]}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              {LANDING_COPY.topbar.logout}
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" size="sm" href="/login">
              {LANDING_COPY.topbar.login}
            </Button>
            <Button variant="primary-solid" size="sm" href="/signup">
              {LANDING_COPY.topbar.signup}
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
