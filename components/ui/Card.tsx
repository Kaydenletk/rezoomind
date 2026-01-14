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
        "rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur transition-shadow hover:shadow-[0_32px_70px_rgba(0,0,0,0.45)]",
        highlighted &&
          "border-cyan-300/60 bg-cyan-500/10 shadow-[0_28px_70px_rgba(34,211,238,0.2)] hover:shadow-[0_34px_90px_rgba(34,211,238,0.28)] md:scale-[1.03]",
        className
      )}
      {...props}
    />
  );
}
