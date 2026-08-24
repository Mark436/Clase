export const UNLOCK_TAP_COUNT = 7;

export function isDevBuild(): boolean {
  return import.meta.env.DEV;
}
