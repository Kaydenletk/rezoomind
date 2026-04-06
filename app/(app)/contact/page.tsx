"use client";

import { motion } from "framer-motion";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [note, setNote] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.name.trim() || !emailRegex.test(form.email) || !form.message) {
      setStatus("error");
      setNote("Please complete all fields with a valid email.");
      return;
    }

    try {
      setStatus("loading");
      setNote("");
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.ok) {
        setStatus("error");
        setNote(data?.error ?? "Something went wrong. Try again.");
        return;
      }

      setStatus("success");
      setNote("Thanks! We'll get back to you shortly.");
      setForm({ name: "", email: "", message: "" });
    } catch {
      setStatus("error");
      setNote("Network error. Try again.");
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-20">
      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-3xl font-semibold text-stone-100 font-mono sm:text-4xl"
      >
        Contact us
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="mt-3 text-base text-stone-400"
      >
        Let us know how we can help with verified internship alerts.
      </motion.p>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        onSubmit={handleSubmit}
        className="mt-10 space-y-5 border border-stone-800 bg-[#0c0c0c] p-6"
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
        <textarea
          placeholder="Message"
          rows={5}
          className="w-full bg-transparent border-0 border-b border-stone-800 rounded-none px-0 py-2 text-sm text-stone-200 placeholder:text-stone-600 transition focus:border-orange-600 focus:outline-none focus:ring-0 font-mono resize-none"
          value={form.message}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, message: event.target.value }))
          }
        />

        {note ? (
          <p
            className={`text-sm ${
              status === "success" ? "text-green-500" : "text-red-400"
            }`}
          >
            {note}
          </p>
        ) : null}

        <Button type="submit" variant="primary" disabled={status === "loading"}>
          {status === "loading" ? "Sending..." : "Send message"}
        </Button>
      </motion.form>
    </div>
  );
}
