"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { ArrowRight } from "lucide-react";
import { AuthCardShell } from "@/components/auth/AuthCardShell";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = useMemo(() => {
    const candidate = searchParams.get("next");
    if (candidate?.startsWith("/") && !candidate.startsWith("//")) {
      return candidate;
    }
    return "/feed";
  }, [searchParams]);

  const [form, setForm] = useState({ email: "", password: "" });
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [note, setNote] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!emailRegex.test(form.email) || form.password.length < 8) {
      setStatus("error");
      setNote("invalid credentials format.");
      return;
    }

    try {
      setStatus("loading");
      setNote("authenticating...");

      const res = await signIn("credentials", {
        redirect: false,
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      if (res?.error) {
        setStatus("error");
        setNote(res.error.toLowerCase());
        return;
      }

      setStatus("success");
      setNote("success — redirecting...");
      setTimeout(() => {
        router.push(nextPath);
        router.refresh();
      }, 800);
    } catch {
      setStatus("error");
      setNote("network error. try again.");
    }
  };

  return (
    <AuthCardShell>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <div>
          <h1 className="text-sm font-bold text-stone-900 tracking-wider dark:text-stone-200">
            sign_in
          </h1>
          <p className="mt-1 text-[11px] text-stone-500 dark:text-stone-500">
            &gt;_ access your dashboard and alerts
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500">
              email
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-600">&gt;</span>
              <input
                type="email"
                spellCheck={false}
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                className="w-full bg-transparent border-b border-stone-800 focus:border-orange-600 outline-none text-stone-200 py-1.5 font-mono text-sm transition-colors"
                placeholder="user@domain.com"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500">
              password
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-600">&gt;</span>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                className="w-full bg-transparent border-b border-stone-800 focus:border-orange-600 outline-none text-stone-200 py-1.5 font-mono text-sm tracking-[0.15em] transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="h-5">
            {note && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`text-[11px] font-mono ${
                  status === "success"
                    ? "text-green-500"
                    : status === "error"
                    ? "text-red-400"
                    : "text-stone-400"
                }`}
              >
                {status === "success" && "▸ "}
                {status === "error" && "✗ "}
                {status === "loading" && "⋯ "}
                {note}
              </motion.p>
            )}
          </div>

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full flex items-center justify-center gap-2 border border-orange-600/50 bg-orange-600/10 py-2.5 text-xs font-bold tracking-[0.15em] text-orange-500 transition-all hover:bg-orange-600/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {status === "loading" ? (
              <span className="animate-pulse">processing...</span>
            ) : (
              <>
                sign_in
                <ArrowRight className="h-3.5 w-3.5 opacity-50 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
              </>
            )}
          </button>

          <button
            type="button"
            className="w-full border border-stone-800 bg-stone-900/30 py-2.5 text-xs tracking-[0.15em] text-stone-500 transition-all hover:bg-stone-800/50"
          >
            continue_with_google
          </button>

          <div className="pt-4 border-t border-stone-800/50 text-center">
            <p className="text-[11px] text-stone-500">
              no account?{" "}
              <Link
                href="/signup"
                className="text-orange-500 underline decoration-orange-500/20 underline-offset-4 transition-colors hover:text-orange-400"
              >
                create_account
              </Link>
            </p>
          </div>
        </form>
      </motion.div>
    </AuthCardShell>
  );
}
