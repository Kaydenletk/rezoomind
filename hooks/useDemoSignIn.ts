"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

interface UseDemoSignInOptions {
  callbackUrl?: string;
}

export function useDemoSignIn(options?: UseDemoSignInOptions) {
  const callbackUrl = options?.callbackUrl ?? "/feed";
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [demoError, setDemoError] = useState(false);

  const handleDemoLogin = async () => {
    setIsDemoLoading(true);
    setDemoError(false);

    const result = await signIn("credentials", {
      email: process.env.NEXT_PUBLIC_DEMO_EMAIL ?? "demo@rezoomind.app",
      password: process.env.NEXT_PUBLIC_DEMO_PASSWORD ?? "demo_rezoomind_2026",
      callbackUrl,
      redirect: false,
    });

    if (result?.ok) {
      window.location.href = callbackUrl;
      return;
    }

    setIsDemoLoading(false);
    setDemoError(true);
  };

  return {
    demoError,
    handleDemoLogin,
    isDemoLoading,
  };
}
