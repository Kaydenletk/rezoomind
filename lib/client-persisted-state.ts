const STORAGE_EVENT_NAME = "rezoomind:storage-change";

export const MARKET_BANNER_STORAGE_KEY = "market-banner";
export const APPLIED_JOBS_STORAGE_KEY = "rezoomind_applied_jobs";
export const THEME_STORAGE_KEY = "theme";

export type ThemeMode = "light" | "dark";

type ClassListLike = {
  contains(token: string): boolean;
};

export function isDarkThemeEnabled(classList: ClassListLike | null | undefined): boolean {
  return Boolean(classList?.contains("dark"));
}

export function getInitialThemeMode(
  storedValue: string | null,
  prefersDark: boolean,
): ThemeMode {
  if (storedValue === "dark") {
    return "dark";
  }

  if (storedValue === "light") {
    return "light";
  }

  return prefersDark ? "dark" : "light";
}

export function getInitialMarketBannerState(storedValue: string | null, collapsible: boolean) {
  if (!collapsible) {
    return { dismissed: false, open: true };
  }

  if (storedValue === "dismissed") {
    return { dismissed: true, open: true };
  }

  if (storedValue === "closed") {
    return { dismissed: false, open: false };
  }

  return { dismissed: false, open: true };
}

export function getInitialAppliedJobs(storedValue: string | null): Set<string> {
  if (!storedValue) {
    return new Set();
  }

  try {
    const parsed = JSON.parse(storedValue);
    if (!Array.isArray(parsed)) {
      return new Set();
    }

    return new Set(parsed.filter((value): value is string => typeof value === "string"));
  } catch {
    return new Set();
  }
}

export function readStoredValue(key: string): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(key);
}

export function writeStoredValue(key: string, value: string | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (value === null) {
    window.localStorage.removeItem(key);
  } else {
    window.localStorage.setItem(key, value);
  }

  window.dispatchEvent(new CustomEvent(STORAGE_EVENT_NAME, { detail: { key } }));
}

export function subscribeToStoredValue(key: string, callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === key) {
      callback();
    }
  };

  const handleCustomStorage = (event: Event) => {
    const detail = (event as CustomEvent<{ key?: string }>).detail;
    if (detail?.key === key) {
      callback();
    }
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(STORAGE_EVENT_NAME, handleCustomStorage as EventListener);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(STORAGE_EVENT_NAME, handleCustomStorage as EventListener);
  };
}

export function subscribeToThemeClass(callback: () => void) {
  if (typeof document === "undefined") {
    return () => {};
  }

  const observer = new MutationObserver(() => callback());
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });

  return () => observer.disconnect();
}
