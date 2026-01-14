"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md";

type CommonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
};

type ButtonAsLink = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "href"> & {
    href: string;
  };

type ButtonAsButton = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> & {
    href?: undefined;
  };

export type ButtonProps = ButtonAsLink | ButtonAsButton;

const baseStyles =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/40 focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-60";

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-cyan-200 text-slate-900 shadow-[0_12px_30px_rgba(34,211,238,0.25)] hover:bg-cyan-100",
  secondary:
    "border border-white/20 bg-white/5 text-white hover:border-white/40 hover:bg-white/10",
  ghost: "text-white/70 hover:text-white",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-xs",
  md: "px-6 py-3 text-sm",
};

const MotionLink = motion(Link) as any;

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  const classes = cn(baseStyles, variantStyles[variant], sizeStyles[size], className);

  if ("href" in props && props.href) {
    const { href, ...rest } = props;
    return (
      <MotionLink
        href={href}
        className={classes}
        whileHover={{ y: -2 }}
        whileTap={{ y: 1, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        {...rest}
      >
        {children}
      </MotionLink>
    );
  }

  const { type, ...rest } = props;
  return (
    <motion.button
      type={type ?? "button"}
      className={classes}
      whileHover={{ y: -2 }}
      whileTap={{ y: 1, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 260, damping: 18 }}
      {...rest}
    >
      {children}
    </motion.button>
  );
}
