"use client";

// NOTE: Use motion.a inside Link to avoid motion(Link) prop conflicts.
import Link from "next/link";
import { motion } from "framer-motion";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  HTMLAttributes,
  ReactNode,
} from "react";
import type { LinkProps } from "next/link";

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
  Partial<Pick<LinkProps, "prefetch" | "replace" | "scroll" | "shallow" | "locale">> & {
    href: LinkProps["href"];
    target?: string;
    rel?: string;
  } & Omit<
    HTMLAttributes<HTMLSpanElement>,
    | "className"
    | "children"
    | "onAnimationStart"
    | "onAnimationEnd"
    | "onDrag"
    | "onDragStart"
    | "onDragEnd"
    | "onDragEnter"
    | "onDragLeave"
    | "onDragOver"
    | "onDragExit"
    | "onDragCapture"
  >;

type ButtonAsButton = CommonProps &
  Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    | "className"
    | "onAnimationStart"
    | "onAnimationEnd"
    | "onDrag"
    | "onDragStart"
    | "onDragEnd"
    | "onDragEnter"
    | "onDragLeave"
    | "onDragOver"
    | "onDragExit"
    | "onDragCapture"
  > & {
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

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  const classes = cn(baseStyles, variantStyles[variant], sizeStyles[size], className);

  if ("href" in props && props.href) {
    const { href, prefetch, replace, scroll, shallow, locale, target, rel, ...rest } = props;
    return (
      <Link
        href={href}
        prefetch={prefetch}
        replace={replace}
        scroll={scroll}
        shallow={shallow}
        locale={locale}
        className={classes}
        target={target}
        rel={rel}
      >
        <motion.span
          whileHover={{ y: -2 }}
          whileTap={{ y: 1, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          {...rest}
        >
          {children}
        </motion.span>
      </Link>
    );
  }

  const { type, ...rest } = props as ButtonAsButton;
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
