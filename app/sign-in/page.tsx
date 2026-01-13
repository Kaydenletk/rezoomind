"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignInPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [note, setNote] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!emailRegex.test(form.email) || form.password.length < 8) {
      setStatus("error");
      setNote("Enter a valid email and password (8+ characters).");
      return;
    }

    try {
      setStatus("loading");
      setNote("");
      const response = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.ok) {
        setStatus("error");
        setNote(data?.error ?? "Unable to sign in. Try again.");
        return;
      }

      setStatus("success");
      setNote("Signed in. Redirecting...");
      setTimeout(() => router.push("/"), 800);
    } catch (error) {
      setStatus("error");
      setNote("Network error. Try again.");
    }
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-10 px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">
          Sign in to Rezoomind
        </h1>
        <p className="mt-3 text-base text-white/70">
          Access your verified alert settings and saved filters.
        </p>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        onSubmit={handleSubmit}
        className="max-w-md space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.35)]"
      >
        <Input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, email: event.target.value }))
          }
        />
        <Input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, password: event.target.value }))
          }
        />

        {note ? (
          <p
            className={`text-sm ${
              status === "success" ? "text-emerald-300" : "text-rose-300"
            }`}
          >
            {note}
          </p>
        ) : null}

        <Button
          type="submit"
          variant="primary"
          disabled={status === "loading"}
          className="w-full"
        >
          {status === "loading" ? "Signing in..." : "Sign In"}
        </Button>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="w-full"
        >
          Continue with Google
        </Button>

        <p className="text-xs text-white/50">
          New here?{" "}
          <Link href="/sign-up" className="text-cyan-200">
            Create an account
          </Link>
          .
        </p>
      </motion.form>
    </div>
  );
}
