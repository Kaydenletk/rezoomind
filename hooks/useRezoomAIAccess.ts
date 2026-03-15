"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

import { useAuth } from "@/components/AuthProvider";

const GUEST_REZOOMAI_CREDITS_KEY = "rezoomai:guest-credits:v1";
const GUEST_REZOOMAI_TRIAL_LIMIT = 5;
const GUEST_REZOOMAI_EVENT = "rezoomai:guest-credits-changed";

export function useRezoomAIAccess() {
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();
  const [remainingGuestCredits, setRemainingGuestCredits] = useState(
    GUEST_REZOOMAI_TRIAL_LIMIT
  );
  const [hydrated, setHydrated] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const readCredits = () => {
      try {
        const raw = window.localStorage.getItem(GUEST_REZOOMAI_CREDITS_KEY);
        if (!raw) {
          window.localStorage.setItem(
            GUEST_REZOOMAI_CREDITS_KEY,
            String(GUEST_REZOOMAI_TRIAL_LIMIT)
          );
          setRemainingGuestCredits(GUEST_REZOOMAI_TRIAL_LIMIT);
          return;
        }

        const parsed = Number(raw);
        setRemainingGuestCredits(
          Number.isFinite(parsed)
            ? Math.max(0, Math.min(GUEST_REZOOMAI_TRIAL_LIMIT, parsed))
            : GUEST_REZOOMAI_TRIAL_LIMIT
        );
      } catch {
        setRemainingGuestCredits(GUEST_REZOOMAI_TRIAL_LIMIT);
      }
    };

    const syncCredits = () => {
      readCredits();
    };

    window.addEventListener("storage", syncCredits);
    window.addEventListener(GUEST_REZOOMAI_EVENT, syncCredits);

    try {
      readCredits();
      setSearch(window.location.search ?? "");
    } finally {
      setHydrated(true);
    }

    return () => {
      window.removeEventListener("storage", syncCredits);
      window.removeEventListener(GUEST_REZOOMAI_EVENT, syncCredits);
    };
  }, []);

  const canUseAI = isAuthenticated || remainingGuestCredits > 0;
  const requiresLogin = !isAuthenticated && hydrated && remainingGuestCredits <= 0;
  const currentPath = useMemo(() => {
    return search ? `${pathname}${search}` : pathname;
  }, [pathname, search]);
  const loginHref = `/login?next=${encodeURIComponent(currentPath)}`;

  const consumeCredit = useCallback(() => {
    if (isAuthenticated) return true;
    if (remainingGuestCredits <= 0) return false;

    const nextValue = remainingGuestCredits - 1;
    setRemainingGuestCredits(nextValue);

    try {
      window.localStorage.setItem(GUEST_REZOOMAI_CREDITS_KEY, String(nextValue));
      window.dispatchEvent(new Event(GUEST_REZOOMAI_EVENT));
    } catch {
      // Ignore storage failures and keep in-memory state.
    }

    return true;
  }, [isAuthenticated, remainingGuestCredits]);

  const encouragement = requiresLogin
    ? "Your 5 free RezoomAI tries are used up. Log in to keep chatting and unlock the rest of the AI tools."
    : isAuthenticated
      ? "You are logged in. RezoomAI is fully unlocked."
      : `${remainingGuestCredits} of 5 free RezoomAI tries left in this browser. Log in to keep unlimited access.`;

  return {
    isAuthenticated,
    hydrated,
    remainingGuestCredits,
    canUseAI,
    requiresLogin,
    loginHref,
    encouragement,
    consumeCredit,
  };
}
