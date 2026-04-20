"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { ArrowRight } from "lucide-react";
import {
  AuthCardShell,
  authCardSubtitleClassName,
  authCardTitleClassName,
  authFieldLabelClassName,
  authFooterClassName,
  authInlineLinkClassName,
  authInputClassName,
  authPrimaryButtonClassName,
  authSecondaryButtonClassName,
  authStatusClassName,
  authStatusToneClassNames,
} from "@/components/auth/AuthCardShell";

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
          <h1 className={authCardTitleClassName}>Welcome back</h1>
          <p className={authCardSubtitleClassName}>
            Sign in to manage your internship alerts.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className={authFieldLabelClassName}>Email</label>
            <input
              type="email"
              spellCheck={false}
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              className={authInputClassName}
              placeholder="name@school.edu"
            />
          </div>

          <div className="space-y-2">
            <label className={authFieldLabelClassName}>Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              className={authInputClassName}
              placeholder="Enter your password"
            />
          </div>

          <div className="min-h-11">
            {note && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`${authStatusClassName} ${
                  status === "success"
                    ? authStatusToneClassNames.success
                    : status === "error"
                    ? authStatusToneClassNames.error
                    : authStatusToneClassNames.neutral
                }`}
              >
                {note}
              </motion.p>
            )}
          </div>

          <button
            type="submit"
            disabled={status === "loading"}
            className={authPrimaryButtonClassName}
          >
            {status === "loading" ? (
              <span className="animate-pulse">Signing in...</span>
            ) : (
              <>
                Sign in
                <ArrowRight className="h-3.5 w-3.5 opacity-50 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
              </>
            )}
          </button>

          <button
            type="button"
            className={authSecondaryButtonClassName}
          >
            Continue with Google
          </button>

          <div className={authFooterClassName}>
            <p>
              New here?{" "}
              <Link href="/signup" className={authInlineLinkClassName}>
                Create an account
              </Link>
            </p>
          </div>
        </form>
      </motion.div>
    </AuthCardShell>
  );
}
