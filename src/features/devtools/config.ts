// UI gating only, not security: the value ships in the bundle and anyone can
// read it. Real data stays protected because every API call needs credentials.
export const DEV_OWNER_CONTROL = "23330563";

export const UNLOCK_TAP_COUNT = 7;

export function isDevBuild(): boolean {
  return import.meta.env.DEV;
}
