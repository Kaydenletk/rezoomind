"use client";

import { useRouter } from "next/navigation";

import { useAuth as useAuthContext } from "@/components/AuthProvider";

type AuthState = ReturnType<typeof useAuthContext> & {
  isAuthenticated: boolean;
  signIn: () => void;
};

export function useAuth(): AuthState {
  const router = useRouter();
  const auth = useAuthContext();

  return {
    ...auth,
    isAuthenticated: Boolean(auth.user),
    signIn: () => router.push("/login"),
  };
}
