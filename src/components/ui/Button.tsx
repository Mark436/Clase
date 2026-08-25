import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Spinner } from "./Spinner";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  loading?: boolean;
  children: ReactNode;
}

const VARIANT_CLASSES = {
  primary: "bg-primary text-on-primary hover:bg-primary/90",
  secondary:
    "bg-primary-container text-on-primary-container hover:bg-primary-container/70",
  ghost: "bg-transparent text-primary hover:bg-primary-container/50",
} as const;

export function Button({
  variant = "primary",
  loading = false,
  disabled,
  type = "button",
  className,
  children,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled === true || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition-all duration-150 ease-out hover:brightness-105 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-40 ${
        VARIANT_CLASSES[variant]
      } ${className ?? ""}`}
      {...rest}
    >
      {loading ? <Spinner size={18} /> : null}
      {children}
    </button>
  );
}
