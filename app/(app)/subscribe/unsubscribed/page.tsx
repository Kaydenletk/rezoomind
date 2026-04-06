import { Suspense } from "react";

import SubscribeUnsubscribedClient from "./SubscribeUnsubscribedClient";

export default function SubscribeUnsubscribedPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-24">
          <div className="border border-stone-800 bg-stone-900 p-6">
            <p className="text-sm text-stone-400">Loading subscription status...</p>
          </div>
        </div>
      }
    >
      <SubscribeUnsubscribedClient />
    </Suspense>
  );
}
