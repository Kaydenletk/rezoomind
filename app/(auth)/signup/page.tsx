import { Suspense } from "react";
import { AuthCardShell } from "@/components/auth/AuthCardShell";
import SignupClient from "./SignupClient";

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <AuthCardShell>
          <div className="space-y-5 animate-pulse">
            <div className="space-y-2">
              <div className="h-4 w-28 rounded bg-stone-200 dark:bg-stone-800" />
              <div className="h-3 w-56 rounded bg-stone-200 dark:bg-stone-800" />
            </div>

            <div className="space-y-3">
              <div className="h-10 rounded border border-stone-200 bg-stone-100/80 dark:border-stone-800 dark:bg-stone-900/60" />
              <div className="h-10 rounded border border-stone-200 bg-stone-100/80 dark:border-stone-800 dark:bg-stone-900/60" />
              <div className="h-10 rounded border border-stone-200 bg-stone-100/80 dark:border-stone-800 dark:bg-stone-900/60" />
              <div className="h-10 rounded border border-orange-600/20 bg-orange-600/5 dark:border-orange-500/20 dark:bg-orange-500/10" />
            </div>

            <div className="flex items-center gap-3 text-xs text-stone-500 dark:text-stone-400">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-orange-500/80" />
              loading registration...
            </div>
          </div>
        </AuthCardShell>
      }
    >
      <SignupClient />
    </Suspense>
  );
}
