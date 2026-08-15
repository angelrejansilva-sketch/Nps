"use client";

import type { ButtonHTMLAttributes, CSSProperties } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

const VARIANT_STYLE: Record<ButtonVariant, CSSProperties> = {
  primary: { background: "var(--series-1)", color: "#ffffff", borderColor: "var(--series-1)" },
  secondary: { background: "var(--surface-2)", color: "var(--text-primary)", borderColor: "var(--border)" },
  ghost: { background: "transparent", color: "var(--text-secondary)", borderColor: "var(--border)" },
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({ variant = "secondary", className = "", style, ...props }: ButtonProps) {
  return (
    <button
      className={`rounded-lg border px-3.5 py-2 text-sm font-medium transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      style={{ ...VARIANT_STYLE[variant], ...style }}
      {...props}
    />
  );
}
