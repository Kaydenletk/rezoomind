"use client";

import { motion } from "framer-motion";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SubscribeForm() {
  const [email, setEmail] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [note, setNote] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!emailRegex.test(email.trim())) {
      setStatus("error");
      setNote("Enter a valid email address.");
      return;
    }

    try {
      setStatus("loading");
      setNote("");

      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, interests }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) {
        setStatus("error");
        setNote(data?.error ?? "Unable to subscribe. Try again.");
        return;
      }

      setStatus("success");
      setNote("Check your inbox to confirm.");
      setEmail("");
      setInterests([]);
    } catch {
      setStatus("error");
      setNote("Network error. Try again.");
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      whileHover={{ scale: 1.01, boxShadow: "0 26px 70px var(--brand-glow)" }}
      transition={{ type: "spring", stiffness: 200, damping: 18 }}
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)]"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <Input
          type="email"
          placeholder="you@school.edu"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={status === "loading"}
          className="md:flex-1"
        />
        <Button
          type="submit"
          variant="primary"
          className="md:min-w-[160px]"
          disabled={status === "loading"}
        >
          {status === "loading" ? "Subscribing..." : "Subscribe"}
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {["SWE", "ML", "Data", "Frontend", "Backend", "DevOps"].map((option) => {
          const selected = interests.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() =>
                setInterests((prev) =>
                  prev.includes(option)
                    ? prev.filter((item) => item !== option)
                    : [...prev, option]
                )
              }
              className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] transition ${
                selected
                  ? "border-[rgba(var(--brand-rgb),0.5)] bg-[var(--brand-tint)] text-slate-900"
                  : "border-slate-200 text-slate-500 hover:border-[rgba(var(--brand-rgb),0.5)]"
              }`}
              disabled={status === "loading"}
            >
              {option}
            </button>
          );
        })}
      </div>

      {note ? (
        <p
          className={`mt-3 text-sm ${
            status === "success" ? "text-emerald-600" : "text-rose-500"
          }`}
        >
          {note}
        </p>
      ) : null}
    </motion.form>
  );
}
