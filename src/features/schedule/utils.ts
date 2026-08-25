import type { ClassMeeting } from "./types";

export interface ClassProgress {
  percent: number;
  elapsedMinutes: number;
  remainingMinutes: number;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Date within `from`'s week (Sun-based) matching the given weekday 1-6. */
export function dateForWeekday(from: Date, weekday: number): Date {
  const delta = (weekday - from.getDay() + 7) % 7;
  const date = new Date(from);
  date.setDate(date.getDate() + delta);
  return date;
}

export function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function minutesOf(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

export function getScheduleForDay<T extends ClassMeeting>(
  meetings: T[],
  date: Date,
): T[] {
  return meetings
    .filter((meeting) => meeting.weekday === date.getDay())
    .sort((a, b) => a.startMinutes - b.startMinutes);
}

export function getCurrentClass<T extends ClassMeeting>(
  dayMeetings: T[],
  now: Date,
): T | null {
  const minutes = minutesOf(now);

  return (
    dayMeetings.find(
      (meeting) => minutes > meeting.startMinutes && minutes < meeting.endMinutes,
    ) ?? null
  );
}

export function getNextClass<T extends ClassMeeting>(
  dayMeetings: T[],
  now: Date,
): T | null {
  const minutes = minutesOf(now);

  return dayMeetings.find((meeting) => meeting.startMinutes >= minutes) ?? null;
}

export function getVisibleClasses<T extends ClassMeeting>(
  dayMeetings: T[],
  now: Date,
  isToday: boolean,
): T[] {
  if (!isToday) {
    return dayMeetings;
  }
  const minutes = minutesOf(now);

  return dayMeetings.filter((meeting) => meeting.endMinutes > minutes);
}

export function getClassProgress(
  meeting: ClassMeeting,
  now: Date,
): ClassProgress {
  const total = meeting.endMinutes - meeting.startMinutes;
  const elapsed = clamp(minutesOf(now) - meeting.startMinutes, 0, total);

  return {
    percent: Math.round((elapsed / total) * 100),
    elapsedMinutes: elapsed,
    remainingMinutes: total - elapsed,
  };
}

export function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

// Inverse of formatMinutes for "HH:MM" inputs; null when out of range.
export function parseMinutes(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (match === null) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;

  return hours * 60 + minutes;
}

// Compact countdown for positive minute deltas only: zero units are omitted
// and units join with " y " ("1 hr", "20 min", "1 hr y 20 min"). Values <= 0
// are the caller's responsibility ("Empieza pronto" at zero).
export function formatRelativeTime(startsInMinutes: number): string {
  if (startsInMinutes <= 0) return "";

  const hours = Math.floor(startsInMinutes / 60);
  const minutes = startsInMinutes % 60;
  const parts: string[] = [];

  if (hours > 0) parts.push(`${hours} hr`);
  if (minutes > 0) parts.push(`${minutes} min`);

  return parts.join(" y ");
}

// Note shown on the next-class card. Zero means the class reaches its start
// minute right now; negative never happens with getNextClass but falls back
// to the scheduled time instead of showing a wrong countdown.
export function getNextClassNote(
  meeting: ClassMeeting,
  minutesNow: number,
): string {
  const startsIn = meeting.startMinutes - minutesNow;

  if (startsIn === 0) return "Empieza pronto";
  if (startsIn > 0) return formatRelativeTime(startsIn);

  return `Empieza a las ${formatMinutes(meeting.startMinutes)}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
