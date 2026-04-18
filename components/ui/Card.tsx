"use client";

import { cn } from "@/lib/utils";

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  highlighted?: boolean;
};

export function Card({ highlighted, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "border border-line bg-surface-raised p-6",
        highlighted && "border-orange-600/40 bg-brand-primary-tint",
        className
      )}
      {...props}
    />
  );
}
