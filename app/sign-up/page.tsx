"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignUpPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [note, setNote] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.name.trim()) {
      setStatus("error");
      setNote("Enter your name to continue.");
      return;
    }

    if (!emailRegex.test(form.email)) {
      setStatus("error");
      setNote("Enter a valid email address.");
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
      const response = await fetch("/api/auth/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.ok) {
        setStatus("error");
        setNote(data?.error ?? "Unable to sign up. Try again.");
        return;
      }

      setStatus("success");
      setNote("Account created. Redirecting...");
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
          placeholder="Name"
          value={form.name}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, name: event.target.value }))
          }
        />
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
          <Link href="/sign-in" className="text-cyan-200">
            Sign in
          </Link>
          .
        </p>
      </motion.form>
    </div>
  );
}
