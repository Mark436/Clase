import type { CustomSubject, ScheduleEdits } from "@/lib/storage/scheduleEditsStore";

export interface ClassMeeting {
  // Stable identity from the API subject code (or a "USR-" id for manually
  // added subjects); edits and conflict preferences key off this value.
  clave: string;
  subjectName: string;
  classroom: string;
  professor: string;
  weekday: number;
  startMinutes: number;
  endMinutes: number;
}

export type WeekSchedule = ClassMeeting[];

// Re-exported so feature code reads one module; persistence stays in lib.
export type { CustomSubject, ScheduleEdits };

export interface ConflictNotice {
  clave: string;
  subjectName: string;
  /** Friendly eaten fraction ("1/4"); empty when fully displaced. */
  portionLabel: string;
}

/**
 * One card per conflicting interval: the highest-ranked meeting of a cluster
 * renders, and every class it displaces is listed in `conflicts`. Classes
 * without overlaps pass through unchanged (no `conflicts` field).
 */
export interface ResolvedMeeting extends ClassMeeting {
  conflicts?: ConflictNotice[];
  /** Stable key of the conflict group, present alongside `conflicts`. */
  conflictKey?: string;
  /** True when an explicit user swap preference placed this class here. */
  swapped?: boolean;
}
