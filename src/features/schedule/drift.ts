import type {
  ClassMeeting,
} from "./types";
import type {
  EditedField,
  PendingEditConflict,
  SubjectFieldEdit,
} from "@/lib/storage/scheduleEditsStore";

/** Text fields watched for school-side changes. */
export const DRIFT_FIELDS: readonly EditedField[] = [
  "subjectName",
  "professor",
  "classroom",
];

export function subjectFieldKey(clave: string, field: EditedField): string {
  return `${clave}|${field}`;
}

/**
 * Raw fetched value per `${clave}|${field}`, taking the first occurrence in
 * deterministic order (weekday, start). Fetched subjects are expected to
 * repeat the same text values across days; per-occurrence differences are
 * out of scope for drift detection.
 */
export function collectSubjectFields(
  meetings: ClassMeeting[],
): Record<string, string> {
  const ordered = [...meetings].sort(
    (a, b) =>
      a.weekday - b.weekday ||
      a.startMinutes - b.startMinutes ||
      a.subjectName.localeCompare(b.subjectName),
  );

  const fields: Record<string, string> = {};
  for (const meeting of ordered) {
    for (const field of DRIFT_FIELDS) {
      const key = subjectFieldKey(meeting.clave, field);
      if (fields[key] === undefined) {
        fields[key] = meeting[field];
      }
    }
  }
  return fields;
}

export function sameStringMap(
  a: Record<string, string>,
  b: Record<string, string>,
): boolean {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((key) => a[key] === b[key]);
}

/**
 * School-side changes that collide with a live manual override. A key only
 * counts once it has a previous snapshot: first sight is a baseline, never a
 * conflict. Edits equal to the new value are already satisfied and stay
 * silent.
 */
export function detectManualEditConflicts(
  rawFields: Record<string, string>,
  previousSnapshots: Record<string, string>,
  fieldEdits: Record<string, SubjectFieldEdit>,
): PendingEditConflict[] {
  const conflicts: PendingEditConflict[] = [];

  for (const [key, newValue] of Object.entries(rawFields)) {
    const previous = previousSnapshots[key];
    if (previous === undefined || previous === newValue) continue;

    const separator = key.indexOf("|");
    const clave = key.slice(0, separator);
    const field = key.slice(separator + 1) as EditedField;
    if (!DRIFT_FIELDS.includes(field)) continue;

    const savedValue = fieldEdits[clave]?.[field];
    if (savedValue === undefined || savedValue === newValue) continue;

    conflicts.push({ clave, field, savedValue, newValue });
  }

  return conflicts;
}

/** Merges fresh conflicts into the pending list, replacing same-key entries. */
export function mergePendingConflicts(
  current: PendingEditConflict[],
  incoming: PendingEditConflict[],
): PendingEditConflict[] {
  const merged = current.filter(
    (pending) =>
      !incoming.some(
        (conflict) =>
          conflict.clave === pending.clave && conflict.field === pending.field,
      ),
  );
  return [...merged, ...incoming];
}
