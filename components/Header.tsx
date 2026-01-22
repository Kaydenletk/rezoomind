"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type MouseEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { useAuth } from "@/components/AuthProvider";

const publicNavLinks = [
  { href: "/jobs", label: "Browse Jobs" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/about", label: "About" },
];

const authenticatedNavLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/jobs", label: "Jobs" },
  { href: "/preferences", label: "Preferences" },
  { href: "/resume", label: "Resume" },
];

const MotionLink = motion(Link);

type NavItemProps = {
  href: string;
  label: string;
  onClick?: () => void;
};

function NavItem({ href, label, onClick }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <MotionLink
      href={href}
      onClick={onClick}
      className={cn(
        "relative px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-500 transition-colors hover:text-brand",
        isActive && "text-slate-900"
      )}
      initial="rest"
      animate={isActive ? "active" : "rest"}
      whileHover="hover"
    >
      <span>{label}</span>
      <motion.span
        className="absolute left-0 right-0 -bottom-2 h-[2px] origin-left bg-[rgb(var(--brand-rgb))]"
        variants={{
          rest: { scaleX: 0, opacity: 0 },
          hover: { scaleX: 1, opacity: 1 },
          active: { scaleX: 1, opacity: 1 },
        }}
        transition={{ duration: 0.25 }}
      />
    </MotionLink>
  );
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const signInActive = pathname === "/login" || pathname === "/signup";
  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "there";

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

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/70 bg-white/80 backdrop-blur">
      <div className="mx-auto grid h-20 max-w-6xl grid-cols-[1fr_auto_1fr] items-center px-6">
        <div className="flex items-center">
          <MotionLink
            href="/"
            className="flex items-center gap-3 text-lg font-semibold text-slate-900"
            initial="rest"
            whileHover="hover"
            animate="rest"
          >
            <motion.span
              className="relative flex h-8 w-8 items-center justify-center"
              variants={{ rest: { rotate: 0 }, hover: { rotate: 6 } }}
              transition={{ type: "spring", stiffness: 220, damping: 12 }}
            >
              <span className="absolute left-0 top-0 h-3 w-3 bg-[rgb(var(--brand-rgb))]" />
              <span className="absolute right-0 top-0 h-3 w-3 bg-slate-400" />
              <span className="absolute left-0 bottom-0 h-3 w-3 bg-slate-300" />
            </motion.span>
            <span>Rezoomind</span>
          </MotionLink>
        </div>

        <nav className="hidden items-center justify-center gap-8 md:flex">
          {(user ? authenticatedNavLinks : publicNavLinks).map((link) => (
            <NavItem
              key={link.href}
              href={link.href}
              label={link.label}
              onClick={link.href === "/#pricing" ? handlePricingClick : undefined}
            />
          ))}
        </nav>

        <div className="flex items-center justify-end gap-3">
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  {`Welcome, ${displayName}`.toUpperCase()}
                </span>
                <motion.button
                  type="button"
                  onClick={handleSignOut}
                  className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-600 hover:border-[rgba(var(--brand-rgb),0.6)] hover:text-brand"
                  whileHover={{ y: -1 }}
                  whileTap={{ y: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 18 }}
                >
                  Log Out
                </motion.button>
              </>
            ) : (
              <MotionLink
                href="/login"
                className={cn(
                  "rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-900 transition",
                  signInActive
                    ? "bg-[rgb(var(--brand-rgb))]"
                    : "bg-[rgb(var(--brand-rgb))] hover:bg-[rgb(var(--brand-hover-rgb))]"
                )}
                whileHover={{ y: -1 }}
                whileTap={{ y: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 18 }}
              >
                {loading ? "Loading" : "Sign In"}
              </MotionLink>
            )}
          </div>

          <button
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 md:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-label="Toggle menu"
          >
            <span className="flex flex-col gap-1.5">
              <span className="h-0.5 w-5 bg-slate-900" />
              <span className="h-0.5 w-5 bg-slate-500" />
              <span className="h-0.5 w-5 bg-slate-300" />
            </span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen ? (
          <motion.div
            key="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="overflow-hidden border-t border-slate-200 bg-white md:hidden"
          >
            <div className="flex flex-col gap-4 px-6 py-6">
              {user ? (
                <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  {`Welcome, ${displayName}`.toUpperCase()}
                </span>
              ) : null}
              {(user ? authenticatedNavLinks : publicNavLinks).map((link) => (
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
              {user ? (
                <motion.button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    handleSignOut();
                  }}
                  className="mt-2 inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-600 hover:border-[rgba(var(--brand-rgb),0.6)] hover:text-brand"
                  whileHover={{ y: -1 }}
                  whileTap={{ y: 1 }}
                  transition={{ type: "spring", stiffness: 240, damping: 18 }}
                >
                  Log Out
                </motion.button>
              ) : (
                <MotionLink
                  href="/login"
                  className="mt-2 inline-flex items-center justify-center rounded-full border border-[rgba(var(--brand-rgb),0.4)] bg-[rgb(var(--brand-rgb))] px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-900"
                  onClick={() => setMenuOpen(false)}
                  whileHover={{ y: -1 }}
                  whileTap={{ y: 1 }}
                  transition={{ type: "spring", stiffness: 240, damping: 18 }}
                >
                  {loading ? "Loading" : "Sign In"}
                </MotionLink>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
