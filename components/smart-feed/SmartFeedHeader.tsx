"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { signIn, signOut } from "next-auth/react";
import { Sun, Moon, Menu, X, ChevronDown } from "lucide-react";

interface SmartFeedHeaderProps {
  user: { name?: string | null; email?: string | null } | null;
}

export function SmartFeedHeader({ user }: SmartFeedHeaderProps) {
  const [dark, setDark] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initialize theme from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = stored === "dark" || (!stored && prefersDark);
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  const handleDemoLogin = async () => {
    setIsDemoLoading(true);
    const result = await signIn("credentials", {
      email: process.env.NEXT_PUBLIC_DEMO_EMAIL ?? "demo@rezoomind.app",
      password: process.env.NEXT_PUBLIC_DEMO_PASSWORD ?? "demo_rezoomind_2026",
      callbackUrl: "/feed",
      redirect: false,
    });
    if (result?.ok) {
      window.location.href = "/feed";
    } else {
      setIsDemoLoading(false);
    }
  };

  const avatarLetter = user?.name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? "?";

  return (
    <>
      <header className="sticky top-0 z-50 bg-stone-50 dark:bg-stone-950 border-b border-stone-200 dark:border-stone-800 h-14 flex items-center px-5">
        <div className="flex items-center justify-between w-full">
          {/* Left: logo + terminal dots */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-orange-600" />
              <div className="w-2.5 h-2.5 rounded-full border-[1.5px] border-orange-700" />
              <div className="w-2.5 h-2.5 rounded-full border-[1.5px] border-stone-400 dark:border-stone-700" />
            </div>
            <Link
              href="/"
              className="font-mono font-bold tracking-wider text-orange-600 text-[15px] lowercase hover:text-orange-500 transition-colors"
            >
              rezoomind
            </Link>
          </div>

          {/* Right: desktop controls */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-1.5 border border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
              aria-label="Toggle theme"
            >
              {dark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>

            {user ? (
              /* Personal mode: avatar + dropdown */
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-1.5 group"
                  aria-haspopup="true"
                  aria-expanded={dropdownOpen}
                >
                  <span className="w-8 h-8 bg-orange-600 text-white font-mono text-sm flex items-center justify-center select-none">
                    {avatarLetter}
                  </span>
                  <ChevronDown className="w-3 h-3 text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-300 transition-colors" />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-1 w-44 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 z-50">
                    <Link
                      href="/resume"
                      onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2.5 font-mono text-xs text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-900 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                    >
                      ~/resume
                    </Link>
                    <Link
                      href="/preferences"
                      onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2.5 font-mono text-xs text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-900 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                    >
                      ~/preferences
                    </Link>
                    <div className="border-t border-stone-200 dark:border-stone-800" />
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        signOut({ callbackUrl: "/" });
                      }}
                      className="block w-full text-left px-4 py-2.5 font-mono text-xs text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-900 hover:text-red-500 transition-colors"
                    >
                      logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Public mode: try demo + login + signup */
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDemoLogin}
                  disabled={isDemoLoading}
                  className="px-4 py-1.5 border border-orange-600/50 bg-orange-600/10 font-mono text-xs text-orange-500 hover:bg-orange-600/20 transition-colors disabled:opacity-50"
                >
                  {isDemoLoading ? "loading..." : "try demo"}
                </button>
                <Link
                  href="/login"
                  className="px-4 py-1.5 border border-stone-300 dark:border-stone-700 font-mono text-xs text-stone-600 dark:text-stone-400 hover:border-stone-400 dark:hover:border-stone-600 hover:text-stone-800 dark:hover:text-stone-200 transition-colors"
                >
                  log in
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-1.5 bg-orange-600 font-mono text-xs text-white hover:bg-orange-500 transition-colors"
                >
                  sign up free
                </Link>
              </div>
            )}
          </div>

          {/* Mobile: hamburger */}
          <button
            className="lg:hidden p-1.5 text-stone-500 dark:text-stone-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile slide-out panel */}
      <div
        className={[
          "lg:hidden fixed inset-x-0 top-14 z-40 bg-stone-50 dark:bg-stone-950 border-b border-stone-200 dark:border-stone-800 overflow-hidden transition-all duration-200",
          mobileOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0 pointer-events-none",
        ].join(" ")}
      >
        <div className="px-5 py-4 space-y-1">
          {/* Theme toggle row */}
          <button
            onClick={() => {
              toggleTheme();
              setMobileOpen(false);
            }}
            className="flex items-center gap-3 w-full px-3 py-2.5 font-mono text-xs text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-900 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
          >
            {dark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            {dark ? "light mode" : "dark mode"}
          </button>

          <div className="border-t border-stone-200 dark:border-stone-800 my-1" />

          {user ? (
            <>
              <Link
                href="/resume"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 font-mono text-xs text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-900 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
              >
                ~/resume
              </Link>
              <Link
                href="/preferences"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 font-mono text-xs text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-900 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
              >
                ~/preferences
              </Link>
              <div className="border-t border-stone-200 dark:border-stone-800 my-1" />
              <button
                onClick={() => {
                  setMobileOpen(false);
                  signOut({ callbackUrl: "/" });
                }}
                className="block w-full text-left px-3 py-2.5 font-mono text-xs text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-900 hover:text-red-500 transition-colors"
              >
                logout
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => { setMobileOpen(false); handleDemoLogin(); }}
                disabled={isDemoLoading}
                className="block w-full text-left px-3 py-2.5 font-mono text-xs text-orange-500 hover:bg-orange-600/10 transition-colors disabled:opacity-50"
              >
                {isDemoLoading ? "loading..." : "try demo"}
              </button>
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 font-mono text-xs text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-900 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
              >
                log in
              </Link>
              <Link
                href="/signup"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 font-mono text-xs font-bold text-orange-600 hover:bg-orange-600/10 transition-colors"
              >
                sign up free
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}
