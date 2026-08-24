// Single source for the available toast states: adding a state means an
// entry here plus its class mapping in Toast.tsx; consumers derive UI
// options from this list instead of hardcoding variants.
export const TOAST_VARIANTS = ["neutral", "success", "error"] as const;

export type ToastVariant = (typeof TOAST_VARIANTS)[number];
