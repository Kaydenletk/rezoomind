import { cn } from "@/lib/utils";

type LiveDotProps = {
  className?: string;
};

export function LiveDot({ className }: LiveDotProps) {
  return (
    <span className={cn("relative inline-flex h-2.5 w-2.5", className)}>
      <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--brand-tint)] motion-safe:animate-ping" />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[rgb(var(--brand-rgb))] shadow-[0_0_12px_var(--brand-glow)]" />
    </span>
  );
}
