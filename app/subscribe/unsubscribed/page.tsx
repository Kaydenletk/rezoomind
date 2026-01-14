import { Suspense } from "react";

import SubscribeUnsubscribedClient from "./SubscribeUnsubscribedClient";

export default function SubscribeUnsubscribedPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-24">
          <div className="rounded-3xl border border-slate-200 bg-white p-6">
            <p className="text-sm text-slate-600">Loading subscription status...</p>
          </div>
        </div>
      }
    >
      <SubscribeUnsubscribedClient />
    </Suspense>
  );
}
