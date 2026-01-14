"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { useAuth } from "@/components/AuthProvider";

const navLinks = [
  { href: "/about", label: "About" },
  { href: "/pricing", label: "Pricing" },
  { href: "/contact", label: "Contact" },
];

const MotionLink = motion(Link) as any;

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
        "relative px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-white/70 transition-colors hover:text-white",
        isActive && "text-white"
      )}
      initial="rest"
      animate={isActive ? "active" : "rest"}
      whileHover="hover"
    >
      <span>{label}</span>
      <motion.span
        className="absolute left-0 right-0 -bottom-2 h-[2px] origin-left bg-cyan-300"
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

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-slate-950/75 backdrop-blur">
      <div className="mx-auto grid h-20 max-w-6xl grid-cols-[1fr_auto_1fr] items-center px-6">
        <div className="flex items-center">
          <MotionLink
            href="/"
            className="flex items-center gap-3 text-lg font-semibold text-white"
            initial="rest"
            whileHover="hover"
            animate="rest"
          >
            <motion.span
              className="relative flex h-8 w-8 items-center justify-center"
              variants={{ rest: { rotate: 0 }, hover: { rotate: 6 } }}
              transition={{ type: "spring", stiffness: 220, damping: 12 }}
            >
              <span className="absolute left-0 top-0 h-3 w-3 bg-cyan-300" />
              <span className="absolute right-0 top-0 h-3 w-3 bg-white/70" />
              <span className="absolute left-0 bottom-0 h-3 w-3 bg-white/40" />
            </motion.span>
            <span>Rezoomind</span>
          </MotionLink>
        </div>

        <nav className="hidden items-center justify-center gap-8 md:flex">
          {navLinks.map((link) => (
            <NavItem key={link.href} href={link.href} label={link.label} />
          ))}
        </nav>

        <div className="flex items-center justify-end gap-3">
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/60">
                  {`Welcome, ${displayName}`.toUpperCase()}
                </span>
                <motion.button
                  type="button"
                  onClick={handleSignOut}
                  className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/70 hover:border-white/30 hover:text-white"
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
                  "rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200 transition",
                  signInActive
                    ? "bg-cyan-300/15 text-cyan-100"
                    : "hover:bg-cyan-300/15 hover:text-cyan-100"
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
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white md:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-label="Toggle menu"
          >
            <span className="flex flex-col gap-1.5">
              <span className="h-0.5 w-5 bg-white" />
              <span className="h-0.5 w-5 bg-white/70" />
              <span className="h-0.5 w-5 bg-white/40" />
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
            className="overflow-hidden border-t border-white/5 bg-slate-950/95 md:hidden"
          >
            <div className="flex flex-col gap-4 px-6 py-6">
              {user ? (
                <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/60">
                  {`Welcome, ${displayName}`.toUpperCase()}
                </span>
              ) : null}
              {navLinks.map((link) => (
                <NavItem
                  key={link.href}
                  href={link.href}
                  label={link.label}
                  onClick={() => setMenuOpen(false)}
                />
              ))}
              {user ? (
                <motion.button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    handleSignOut();
                  }}
                  className="mt-2 inline-flex items-center justify-center rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/80"
                  whileHover={{ y: -1 }}
                  whileTap={{ y: 1 }}
                  transition={{ type: "spring", stiffness: 240, damping: 18 }}
                >
                  Log Out
                </motion.button>
              ) : (
                <MotionLink
                  href="/login"
                  className="mt-2 inline-flex items-center justify-center rounded-full border border-cyan-300/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100"
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
