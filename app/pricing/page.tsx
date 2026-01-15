import { Suspense } from "react";

import { Pricing } from "@/components/Pricing";

export default function PricingPage() {
  return (
    <Suspense
      fallback={
        <section className="relative mx-auto flex max-w-6xl flex-col gap-10 px-6 py-20">
          <div className="max-w-md space-y-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
            <p className="text-sm text-slate-600">Loading pricing...</p>
          </div>
        </section>
      }
    >
      <Pricing />
    </Suspense>
  );
}
