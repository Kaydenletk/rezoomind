"use client";

import { motion } from "framer-motion";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SubscribeForm } from "@/components/SubscribeForm";

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

const companyLogos = [
  "TikTok",
  "Capital One",
  "NVIDIA",
  "OpenAI",
  "Airbnb",
  "Stripe",
];

const hookStats = [
  { kicker: "reduce", value: "90%", label: "manual input" },
  { kicker: "more than", value: "1M", label: "postings tracked" },
  { kicker: "save up to", value: "15", label: "minutes per search" },
];

export default function HomePage() {
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
              <Button href="/signup" variant="primary">
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

      <section className="relative mx-auto flex max-w-5xl flex-col gap-8 px-6 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="space-y-3"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-200/70">
            Email updates
          </p>
          <h2 className="text-3xl font-semibold text-white sm:text-4xl">
            Get new internships delivered weekly.
          </h2>
          <p className="text-sm text-white/60">
            Subscribe for verified alerts and never miss a fresh listing.
          </p>
        </motion.div>

        <SubscribeForm />
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
            Apply faster with verified sources
          </p>
          <h2 className="text-3xl font-semibold text-white sm:text-4xl">
            Apply to more than 1 million postings from your favorite companies.
          </h2>
          <p className="text-sm text-white/60">
            Rezoomind keeps the signal high so you can move faster with confidence.
          </p>
        </motion.div>

        <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-6 shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
          <div className="flex items-center gap-10 overflow-x-auto pb-2 md:justify-between md:overflow-visible">
            {companyLogos.map((company) => (
              <div
                key={company}
                className="flex min-w-[140px] items-center justify-center text-base font-semibold text-white/50 sm:text-lg"
              >
                {company}
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {hookStats.map((stat) => (
            <div
              key={stat.value}
              className="rounded-3xl border border-white/10 bg-white/5 px-6 py-7 text-white shadow-[0_18px_45px_rgba(0,0,0,0.35)]"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/50">
                {stat.kicker}
              </p>
              <p className="mt-3 text-4xl font-semibold text-cyan-200 sm:text-5xl">
                {stat.value}
              </p>
              <p className="mt-2 text-sm font-semibold uppercase tracking-[0.24em] text-white/70">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
