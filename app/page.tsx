"use client";

import { motion } from "framer-motion";

import { BackgroundMotion } from "@/components/BackgroundMotion";
import { HeroMascot } from "@/components/HeroMascot";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LogoMarquee } from "@/components/LogoMarquee";
import { Pricing } from "@/components/Pricing";
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

const hookStats = [
  { kicker: "reduce", value: "90%", label: "manual input" },
  { kicker: "more than", value: "1M", label: "postings tracked" },
  { kicker: "save up to", value: "15", label: "minutes per search" },
];

export default function HomePage() {
  return (
    <div className="relative overflow-hidden bg-white">
      <section className="relative mx-auto flex max-w-6xl flex-col gap-16 px-6 py-20">
        <div className="relative overflow-hidden">
          <BackgroundMotion />
          <div className="relative z-10 grid items-center gap-12 md:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              <motion.span
                {...fadeUp}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.32em] text-brand"
              >
                Verified internship signals
              </motion.span>
              <motion.h1
                {...fadeUp}
                transition={{ duration: 0.6, delay: 0.08 }}
                className="text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl"
              >
                Verified internship alerts delivered to your inbox.
              </motion.h1>
              <motion.p
                {...fadeUp}
                transition={{ duration: 0.6, delay: 0.16 }}
                className="max-w-xl text-base leading-relaxed text-slate-600"
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
                <Button href="/#pricing" variant="secondary">
                  View Pricing
                </Button>
              </motion.div>
            </div>

            <motion.div
              {...fadeUp}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="flex justify-center"
            >
              <HeroMascot />
            </motion.div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature, index) => (
            <Card
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
            >
              <h3 className="text-lg font-semibold text-slate-900">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
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
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-brand">
            Email updates
          </p>
          <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
            Get new internships delivered weekly.
          </h2>
          <p className="text-sm text-slate-600">
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
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-brand">
            Apply faster with verified sources
          </p>
          <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
            Apply to more than 1 million postings from your favorite companies.
          </h2>
          <p className="text-sm text-slate-600">
            Rezoomind keeps the signal high so you can move faster with confidence.
          </p>
        </motion.div>

        <LogoMarquee />

        <div className="grid gap-6 md:grid-cols-3">
          {hookStats.map((stat) => (
            <div
              key={stat.value}
              className="rounded-3xl border border-slate-200 bg-white px-6 py-7 text-slate-900 shadow-[0_18px_45px_rgba(15,23,42,0.08)]"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                {stat.kicker}
              </p>
              <p className="mt-3 text-4xl font-semibold text-slate-900 sm:text-5xl">
                {stat.value}
              </p>
              <p className="mt-2 text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <Pricing />
    </div>
  );
}
