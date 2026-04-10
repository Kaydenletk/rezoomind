"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { ArrowRight } from "lucide-react";
import { AuthCardShell } from "@/components/auth/AuthCardShell";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignupClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = useMemo(() => {
    const candidate = searchParams.get("next");
    if (candidate?.startsWith("/") && !candidate.startsWith("//")) {
      return candidate;
    }
    return "/feed";
  }, [searchParams]);

  const [form, setForm] = useState({
    email: "",
    confirmEmail: "",
    password: "",
    confirmPassword: "",
  });

  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [note, setNote] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!emailRegex.test(form.email)) {
      setStatus("error");
      setNote("invalid email format.");
      return;
    }

    if (form.confirmEmail && form.confirmEmail !== form.email) {
      setStatus("error");
      setNote("emails do not match.");
      return;
    }

    if (form.password.length < 8) {
      setStatus("error");
      setNote("password must be 8+ characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setStatus("error");
      setNote("passwords do not match.");
      return;
    }

    try {
      setStatus("loading");
      setNote("registering...");

      const email = form.email.trim().toLowerCase();

      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: form.password }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setStatus("error");
        setNote(data.error?.toLowerCase() || "registration failed.");
        return;
      }

      setNote("signing in...");

      const loginRes = await signIn("credentials", {
        redirect: false,
        email,
        password: form.password,
      });

      if (loginRes?.error) {
        setStatus("error");
        setNote(loginRes.error.toLowerCase());
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

  const fields = [
    { key: "email", label: "email", type: "email", placeholder: "user@domain.com", tracking: "" },
    { key: "confirmEmail", label: "confirm email", type: "email", placeholder: "user@domain.com", tracking: "" },
    { key: "password", label: "password", type: "password", placeholder: "••••••••", tracking: "tracking-[0.15em]" },
    { key: "confirmPassword", label: "confirm password", type: "password", placeholder: "••••••••", tracking: "tracking-[0.15em]" },
  ] as const;

  return (
    <AuthCardShell>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-5"
      >
        <div>
          <h1 className="text-sm font-bold tracking-wider text-stone-900 dark:text-stone-200">
            create_account
          </h1>
          <p className="mt-1 text-[11px] text-stone-500 dark:text-stone-500">
            &gt;_ get verified internship alerts tailored to you
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {fields.map((f) => (
            <div key={f.key} className="space-y-1.5">
              <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500">
                {f.label}
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-600">&gt;</span>
                <input
                  type={f.type}
                  spellCheck={false}
                  value={form[f.key]}
                  onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                  className={`w-full bg-transparent border-b border-stone-800 focus:border-orange-600 outline-none text-stone-200 py-1.5 font-mono text-sm transition-colors ${f.tracking}`}
                  placeholder={f.placeholder}
                />
              </div>
            </div>
          ))}

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
                create_account
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
              already have an account?{" "}
              <Link
                href="/login"
                className="text-orange-500 underline decoration-orange-500/20 underline-offset-4 transition-colors hover:text-orange-400"
              >
                sign_in
              </Link>
            </p>
          </div>
        </form>
      </motion.div>
    </AuthCardShell>
  );
}
