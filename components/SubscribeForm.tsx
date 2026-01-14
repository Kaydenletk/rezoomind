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
      whileHover={{ scale: 1.01, boxShadow: "0 26px 70px rgba(34,211,238,0.22)" }}
      transition={{ type: "spring", stiffness: 200, damping: 18 }}
      className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_22px_60px_rgba(0,0,0,0.35)] backdrop-blur"
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
                  ? "border-cyan-300/60 bg-cyan-500/10 text-cyan-100"
                  : "border-white/10 text-white/60 hover:border-white/30"
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
            status === "success" ? "text-emerald-300" : "text-rose-300"
          }`}
        >
          {note}
        </p>
      ) : null}
    </motion.form>
  );
}
