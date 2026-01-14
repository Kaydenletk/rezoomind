import { Suspense } from "react";

import SubscribeUnsubscribedClient from "./SubscribeUnsubscribedClient";

export default function SubscribeUnsubscribedPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-24">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-white/70">Loading subscription status...</p>
          </div>
        </div>
      }
    >
      <SubscribeUnsubscribedClient />
    </Suspense>
  );
}
