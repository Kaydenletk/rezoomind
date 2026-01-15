"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";

const tiers = [
  {
    id: "starter",
    name: "Starter",
    price: "$0",
    period: "/mo",
    description: "Everything you need to get started.",
    features: ["Basic tracking", "5 email alerts", "Weekly digest"],
    cta: "Start Free",
  },
  {
    id: "pro",
    name: "Pro",
    price: "$9.99",
    period: "/mo",
    description: "For focused applicants who want speed.",
    trial: "7-day free trial, then $9.99/mo",
    features: ["25 companies", "Priority alerts", "Smart filters"],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    id: "premium",
    name: "Premium",
    price: "$19.99",
    period: "/mo",
    description: "Best for power users and teams.",
    features: ["Unlimited tracking", "Dedicated support", "Advanced matching"],
    cta: "Contact Sales",
  },
];

export function Pricing() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();
  const [pendingPlan, setPendingPlan] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const selectedPlan = searchParams.get("plan");

  useEffect(() => {
    if (!selectedPlan) return;
    const timer = window.setTimeout(() => setNote(""), 1200);
    return () => window.clearTimeout(timer);
  }, [selectedPlan]);

  const handleSelectPlan = (planId: string) => {
    setPendingPlan(planId);
    setNote("");

    if (!isAuthenticated) {
      const nextUrl = `/?plan=${planId}#pricing`;
      const authUrl = `/signup?next=${encodeURIComponent(nextUrl)}&plan=${planId}`;
      window.setTimeout(() => router.push(authUrl), 400);
      return;
    }

    setNote("Checkout is coming soon. We will notify you.");
    window.setTimeout(() => setPendingPlan(null), 500);
  };

  return (
    <section id="pricing" className="relative mx-auto flex max-w-6xl flex-col gap-10 px-6 py-20">
      <div className="max-w-2xl space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-brand">
          Pricing
        </p>
        <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
          Simple pricing for every internship hunt.
        </h2>
        <p className="text-sm text-slate-600">
          Start free, then upgrade when you want deeper coverage and faster alerts.
        </p>
      </div>

      {note ? (
        <p className="text-sm text-slate-600">{note}</p>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={`relative rounded-3xl border bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:shadow-[0_26px_60px_rgba(15,23,42,0.12)] ${
              tier.highlighted
                ? "border-[rgba(var(--brand-rgb),0.4)] shadow-[0_26px_70px_var(--brand-glow)] lg:scale-[1.02]"
                : "border-slate-200"
            } ${
              selectedPlan === tier.id
                ? "ring-2 ring-[var(--brand-ring)]"
                : ""
            }`}
          >
            {tier.highlighted ? (
              <span className="absolute right-6 top-6 rounded-full border border-[rgba(var(--brand-rgb),0.3)] bg-[var(--brand-tint)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-700">
                Recommended
              </span>
            ) : null}
            <h3 className="text-xl font-semibold text-slate-900">
              {tier.name}
            </h3>
            <p className="mt-2 text-sm text-slate-600">{tier.description}</p>
            <div className="mt-6 flex items-end gap-2">
              <span className="text-4xl font-semibold text-slate-900">
                {tier.price}
              </span>
              <span className="text-xs text-slate-500">{tier.period}</span>
            </div>
            {tier.trial ? (
              <p className="mt-2 text-xs text-slate-500">{tier.trial}</p>
            ) : null}
            <ul className="mt-6 space-y-2 text-sm text-slate-600">
              {tier.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--brand-tint)] text-brand">
                    <svg viewBox="0 0 20 20" className="h-3 w-3" aria-hidden="true">
                      <path
                        d="M5 10.5l3 3 7-7"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <Button
                variant={tier.highlighted ? "primary" : "secondary"}
                onClick={() => handleSelectPlan(tier.id)}
                disabled={pendingPlan === tier.id}
              >
                {pendingPlan === tier.id ? "Loading..." : tier.cta}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
