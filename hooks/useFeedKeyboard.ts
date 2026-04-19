"use client";

import { useEffect } from "react";

export interface FeedKeyboardHandlers {
  onNext: () => void;
  onPrev: () => void;
  onToggleSave: () => void;
  onTailor: () => void;
  onApply: () => void;
  onFocusSearch: () => void;
  onToggleHelp: () => void;
  onEscape: () => void;
}

function isEditableTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (el.isContentEditable) return true;
  return false;
}

export function useFeedKeyboard(handlers: FeedKeyboardHandlers, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isEditableTarget(e.target)) return;

      switch (e.key) {
        case "j":
          e.preventDefault();
          handlers.onNext();
          break;
        case "k":
          e.preventDefault();
          handlers.onPrev();
          break;
        case "s":
          e.preventDefault();
          handlers.onToggleSave();
          break;
        case "t":
          e.preventDefault();
          handlers.onTailor();
          break;
        case "a":
          e.preventDefault();
          handlers.onApply();
          break;
        case "/":
          e.preventDefault();
          handlers.onFocusSearch();
          break;
        case "?":
          e.preventDefault();
          handlers.onToggleHelp();
          break;
        case "Escape":
          handlers.onEscape();
          break;
        default:
          break;
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handlers, enabled]);
}
