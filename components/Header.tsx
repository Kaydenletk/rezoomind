"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type MouseEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { useAuth } from "@/components/AuthProvider";

const publicNavLinks = [
  { href: "/jobs", label: "~/jobs" },
  { href: "/#pricing", label: "~/pricing" },
  { href: "/about", label: "~/about" },
];

const authenticatedNavLinks = [
  { href: "/dashboard", label: "~/dashboard" },
  { href: "/jobs", label: "~/jobs" },
  { href: "/resume", label: "~/resume" },
  { href: "/preferences", label: "~/preferences" },
];

type NavItemProps = {
  href: string;
  label: string;
  onClick?: () => void;
};

function NavItem({ href, label, onClick }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "font-mono text-xs transition-colors",
        isActive ? "text-orange-500" : "text-stone-400 hover:text-orange-500"
      )}
    >
      {label}
    </Link>
  );
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
    router.refresh();
  };

  const handlePricingClick = (event?: MouseEvent) => {
    event?.preventDefault();
    if (pathname === "/") {
      document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
    } else {
      router.push("/#pricing");
    }
    setMenuOpen(false);
  };

  const navLinks = user ? authenticatedNavLinks : publicNavLinks;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-stone-800 bg-stone-950">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        {/* Left: dots + brand + pipe + nav */}
        <div className="flex items-center gap-5">
          {/* Terminal dots */}
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-600 border-[1.5px] border-orange-600" />
            <div className="w-2.5 h-2.5 rounded-full border-[1.5px] border-orange-700" />
            <div className="w-2.5 h-2.5 rounded-full border-[1.5px] border-stone-700" />
          </div>

          {/* Brand */}
          <Link
            href="/"
            className="font-mono font-bold text-orange-600 text-[15px] tracking-wider lowercase"
          >
            rezoomind
          </Link>

          {/* Pipe separator */}
          <span className="text-stone-700 select-none">|</span>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-5">
            {navLinks.map((link) => (
              <NavItem
                key={link.href}
                href={link.href}
                label={link.label}
                onClick={link.href === "/#pricing" ? handlePricingClick : undefined}
              />
            ))}
          </nav>
        </div>

        {/* Right: auth controls + mobile hamburger */}
        <div className="flex items-center gap-3">
          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                {/* Avatar + greeting */}
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center border border-orange-600/50 bg-orange-600/10 text-orange-500 font-mono text-xs font-bold select-none">
                    {(user.name ?? user.email ?? "U").charAt(0).toUpperCase()}
                  </div>
                  <span className="font-mono text-xs text-stone-400">
                    {user.name?.split(" ")[0] ?? user.email?.split("@")[0] ?? "user"}
                  </span>
                </div>

                {/* Sign out */}
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="border border-stone-700 bg-stone-900/30 px-3 py-1.5 font-mono text-xs text-stone-400 hover:border-orange-600/50 hover:text-orange-500 transition-colors"
                >
                  log out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="border border-orange-600/50 bg-orange-600/10 px-3 py-1.5 font-mono text-xs text-orange-500 hover:bg-orange-600/20 transition-colors"
              >
                {loading ? "..." : "sign in"}
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="flex h-8 w-8 items-center justify-center border border-stone-800 bg-stone-900/30 md:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-label="Toggle menu"
          >
            <span className="flex flex-col gap-1">
              <span className="h-px w-4 bg-stone-400" />
              <span className="h-px w-4 bg-stone-600" />
              <span className="h-px w-4 bg-stone-700" />
            </span>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen ? (
          <motion.div
            key="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden border-t border-stone-800 bg-stone-950 md:hidden"
          >
            <div className="flex flex-col gap-4 px-6 py-5">
              {/* Mobile user greeting */}
              {user ? (
                <div className="flex items-center gap-2 pb-1 border-b border-stone-800">
                  <div className="flex h-7 w-7 items-center justify-center border border-orange-600/50 bg-orange-600/10 text-orange-500 font-mono text-xs font-bold select-none">
                    {(user.name ?? user.email ?? "U").charAt(0).toUpperCase()}
                  </div>
                  <span className="font-mono text-xs text-stone-400">
                    {user.name?.split(" ")[0] ?? user.email?.split("@")[0] ?? "user"}
                  </span>
                </div>
              ) : null}

              {/* Mobile nav links */}
              {navLinks.map((link) => (
                <NavItem
                  key={link.href}
                  href={link.href}
                  label={link.label}
                  onClick={
                    link.href === "/#pricing"
                      ? handlePricingClick
                      : () => setMenuOpen(false)
                  }
                />
              ))}

              {/* Mobile auth button */}
              {user ? (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    handleSignOut();
                  }}
                  className="mt-1 border border-stone-700 bg-stone-900/30 px-3 py-2 font-mono text-xs text-stone-400 hover:border-orange-600/50 hover:text-orange-500 transition-colors text-left"
                >
                  log out
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="mt-1 inline-block border border-orange-600/50 bg-orange-600/10 px-3 py-2 font-mono text-xs text-orange-500 hover:bg-orange-600/20 transition-colors"
                >
                  {loading ? "..." : "sign in"}
                </Link>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
