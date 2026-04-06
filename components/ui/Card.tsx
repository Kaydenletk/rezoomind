"use client";

import { cn } from "@/lib/utils";

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  highlighted?: boolean;
};

export function Card({ highlighted, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "border border-stone-800 bg-[#0c0c0c] p-6",
        highlighted && "border-orange-600/40 bg-orange-600/5",
        className
      )}
      {...props}
    />
  );
}
