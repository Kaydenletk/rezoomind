import { Suspense } from "react";

import LoginClient from "./LoginClient";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex max-w-4xl flex-col gap-10 px-6 py-20">
          <div className="max-w-md space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
            <p className="text-sm text-white/70">Loading sign-in...</p>
          </div>
        </div>
      }
    >
      <LoginClient />
    </Suspense>
  );
}
