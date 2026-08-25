import type { ReactNode } from "react";

type BadgeVariant = "primary" | "neutral";

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  primary: "bg-primary-container text-on-primary-container",
  neutral: "bg-outline-variant/60 text-on-surface-variant",
};

interface BadgeProps {
  variant?: BadgeVariant;
  className?: string;
  children: ReactNode;
}

export function Badge({
  variant = "neutral",
  className,
  children,
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        className ?? ""
      } ${VARIANT_CLASSES[variant]}`}
    >
      {children}
    </span>
  );
}
