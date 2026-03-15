"use client";

import { SessionProvider, useSession, signOut as nextAuthSignOut, signIn } from "next-auth/react";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}

// Temporary hook wrapper to make transitioning from Supabase easier
// Provide the same shape API as before
export function useAuth() {
  const { data: session, status } = useSession();

  const loading = status === "loading";
  const user = session?.user ?? null;
  const isAuthenticated = status === "authenticated";

  const signOut = async () => {
    await nextAuthSignOut({ callbackUrl: "/" });
  };

  return { user, session, loading, isAuthenticated, signOut, signIn };
}
