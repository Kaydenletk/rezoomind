import { Suspense } from "react";

import UnsubscribeClient from "./UnsubscribeClient";

export default function UnsubscribePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-24">
          <div className="rounded-3xl border border-slate-200 bg-white p-6">
            <p className="text-sm text-slate-600">Loading unsubscribe status...</p>
          </div>
        </div>
      }
    >
      <UnsubscribeClient />
    </Suspense>
  );
}
