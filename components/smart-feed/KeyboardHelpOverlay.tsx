"use client";

import { useEffect, useRef } from "react";

interface KeyboardHelpOverlayProps {
  open: boolean;
  onClose: () => void;
}

const SHORTCUTS: { key: string; label: string }[] = [
  { key: "j", label: "next job" },
  { key: "k", label: "prev job" },
  { key: "s", label: "save / unsave" },
  { key: "t", label: "open tailor" },
  { key: "a", label: "apply (open url)" },
  { key: "/", label: "focus search" },
  { key: "?", label: "toggle this help" },
  { key: "esc", label: "clear / close" },
];

export function KeyboardHelpOverlay({ open, onClose }: KeyboardHelpOverlayProps) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeBtnRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-surface-raised border border-line w-[440px] max-w-[92vw] shadow-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-7 border-b border-line-subtle bg-surface-sunken flex items-center px-3 gap-1.5">
          <div className="w-2 h-2 rounded-full bg-fg-subtle/40" />
          <div className="w-2 h-2 rounded-full bg-fg-subtle/40" />
          <div className="w-2 h-2 rounded-full bg-fg-subtle/40" />
          <span className="text-[10px] text-fg-subtle ml-2 tracking-wider">help.exe</span>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            className="ml-auto text-fg-muted hover:text-fg font-mono text-xs"
            aria-label="Close help"
          >
            ×
          </button>
        </div>
        <div className="p-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-fg-subtle font-mono mb-3">
            Keyboard shortcuts
          </p>
          <ul className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
            {SHORTCUTS.map(({ key, label }) => (
              <li key={key} className="contents">
                <span className="font-mono text-xs text-fg bg-surface-sunken border border-line px-2 py-0.5 justify-self-start">
                  {key}
                </span>
                <span className="font-mono text-xs text-fg-muted self-center">{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
