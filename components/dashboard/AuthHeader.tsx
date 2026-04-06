"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { ThemeToggle } from "./ThemeToggle";
import { LogOut } from "lucide-react";

export function AuthHeader() {
  const { data: session, status } = useSession();
  const isAuth = status === "authenticated";

  return (
    <header className="flex items-center justify-between px-7 py-3.5 border-b border-stone-200 dark:border-stone-800">
      <div className="flex items-center gap-5">
        {/* Terminal dots */}
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full border-[1.5px] border-orange-600 bg-orange-600" />
          <div className="w-2.5 h-2.5 rounded-full border-[1.5px] border-orange-300 dark:border-orange-700" />
          <div className="w-2.5 h-2.5 rounded-full border-[1.5px] border-stone-200 dark:border-stone-700" />
        </div>
        <span className="font-mono font-bold text-orange-600 text-[15px] tracking-wider lowercase">
          rezoomind
        </span>
        <span className="text-stone-300 dark:text-stone-700">|</span>
        <nav className="hidden sm:flex gap-4">
          <a href="#jobs" className="font-mono text-xs text-stone-500 dark:text-stone-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
            ~/jobs
          </a>
          <Link href="/insights" className="font-mono text-xs text-stone-500 dark:text-stone-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
            ~/insights
          </Link>
        </nav>
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        {isAuth ? (
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-stone-500 dark:text-stone-400 hidden sm:inline">
              {session?.user?.email?.split("@")[0]}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex items-center gap-1.5 border-[1.5px] border-stone-300 dark:border-stone-700 text-stone-500 px-3 py-1.5 rounded font-mono text-xs hover:border-red-400 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-3 h-3" />
              sign_out
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="border-[1.5px] border-orange-600 text-orange-600 px-4 py-1.5 rounded font-mono text-xs font-semibold tracking-wide hover:bg-orange-600 hover:text-white transition-colors"
          >
            sign_in →
          </Link>
        )}
      </div>
    </header>
  );
}
