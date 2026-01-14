"use client";

import { useEffect, useRef, type CSSProperties } from "react";

import { cn } from "@/lib/utils";

const tiles = [
  { top: "6%", left: "8%", size: 32, depth: 8, rotate: -6, shiftX: 10, shiftY: -8, duration: "22s" },
  { top: "18%", left: "72%", size: 26, depth: 12, rotate: 8, shiftX: -8, shiftY: 12, duration: "24s" },
  { top: "34%", left: "12%", size: 24, depth: 14, rotate: 4, shiftX: 12, shiftY: -6, duration: "20s" },
  { top: "46%", left: "82%", size: 30, depth: 18, rotate: -10, shiftX: -10, shiftY: 8, duration: "26s" },
  { top: "62%", left: "18%", size: 28, depth: 20, rotate: 6, shiftX: 8, shiftY: -12, duration: "28s" },
  { top: "70%", left: "58%", size: 22, depth: 16, rotate: -4, shiftX: -6, shiftY: 10, duration: "21s" },
  { top: "12%", left: "46%", size: 20, depth: 10, rotate: 10, shiftX: 6, shiftY: -10, duration: "23s" },
  { top: "78%", left: "76%", size: 26, depth: 22, rotate: -8, shiftX: -12, shiftY: 6, duration: "27s" },
];

type BackgroundMotionProps = {
  className?: string;
};

export function BackgroundMotion({ className }: BackgroundMotionProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) return;

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let rafId = 0;

    const blobs = Array.from(root.querySelectorAll<HTMLElement>("[data-blob]"));

    const handlePointer = (event: PointerEvent) => {
      const { innerWidth, innerHeight } = window;
      const x = (event.clientX / innerWidth - 0.5) * 2;
      const y = (event.clientY / innerHeight - 0.5) * 2;
      targetX = x;
      targetY = y;
    };

    const tick = () => {
      currentX += (targetX - currentX) * 0.06;
      currentY += (targetY - currentY) * 0.06;

      blobs.forEach((blob) => {
        const depth = Number(blob.dataset.depth ?? "16");
        const x = currentX * depth;
        const y = currentY * depth;
        blob.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      });

      rafId = window.requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", handlePointer, { passive: true });
    rafId = window.requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", handlePointer);
      window.cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className={cn(
        "pointer-events-none absolute inset-0 -z-10 overflow-hidden",
        className
      )}
    >
      <div className="absolute -top-24 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2">
        <div data-blob data-depth="12" className="h-full w-full">
          <div className="bg-blob-inner bg-blob-fast h-full w-full rounded-full bg-gradient-to-br from-[rgba(var(--brand-rgb),0.45)] via-[rgba(var(--brand-hover-rgb),0.25)] to-transparent blur-[90px]" />
        </div>
      </div>
      <div className="absolute right-[-6rem] top-24 h-[24rem] w-[24rem]">
        <div data-blob data-depth="18" className="h-full w-full">
          <div className="bg-blob-inner h-full w-full rounded-full bg-gradient-to-br from-[rgba(var(--brand-rgb),0.35)] via-[rgba(var(--brand-hover-rgb),0.18)] to-transparent blur-[90px]" />
        </div>
      </div>
      <div className="absolute bottom-[-10rem] left-12 h-[30rem] w-[30rem]">
        <div data-blob data-depth="22" className="h-full w-full">
          <div className="bg-blob-inner bg-blob-slow h-full w-full rounded-full bg-gradient-to-br from-[rgba(var(--brand-rgb),0.28)] via-[rgba(var(--brand-hover-rgb),0.16)] to-transparent blur-[100px]" />
        </div>
      </div>

      {tiles.map((tile, index) => (
        <div
          key={`${tile.top}-${tile.left}-${index}`}
          data-blob
          data-depth={tile.depth}
          className="absolute"
          style={{ top: tile.top, left: tile.left, width: tile.size, height: tile.size }}
          aria-hidden="true"
        >
          <div
            className="bg-tile-drift flex h-full w-full items-center justify-center rounded-2xl border border-[rgba(var(--brand-rgb),0.2)] bg-white/70 shadow-[0_18px_45px_rgba(15,23,42,0.12)] backdrop-blur"
            style={{
              "--tile-rotate": `${tile.rotate}deg`,
              "--tile-x": `${tile.shiftX}px`,
              "--tile-y": `${tile.shiftY}px`,
              animationDuration: tile.duration,
            } as CSSProperties}
          />
        </div>
      ))}
    </div>
  );
}
