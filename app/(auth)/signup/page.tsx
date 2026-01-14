"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const knownExistingUserMessages = [
  "user already registered",
  "already registered",
  "already exists",
  "user already exists",
];

export default function SignupPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
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
      setNote("Enter a valid email address.");
      return;
    }

    if (form.confirmEmail && form.confirmEmail !== form.email) {
      setStatus("error");
      setNote("Emails do not match.");
      return;
    }

    if (form.password.length < 8) {
      setStatus("error");
      setNote("Password must be at least 8 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setStatus("error");
      setNote("Passwords do not match.");
      return;
    }

    try {
      setStatus("loading");
      setNote("");
      const emailRedirectTo = `${window.location.origin}/login`;
      const { error } = await supabase.auth.signUp({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        options: { emailRedirectTo },
      });

      if (error) {
        const normalizedMessage = error.message.toLowerCase();
        if (knownExistingUserMessages.some((message) => normalizedMessage.includes(message))) {
          setStatus("error");
          setNote("Email already in use.");
          return;
        }
        setStatus("error");
        setNote(error.message);
        return;
      }

      setStatus("success");
      setNote("Signed in. Redirecting...");
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 800);
    } catch {
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
          Create your account
        </h1>
        <p className="mt-3 text-base text-white/70">
          Get verified internship alerts tailored to your goals.
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
          type="email"
          placeholder="Confirm email"
          value={form.confirmEmail}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, confirmEmail: event.target.value }))
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
        <Input
          type="password"
          placeholder="Confirm password"
          value={form.confirmPassword}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))
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
          {status === "loading" ? "Creating..." : "Sign Up"}
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
          Already have an account?{" "}
          <Link href="/login" className="text-cyan-200">
            Sign in
          </Link>
          .
        </p>
      </motion.form>
    </div>
  );
}
