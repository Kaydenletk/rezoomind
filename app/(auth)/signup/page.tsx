import { Suspense } from "react";
import SignupClient from "./SignupClient";

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-lg">
          <div className="border border-stone-800 bg-[#0f0f0f] p-8">
            <p className="text-xs text-stone-500 animate-pulse">loading registration module...</p>
          </div>
        </div>
      }
    >
      <SignupClient />
    </Suspense>
  );
}
