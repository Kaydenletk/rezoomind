"use client";

import { motion } from "framer-motion";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const tiers = [
  {
    name: "Free",
    price: "$0",
    description: "Best for students just getting started.",
    features: ["Verified weekly digest", "Basic role alerts", "Community access"],
  },
  {
    name: "Pro",
    price: "$12",
    description: "Daily alerts with smart filtering and early access.",
    features: [
      "Daily verified alerts",
      "Advanced filters",
      "Early application reminders",
      "Priority support",
    ],
    highlighted: true,
  },
  {
    name: "Team",
    price: "$29",
    description: "For cohorts and student organizations.",
    features: [
      "Multiple inboxes",
      "Admin controls",
      "Shared pipelines",
      "Monthly performance report",
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">
          Pricing built for every stage
        </h1>
        <p className="mt-3 text-base text-white/70">
          Start free, upgrade when you need deeper filtering and team tools.
        </p>
      </motion.div>

      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {tiers.map((tier, index) => (
          <Card
            key={tier.name}
            highlighted={tier.highlighted}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 + index * 0.1 }}
            className="relative"
          >
            {tier.highlighted ? (
              <span className="absolute right-6 top-6 rounded-full border border-cyan-300/40 bg-cyan-300/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-cyan-100">
                Most Popular
              </span>
            ) : null}
            <h2 className="text-xl font-semibold text-white">{tier.name}</h2>
            <p className="mt-2 text-sm text-white/60">{tier.description}</p>
            <div className="mt-6 flex items-end gap-2">
              <span className="text-3xl font-semibold text-white">
                {tier.price}
              </span>
              <span className="text-xs text-white/50">/month</span>
            </div>
            <ul className="mt-6 space-y-2 text-sm text-white/65">
              {tier.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-300/70" />
                  {feature}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <Button variant={tier.highlighted ? "primary" : "secondary"}>
                Choose Plan
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
