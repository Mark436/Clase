import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ToastVariant } from "./toastVariants";
import { DEFAULT_TOAST_DURATION_MS } from "./toastVariants";

// How long the fade-out transition runs after the visibility window ends.
const FADE_OUT_MS = 200;

const VARIANT_CLASSES: Record<ToastVariant, string> = {
  neutral: "bg-on-surface/90 backdrop-blur-sm text-surface",
  success: "bg-success/90 backdrop-blur-sm text-on-success",
  error: "bg-error/90 backdrop-blur-sm text-on-error",
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
  durationMs = DEFAULT_TOAST_DURATION_MS,
}: ToastProps) {
  const [fading, setFading] = useState(false);
  // Kept in a ref so re-renders of the host never reset or extend the
  // visibility timers mid-toast.
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const hideTimer = window.setTimeout(() => setFading(true), durationMs);
    const closeTimer = window.setTimeout(
      () => onCloseRef.current(),
      durationMs + FADE_OUT_MS,
    );

    return () => {
      window.clearTimeout(hideTimer);
      window.clearTimeout(closeTimer);
    };
  }, [durationMs]);

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-50 flex justify-center px-4">
      <p
        role="status"
        style={{ transitionDuration: `${FADE_OUT_MS}ms` }}
        className={`pointer-events-auto max-w-md rounded-xl px-4 py-2.5 text-sm font-medium shadow-lg transition-opacity ease-out ${
          fading ? "opacity-0" : "opacity-100"
        } ${VARIANT_CLASSES[variant]}`}
      >
        {message}
      </p>
    </div>,
    document.body,
  );
}
