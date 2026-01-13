"use client";

import { motion } from "framer-motion";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
};

const features = [
  {
    title: "Verified Sources",
    description:
      "Every alert is backed by a credited source so you can apply with confidence.",
  },
  {
    title: "Smart Filters",
    description:
      "Target roles, locations, and timelines with precision filters that do the sorting.",
  },
  {
    title: "Weekly Digest",
    description:
      "One clean briefing each week plus instant alerts when new roles drop.",
  },
];

const steps = [
  {
    number: "01",
    title: "Connect",
    description: "Pick your roles, locations, and graduation year.",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6">
        <path
          d="M4 7h16M4 12h10M4 17h7"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Verify",
    description:
      "We collect postings only from credited sources and dedupe repeats.",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6">
        <path
          d="M12 3l7 3v5c0 5-3.5 8-7 10-3.5-2-7-5-7-10V6l7-3z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9 12l2 2 4-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Notify",
    description: "Get email alerts instantly or as a weekly digest.",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6">
        <path
          d="M6 16V10a6 6 0 1 1 12 0v6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4 16h16l-2 3H6l-2-3z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

const marqueeLabels = [
  "FAANG",
  "Big Tech",
  "Startups",
  "Fortune 500",
  "Research Labs",
  "Fintech",
  "Aerospace",
  "Healthcare",
];

export default function HomePage() {
  const [marqueeDuration, setMarqueeDuration] = useState(30);

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-400/20 blur-[120px]" />
        <div className="absolute right-10 top-24 h-64 w-64 rounded-full bg-indigo-500/20 blur-[130px]" />
        <div className="absolute bottom-10 left-8 h-64 w-64 rounded-full bg-emerald-400/10 blur-[120px]" />
      </div>

      <section className="relative mx-auto flex max-w-6xl flex-col gap-16 px-6 py-20">
        <div className="grid items-center gap-12 md:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <motion.span
              {...fadeUp}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.32em] text-cyan-200/80"
            >
              Verified internship signals
            </motion.span>
            <motion.h1
              {...fadeUp}
              transition={{ duration: 0.6, delay: 0.08 }}
              className="text-4xl font-semibold leading-tight text-white sm:text-5xl"
            >
              Verified internship alerts delivered to your inbox.
            </motion.h1>
            <motion.p
              {...fadeUp}
              transition={{ duration: 0.6, delay: 0.16 }}
              className="max-w-xl text-base leading-relaxed text-white/70"
            >
              Rezoomind curates openings from credited sources and sends real-time
              alerts so you can focus on applying, not searching.
            </motion.p>
            <motion.div
              {...fadeUp}
              transition={{ duration: 0.6, delay: 0.24 }}
              className="flex flex-col gap-4 sm:flex-row"
            >
              <Button href="/sign-up" variant="primary">
                Get Started
              </Button>
              <Button href="/pricing" variant="secondary">
                View Pricing
              </Button>
            </motion.div>
          </div>

          <motion.div
            {...fadeUp}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-8 shadow-[0_30px_80px_rgba(0,0,0,0.45)]"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-[0.32em] text-white/50">
                Next Alert
              </span>
              <span className="text-xs font-semibold text-cyan-200">Live</span>
            </div>
            <div className="mt-6 space-y-4">
              {[
                "Product Design Intern · Stripe",
                "Software Engineering Intern · Notion",
                "Growth Analyst Intern · Ramp",
              ].map((item, index) => (
                <div
                  key={item}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <span className="text-sm text-white/80">{item}</span>
                  <span className="text-xs text-white/50">{index + 1}h</span>
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-between text-xs text-white/50">
              <span>Weekly digest every Friday</span>
              <span className="rounded-full border border-white/10 px-3 py-1">
                Verified only
              </span>
            </div>
          </motion.div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature, index) => (
            <Card
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
            >
              <h3 className="text-lg font-semibold text-white">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>
      </section>

      <section className="relative mx-auto flex max-w-6xl flex-col gap-12 px-6 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="space-y-3"
        >
          <h2 className="text-3xl font-semibold text-white sm:text-4xl">
            How it works
          </h2>
          <p className="text-base text-white/70">
            Set filters once. Get verified internships automatically.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: 0.1 + index * 0.1 }}
              whileHover={{
                y: -4,
                boxShadow: "0 28px 60px rgba(34,211,238,0.18)",
              }}
              className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_18px_45px_rgba(0,0,0,0.35)] transition-colors hover:border-cyan-300/40"
            >
              <span className="pointer-events-none absolute right-5 top-4 text-6xl font-semibold text-white/10">
                {step.number}
              </span>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-cyan-200">
                  {step.icon}
                </div>
                <h3 className="text-lg font-semibold text-white">
                  {step.title}
                </h3>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-white/60">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="relative mx-auto flex max-w-6xl flex-col gap-10 px-6 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="space-y-3"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-200/70">
            Inspired by engineers from top tech teams
          </p>
          <h2 className="text-3xl font-semibold text-white sm:text-4xl">
            Trusted by engineers like you
          </h2>
          <p className="text-sm text-white/60">
            From students to early-career engineers
          </p>
        </motion.div>

        <div className="relative rounded-3xl border border-white/10 bg-white/5 px-4 py-6 shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-8 rounded-3xl bg-gradient-to-b from-slate-950/80 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 rounded-3xl bg-gradient-to-t from-slate-950/80 to-transparent" />

          <div className="hidden md:block">
            <motion.div
              className="flex w-max items-center gap-12 pr-12 text-xs font-semibold uppercase tracking-[0.4em] text-white/40"
              animate={{ x: ["-50%", "0%"] }}
              transition={{
                duration: marqueeDuration,
                ease: "linear",
                repeat: Infinity,
              }}
              onHoverStart={() => setMarqueeDuration(60)}
              onHoverEnd={() => setMarqueeDuration(30)}
            >
              {[...marqueeLabels, ...marqueeLabels].map((label, index) => (
                <span
                  key={`${label}-${index}`}
                  className="flex items-center gap-2"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
                  {label}
                </span>
              ))}
            </motion.div>
          </div>

          <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 md:hidden">
            {marqueeLabels.map((label) => (
              <div
                key={label}
                className="snap-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/40"
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
