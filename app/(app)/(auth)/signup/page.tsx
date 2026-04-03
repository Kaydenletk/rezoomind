import { Suspense } from "react";

import SignupClient from "./SignupClient";

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex max-w-4xl flex-col gap-10 px-6 py-20">
          <div className="max-w-md space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
            <p className="text-sm text-slate-600">Loading sign-up...</p>
          </div>
        </div>
      }
    >
      <SignupClient />
    </Suspense>
  );
}
