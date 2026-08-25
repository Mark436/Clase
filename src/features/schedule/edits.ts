import type {
  WeekSchedule,
} from "./types";
import type { ScheduleEdits } from "@/lib/storage/scheduleEditsStore";
import { CUSTOM_CLAVE_PREFIX } from "@/lib/storage/scheduleEditsStore";

export function timeEditKey(clave: string, weekday: number): string {
  return `${clave}|${weekday}`;
}

export function isCustomClave(clave: string): boolean {
  return clave.startsWith(CUSTOM_CLAVE_PREFIX);
}

/**
 * Layers persisted edits on top of the fetched schedule: subject-wide field
 * overrides, per-occurrence time replacements and the expansion of manually
 * added subjects into regular meetings. Pure; runs before conflict
 * resolution.
 */
export function applyScheduleEdits(
  base: WeekSchedule,
  edits: ScheduleEdits,
): WeekSchedule {
  const edited = base.map((meeting) => {
    const fields = edits.fieldEdits[meeting.clave];
    const time = edits.timeEdits[timeEditKey(meeting.clave, meeting.weekday)];
    if (fields === undefined && time === undefined) return meeting;

    return {
      ...meeting,
      subjectName: fields?.subjectName ?? meeting.subjectName,
      professor: fields?.professor ?? meeting.professor,
      classroom: fields?.classroom ?? meeting.classroom,
      startMinutes: time?.startMinutes ?? meeting.startMinutes,
      endMinutes: time?.endMinutes ?? meeting.endMinutes,
    };
  });

  const custom = edits.customSubjects.flatMap<WeekSchedule[number]>((subject) =>
    subject.slots.map((slot) => ({
      clave: subject.clave,
      subjectName: subject.subjectName,
      classroom: subject.classroom,
      professor: subject.professor,
      weekday: slot.weekday,
      startMinutes: slot.startMinutes,
      endMinutes: slot.endMinutes,
    })),
  );

  return [...edited, ...custom];
}
