import { getValue, putValue, removeValue, STORE_SETTINGS } from "./db";

export const SETTING_REMEMBERED_USERNAME = "rememberedUsername";
export const SETTING_ADEUDO_ALERTS_OPT_IN = "adeudoAlertsOptIn";
export const SETTING_GRADES_SEEN = "gradesSeen";
export const SETTING_LAST_REAUTH_PROMPT_DATE = "lastReAuthPromptDate";

// Settings hold non-sensitive values only. The password must never be stored.
export async function getSetting(key: string): Promise<string | null> {
  const value = await getValue<string>(STORE_SETTINGS, key);
  return value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await putValue(STORE_SETTINGS, { key, value });
}

export async function removeSetting(key: string): Promise<void> {
  await removeValue(STORE_SETTINGS, key);
}
