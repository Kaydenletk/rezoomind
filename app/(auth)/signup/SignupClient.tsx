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
    {
      key: "email",
      label: "Email",
      type: "email",
      placeholder: "name@school.edu",
    },
    {
      key: "confirmEmail",
      label: "Confirm email",
      type: "email",
      placeholder: "Re-enter your email",
    },
    {
      key: "password",
      label: "Password",
      type: "password",
      placeholder: "Create a password",
    },
    {
      key: "confirmPassword",
      label: "Confirm password",
      type: "password",
      placeholder: "Re-enter your password",
    },
  ] as const;

  return (
    <AuthCardShell>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <div>
          <h1 className={authCardTitleClassName}>Create your account</h1>
          <p className={authCardSubtitleClassName}>
            Set up your profile and start tracking new roles.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {fields.map((f) => (
            <div key={f.key} className="space-y-2">
              <label className={authFieldLabelClassName}>{f.label}</label>
              <input
                type={f.type}
                spellCheck={false}
                value={form[f.key]}
                onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                className={authInputClassName}
                placeholder={f.placeholder}
              />
            </div>
          ))}

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
              <span className="animate-pulse">Creating account...</span>
            ) : (
              <>
                Create account
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
              Already have an account?{" "}
              <Link href="/login" className={authInlineLinkClassName}>
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </motion.div>
    </AuthCardShell>
  );
}
