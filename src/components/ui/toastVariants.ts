// Single source for the available toast states: adding a state means an
// entry here plus its class mapping in Toast.tsx; consumers derive UI
// options from this list instead of hardcoding variants.
export const TOAST_VARIANTS = ["neutral", "success", "error"] as const;

export type ToastVariant = (typeof TOAST_VARIANTS)[number];

// Default visibility window before a toast starts fading out. Deliberately
// short: notifications here are confirmations, not reading material. Dev
// settings may override it per session; this is the built-in fallback.
export const DEFAULT_TOAST_DURATION_MS = 1300;
