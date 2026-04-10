import { Suspense } from "react";
import LoginClient from "./LoginClient";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-lg">
          <div className="border border-stone-800 bg-[#0f0f0f] p-8">
            <p className="text-xs text-stone-500 animate-pulse">loading auth module...</p>
          </div>
        </div>
      }
    >
      <LoginClient />
    </Suspense>
  );
}
