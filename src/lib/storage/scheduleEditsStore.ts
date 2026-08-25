import {
  getSetting,
  removeSetting,
  setSetting,
  SETTING_SCHEDULE_EDITS,
} from "./settingsStore";

// Prefix reserved for manually added subjects ("Inglés" and friends); it can
// never collide with API subject codes.
export const CUSTOM_CLAVE_PREFIX = "USR-";

export interface SubjectFieldEdit {
  subjectName?: string;
  professor?: string;
  classroom?: string;
}

export interface MeetingTimeEdit {
  startMinutes: number;
  endMinutes: number;
}

export interface CustomSubjectSlot {
  weekday: number;
  startMinutes: number;
  endMinutes: number;
}

export interface CustomSubject {
  // Stable id generated at creation time; survives reloads and restarts.
  clave: string;
  subjectName: string;
  classroom: string;
  professor: string;
  slots: CustomSubjectSlot[];
}

/** Text fields a user may override on a fetched subject. */
export type EditedField = "subjectName" | "professor" | "classroom";

const EDITED_FIELDS: readonly EditedField[] = [
  "subjectName",
  "professor",
  "classroom",
];

/**
 * The school changed one of the subject's text fields while the user kept a
 * manual override on it. Persisted until the user picks which value wins.
 */
export interface PendingEditConflict {
  clave: string;
  field: EditedField;
  /** The value the user saved manually. */
  savedValue: string;
  /** The fresh value coming from the API. */
  newValue: string;
}

export interface ScheduleEdits {
  // Subject-wide overrides keyed by clave: they apply to every occurrence
  // of the subject across the week.
  fieldEdits: Record<string, SubjectFieldEdit>;
  // Per-occurrence time replacements keyed `${clave}|${weekday}`.
  timeEdits: Record<string, MeetingTimeEdit>;
  customSubjects: CustomSubject[];
  // Conflict display preferences: groupKey -> preferred clave. Applies to
  // every weekday where the same conflict repeats.
  conflictOverrides: Record<string, string>;
  // Last raw values seen per `${clave}|${field}`; lets drift detection tell
  // "the school changed this" apart from "the user edited this".
  fieldSnapshots: Record<string, string>;
  pendingConflicts: PendingEditConflict[];
}

export const EMPTY_SCHEDULE_EDITS: ScheduleEdits = {
  fieldEdits: {},
  timeEdits: {},
  customSubjects: [],
  conflictOverrides: {},
  fieldSnapshots: {},
  pendingConflicts: [],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isMinuteRange(value: unknown): value is MeetingTimeEdit {
  if (!isRecord(value)) return false;
  return (
    typeof value.startMinutes === "number" &&
    typeof value.endMinutes === "number" &&
    Number.isFinite(value.startMinutes) &&
    Number.isFinite(value.endMinutes) &&
    value.startMinutes >= 0 &&
    value.endMinutes <= 1440 &&
    value.startMinutes < value.endMinutes
  );
}

function parseOptionalText(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== ""
    ? value.trim()
    : undefined;
}

function parseFieldEdit(value: unknown): SubjectFieldEdit | null {
  if (!isRecord(value)) return null;

  const edit: SubjectFieldEdit = {};
  const subjectName = parseOptionalText(value.subjectName);
  const professor = parseOptionalText(value.professor);
  const classroom = parseOptionalText(value.classroom);
  if (subjectName !== undefined) edit.subjectName = subjectName;
  if (professor !== undefined) edit.professor = professor;
  if (classroom !== undefined) edit.classroom = classroom;

  return Object.keys(edit).length > 0 ? edit : null;
}

function parseRecord<T>(
  value: unknown,
  parseEntry: (entry: unknown) => T | null,
): Record<string, T> {
  if (!isRecord(value)) return {};

  const result: Record<string, T> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (key === "") continue;
    const parsed = parseEntry(entry);
    if (parsed !== null) result[key] = parsed;
  }
  return result;
}

function parseCustomSubject(value: unknown): CustomSubject | null {
  if (!isRecord(value)) return null;
  if (typeof value.clave !== "string") return null;
  if (!value.clave.startsWith(CUSTOM_CLAVE_PREFIX)) return null;

  const slots = Array.isArray(value.slots)
    ? value.slots.filter(
        (slot): slot is CustomSubjectSlot =>
          isRecord(slot) &&
          typeof slot.weekday === "number" &&
          Number.isInteger(slot.weekday) &&
          slot.weekday >= 1 &&
          slot.weekday <= 6 &&
          isMinuteRange(slot),
      )
    : [];

  return {
    clave: value.clave,
    subjectName:
      typeof value.subjectName === "string" ? value.subjectName : "",
    classroom: typeof value.classroom === "string" ? value.classroom : "",
    professor: typeof value.professor === "string" ? value.professor : "",
    slots,
  };
}

function parsePendingConflict(value: unknown): PendingEditConflict | null {
  if (!isRecord(value)) return null;
  if (typeof value.clave !== "string" || value.clave === "") return null;
  if (
    typeof value.field !== "string" ||
    !EDITED_FIELDS.includes(value.field as EditedField)
  ) {
    return null;
  }
  if (
    typeof value.savedValue !== "string" ||
    typeof value.newValue !== "string"
  ) {
    return null;
  }

  return {
    clave: value.clave,
    field: value.field as EditedField,
    savedValue: value.savedValue,
    newValue: value.newValue,
  };
}

export function parseScheduleEdits(raw: string | null): ScheduleEdits {
  if (!raw) return EMPTY_SCHEDULE_EDITS;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return EMPTY_SCHEDULE_EDITS;

    return {
      fieldEdits: parseRecord(parsed.fieldEdits, parseFieldEdit),
      timeEdits: parseRecord(parsed.timeEdits, (entry) =>
        isMinuteRange(entry) ? entry : null,
      ),
      customSubjects: Array.isArray(parsed.customSubjects)
        ? parsed.customSubjects
            .map(parseCustomSubject)
            .filter((subject): subject is CustomSubject => subject !== null)
        : [],
      conflictOverrides: parseRecord(
        parsed.conflictOverrides,
        (value): string | null => (typeof value === "string" ? value : null),
      ),
      fieldSnapshots: parseRecord(
        parsed.fieldSnapshots,
        (value): string | null => (typeof value === "string" ? value : null),
      ),
      pendingConflicts: Array.isArray(parsed.pendingConflicts)
        ? parsed.pendingConflicts
            .map(parsePendingConflict)
            .filter((conflict): conflict is PendingEditConflict => conflict !== null)
        : [],
    };
  } catch {
    return EMPTY_SCHEDULE_EDITS;
  }
}

export async function loadScheduleEdits(): Promise<ScheduleEdits> {
  try {
    return parseScheduleEdits(await getSetting(SETTING_SCHEDULE_EDITS));
  } catch {
    return EMPTY_SCHEDULE_EDITS;
  }
}

export async function saveScheduleEdits(edits: ScheduleEdits): Promise<void> {
  await setSetting(SETTING_SCHEDULE_EDITS, JSON.stringify(edits));
}

export async function clearScheduleEdits(): Promise<void> {
  await removeSetting(SETTING_SCHEDULE_EDITS);
}
