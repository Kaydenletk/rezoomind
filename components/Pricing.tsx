"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/AuthProvider";
import { useHolidayPromo } from "@/hooks/useHolidayPromo";

const tiers = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "/forever",
    description: "Get started with job alerts, no account needed.",
    features: [
      "10 personalized jobs/week",
      "Weekly Monday digest",
      "Set role & location preferences",
      "5 RezoomAI tries in this browser",
      "Unsubscribe anytime",
    ],
    cta: "Subscribe Free",
    ctaAction: "subscribe" as const,
  },
  {
    id: "upgraded",
    name: "Registered",
    price: "$0",
    period: "/forever",
    description: "Create a free account for more features — same price, more power.",
    features: [
      "Everything in Free",
      "Keep RezoomAI unlocked after trial",
      "Browse unlimited jobs",
      "Save favorite jobs",
      "Track applications",
    ],
    cta: "Create Free Account",
    ctaAction: "signup" as const,
    highlighted: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$15",
    period: "/mo",
    description: "For serious job seekers who want every competitive edge.",
    features: [
      "Everything in Registered",
      "Unlimited AI analyses",
      "Cover letter generator",
      "LinkedIn optimizer",
      "Daily job alerts",
      "Priority support",
    ],
    cta: "Unlock Everything",
    ctaAction: "checkout" as const,
  },
];

export function Pricing() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();
  const { promo, getDiscountedPrice } = useHolidayPromo();
  const [pendingPlan, setPendingPlan] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const selectedPlan = searchParams.get("plan");

  useEffect(() => {
    if (!selectedPlan) return;
    const timer = window.setTimeout(() => setNote(""), 1200);
    return () => window.clearTimeout(timer);
  }, [selectedPlan]);

  const displayedTiers = tiers.map((tier) => {
    if (tier.id !== "pro" || !promo?.isActive) {
      return tier;
    }

    return {
      ...tier,
      price: `$${getDiscountedPrice(15).toFixed(0)}`,
      description: `${tier.description} ${promo.discountPercent}% off for ${promo.holidayName}.`,
      cta: `Go Pro (${promo.discountPercent}% off)`,
    };
  });

  const handleSelectPlan = (planId: string, action?: string) => {
    setPendingPlan(planId);
    setNote("");

    if (action === "subscribe") {
      // Scroll to email form at top of page
      window.scrollTo({ top: 0, behavior: "smooth" });
      window.setTimeout(() => setPendingPlan(null), 500);
      return;
    }

    if (action === "signup") {
      window.setTimeout(() => router.push("/signup"), 400);
      return;
    }

    if (action === "checkout") {
      if (!isAuthenticated) {
        const nextUrl = `/?plan=${planId}#pricing`;
        const authUrl = `/signup?next=${encodeURIComponent(nextUrl)}&plan=${planId}`;
        window.setTimeout(() => router.push(authUrl), 400);
        return;
      }

      setNote("Checkout is coming soon. We will notify you.");
      window.setTimeout(() => setPendingPlan(null), 500);
      return;
    }

    // Default fallback
    setNote("Coming soon!");
    window.setTimeout(() => setPendingPlan(null), 500);
  };

  return (
    <section id="pricing" className="relative mx-auto flex max-w-6xl flex-col gap-10 px-6 py-20">
      <div className="max-w-2xl space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-brand">
          Pricing
        </p>
        <h2 className="text-3xl font-semibold text-stone-100 sm:text-4xl font-mono">
          Start free. Upgrade only when you&apos;re ready.
        </h2>
        <p className="text-sm text-stone-400">
          Get full access with a free account. Upgrade to Pro only if you want unlimited AI, cover letters, and daily alerts.
        </p>
      </div>

      {promo?.isActive ? (
        <p className="rounded-none border border-orange-600/30 bg-orange-600/10 px-4 py-3 text-sm text-orange-200">
          {promo.holidayName} sale is live. Pro is {promo.discountPercent}% off until the countdown ends.
        </p>
      ) : null}

      {note ? (
        <p className="text-sm text-stone-400">{note}</p>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {displayedTiers.map((tier) => (
          <div
            key={tier.name}
            className={`relative border bg-[#0c0c0c] p-6 transition hover:-translate-y-1 ${tier.highlighted
                ? "border-[rgba(var(--brand-rgb),0.4)] lg:scale-[1.02]"
                : "border-stone-800"
              } ${selectedPlan === tier.id
                ? "ring-2 ring-[var(--brand-ring)]"
                : ""
              }`}
          >
            {tier.highlighted ? (
              <span className="absolute right-6 top-6 border border-[rgba(var(--brand-rgb),0.3)] bg-[var(--brand-tint)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-orange-400 font-mono">
                Recommended
              </span>
            ) : null}
            {promo?.isActive && tier.id === "pro" ? (
              <span className="absolute left-6 top-6 border border-orange-600/30 bg-orange-600/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-orange-400 font-mono">
                {promo.discountPercent}% Off
              </span>
            ) : null}
            <h3 className="text-xl font-semibold text-stone-100 font-mono">
              {tier.name}
            </h3>
            <p className="mt-2 text-sm text-stone-400">{tier.description}</p>
            <div className="mt-6 flex items-end gap-2">
              <span className="text-4xl font-semibold text-stone-100 font-mono">
                {tier.price}
              </span>
              <span className="text-xs text-stone-500">{tier.period}</span>
            </div>
            <ul className="mt-6 space-y-2 text-sm text-stone-400">
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
                onClick={() => handleSelectPlan(tier.id, tier.ctaAction)}
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
