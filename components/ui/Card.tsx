"use client";

import { motion, type HTMLMotionProps } from "framer-motion";

import { cn } from "@/lib/utils";

type CardProps = HTMLMotionProps<"div"> & {
  highlighted?: boolean;
};

export function Card({ highlighted, className, ...props }: CardProps) {
  return (
    <motion.div
      whileHover={{ y: highlighted ? -6 : -4 }}
      transition={{ type: "spring", stiffness: 220, damping: 18 }}
      className={cn(
        "rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)] transition-shadow hover:shadow-[0_28px_70px_rgba(15,23,42,0.12)]",
        highlighted &&
          "border-[rgba(var(--brand-rgb),0.4)] bg-[var(--brand-tint)] shadow-[0_28px_70px_var(--brand-glow)] hover:shadow-[0_34px_90px_var(--brand-glow)] md:scale-[1.02]",
        className
      )}
      {...props}
    />
  );
}
