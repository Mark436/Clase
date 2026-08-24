// Local-date helpers for the daily re-auth reminder. Comparisons use the
// device's local YYYY-MM-DD so "once per day" matches the student's day.

export function toDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function shouldPromptReAuth(
  lastPromptDate: string | null,
  today: Date,
): boolean {
  return lastPromptDate !== toDateKey(today);
}
