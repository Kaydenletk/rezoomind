import { Suspense } from "react";

import { Pricing } from "@/components/Pricing";

export default function PricingPage() {
  return (
    <Suspense
      fallback={
        <section className="relative mx-auto flex max-w-6xl flex-col gap-10 px-6 py-20">
          <div className="max-w-md space-y-3 border border-stone-800 bg-stone-900 p-6">
            <p className="text-sm text-stone-400">Loading pricing...</p>
          </div>
        </section>
      }
    >
      <Pricing />
    </Suspense>
  );
}
