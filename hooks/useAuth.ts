"use client";

import { useAuth as useAuthContext } from "@/components/AuthProvider";

type AuthState = ReturnType<typeof useAuthContext>;

export function useAuth(): AuthState {
  const auth = useAuthContext();

  return {
    ...auth,
  };
}
