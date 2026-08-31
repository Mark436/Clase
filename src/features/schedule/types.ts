import type { CustomSubject, ScheduleEdits } from "@/lib/storage/scheduleEditsStore";

export interface ClassMeeting {
  // Stable identity from the API subject code (or a "USR-" id for manually
  // added subjects); edits and conflict preferences key off this value.
  clave: string;
  subjectName: string;
  classroom: string;
  professor: string;
  /** Assigned group (`gpo`); absent for manual subjects or when masked. */
  grupo?: string;
  weekday: number;
  startMinutes: number;
  endMinutes: number;
}

export type WeekSchedule = ClassMeeting[];

// Re-exported so feature code reads one module; persistence stays in lib.
export type { CustomSubject, ScheduleEdits };

/**
 * One card per meeting. Every overlapping member of a cluster is emitted as
 * its own card carrying a plain `overlap` note; classes without overlaps pass
 * through unchanged (no `overlap` field).
 */
export interface ResolvedMeeting extends ClassMeeting {
  /**
   * Bottom-right note shown when this class shares time with others, e.g.
   * "Tapada 1/2 por Matemáticas" or "Tapada completa por Química".
   */
  overlap?: string;
}
