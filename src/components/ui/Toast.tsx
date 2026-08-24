import { useEffect } from "react";
import { createPortal } from "react-dom";
import type { ToastVariant } from "./toastVariants";

const VARIANT_CLASSES: Record<ToastVariant, string> = {
  neutral: "bg-on-surface text-surface",
  success: "bg-success text-on-success",
  error: "bg-error text-on-error",
} as const;

interface ToastProps {
  message: string;
  variant?: ToastVariant;
  onClose: () => void;
  durationMs?: number;
}

// Rendered through a portal so it stays anchored to the viewport even when an
// ancestor uses transforms (for example the pull-to-refresh container).
export function Toast({
  message,
  variant = "neutral",
  onClose,
  durationMs = 5000,
}: ToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, durationMs);
    return () => window.clearTimeout(timer);
  }, [durationMs, onClose]);

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-50 flex justify-center px-4">
      <p
        role="status"
        className={`pointer-events-auto max-w-md rounded-xl px-4 py-2.5 text-sm font-medium shadow-lg ${VARIANT_CLASSES[variant]}`}
      >
        {message}
      </p>
    </div>,
    document.body,
  );
}
