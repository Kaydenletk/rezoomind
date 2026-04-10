"use client";

import { useSyncExternalStore } from "react";
import { Sun, Moon } from "lucide-react";

import {
  THEME_STORAGE_KEY,
  isDarkThemeEnabled,
  subscribeToThemeClass,
  writeStoredValue,
} from "@/lib/client-persisted-state";

export function ThemeToggle() {
  const dark = useSyncExternalStore(
    subscribeToThemeClass,
    () => isDarkThemeEnabled(document.documentElement.classList),
    () => false
  );

  function toggle() {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    writeStoredValue(THEME_STORAGE_KEY, next ? "dark" : "light");
  }

  return (
    <button
      onClick={toggle}
      className="p-1.5 rounded-md border border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
      aria-label="Toggle theme"
    >
      {dark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
    </button>
  );
}
