"use client";

import Link from "next/link";
import type {
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
  } & Omit<HTMLAttributes<HTMLAnchorElement>, "className" | "children">;

type ButtonAsButton = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> & {
    href?: undefined;
  };

export type ButtonProps = ButtonAsLink | ButtonAsButton;

const baseStyles =
  "inline-flex items-center justify-center gap-2 font-mono text-xs uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-orange-600 disabled:pointer-events-none disabled:opacity-60";

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "border border-orange-600/50 bg-orange-600/10 text-orange-500 hover:bg-orange-600/20",
  secondary:
    "border border-stone-700 bg-transparent text-stone-400 hover:border-orange-600/50 hover:text-orange-500",
  ghost: "text-stone-500 hover:text-orange-500",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-4 py-2",
  md: "px-6 py-3",
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
        {...rest}
      >
        {children}
      </Link>
    );
  }

  const { type, ...rest } = props as ButtonAsButton;
  return (
    <button
      type={type ?? "button"}
      className={classes}
      {...rest}
    >
      {children}
    </button>
  );
}
