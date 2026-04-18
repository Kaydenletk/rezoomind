"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { LANDING_COPY } from "./copy";

export function LandingTopbar() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-7 h-12 sm:h-14 bg-surface/85 backdrop-blur border-b border-line-subtle">
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
