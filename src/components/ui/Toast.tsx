import { useEffect } from "react";

interface ToastProps {
  message: string;
  onClose: () => void;
  durationMs?: number;
}

export function Toast({ message, onClose, durationMs = 5000 }: ToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, durationMs);
    return () => window.clearTimeout(timer);
  }, [durationMs, onClose]);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-30 flex justify-center px-4">
      <p
        role="status"
        className="pointer-events-auto max-w-md rounded-xl bg-on-surface px-4 py-2.5 text-sm font-medium text-surface shadow-lg"
      >
        {message}
      </p>
    </div>
  );
}
