import type { ClassMeeting, WeekSchedule } from "./types";

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

export function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function minutesOf(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

export function getScheduleForDay(
  meetings: WeekSchedule,
  date: Date,
): ClassMeeting[] {
  return meetings
    .filter((meeting) => meeting.weekday === date.getDay())
    .sort((a, b) => a.startMinutes - b.startMinutes);
}

export function getCurrentClass(
  dayMeetings: ClassMeeting[],
  now: Date,
): ClassMeeting | null {
  const minutes = minutesOf(now);

  return (
    dayMeetings.find(
      (meeting) => minutes >= meeting.startMinutes && minutes < meeting.endMinutes,
    ) ?? null
  );
}

export function getNextClass(
  dayMeetings: ClassMeeting[],
  now: Date,
): ClassMeeting | null {
  const minutes = minutesOf(now);

  return dayMeetings.find((meeting) => meeting.startMinutes > minutes) ?? null;
}

export function getVisibleClasses(
  dayMeetings: ClassMeeting[],
  now: Date,
  isToday: boolean,
): ClassMeeting[] {
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

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
