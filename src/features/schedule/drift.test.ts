import { describe, expect, it } from "vitest";
import type { ClassMeeting } from "./types";
import {
  collectSubjectFields,
  detectManualEditConflicts,
  mergePendingConflicts,
  sameStringMap,
  subjectFieldKey,
} from "./drift";
import type { PendingEditConflict } from "@/lib/storage/scheduleEditsStore";

function meeting(partial: Partial<ClassMeeting>): ClassMeeting {
  return {
    clave: "MAT",
    subjectName: "Matemáticas",
    classroom: "A-101",
    professor: "García",
    weekday: 1,
    startMinutes: 600,
    endMinutes: 660,
    ...partial,
  };
}

describe("collectSubjectFields", () => {
  it("takes the first occurrence in deterministic order regardless of input", () => {
    const fields = collectSubjectFields([
      meeting({ clave: "FIS", weekday: 3 }),
      meeting({ weekday: 1, classroom: "A-101" }),
      // Later slot on the same day must not overwrite the first occurrence.
      meeting({ weekday: 1, classroom: "", startMinutes: 700 }),
    ]);

    expect(fields[subjectFieldKey("MAT", "classroom")]).toBe("A-101");
    expect(fields[subjectFieldKey("MAT", "professor")]).toBe("García");
    expect(Object.keys(fields)).toHaveLength(6); // 2 subjects x 3 fields
  });
});

describe("detectManualEditConflicts", () => {
  const edits = { MAT: { classroom: "Mi salón" } };

  it("flags a school change that collides with a manual override", () => {
    const previous = { [subjectFieldKey("MAT", "classroom")]: "A-101" };
    const next = { [subjectFieldKey("MAT", "classroom")]: "B-202" };

    expect(detectManualEditConflicts(next, previous, edits)).toEqual([
      {
        clave: "MAT",
        field: "classroom",
        savedValue: "Mi salón",
        newValue: "B-202",
      },
    ]);
  });

  it("ignores changes on fields without a live override", () => {
    const key = subjectFieldKey("MAT", "professor");
    const previous = { [key]: "García" };
    const next = { [key]: "López" };

    expect(detectManualEditConflicts(next, previous, edits)).toEqual([]);
  });

  it("stays silent when the school did not change anything", () => {
    const key = subjectFieldKey("MAT", "classroom");
    const snapshot = { [key]: "A-101" };

    expect(detectManualEditConflicts(snapshot, snapshot, edits)).toEqual([]);
  });

  it("treats first sight as a baseline, never a conflict", () => {
    const next = { [subjectFieldKey("MAT", "classroom")]: "B-202" };

    expect(detectManualEditConflicts(next, {}, edits)).toEqual([]);
  });

  it("ignores overrides already equal to the new school value", () => {
    const previous = { [subjectFieldKey("MAT", "classroom")]: "A-101" };
    const next = { [subjectFieldKey("MAT", "classroom")]: "B-202" };

    expect(
      detectManualEditConflicts(next, previous, { MAT: { classroom: "B-202" } }),
    ).toEqual([]);
  });
});

describe("mergePendingConflicts", () => {
  const existing: PendingEditConflict[] = [
    { clave: "MAT", field: "classroom", savedValue: "X", newValue: "Y" },
    { clave: "FIS", field: "professor", savedValue: "A", newValue: "B" },
  ];

  it("replaces same-key entries and keeps the rest", () => {
    const merged = mergePendingConflicts(existing, [
      { clave: "MAT", field: "classroom", savedValue: "X", newValue: "Z" },
    ]);

    expect(merged).toHaveLength(2);
    expect(merged.some((c) => c.newValue === "Z")).toBe(true);
    expect(merged.some((c) => c.clave === "FIS")).toBe(true);
  });
});

describe("sameStringMap", () => {
  it("compares keys and values", () => {
    expect(sameStringMap({ a: "1" }, { a: "1" })).toBe(true);
    expect(sameStringMap({ a: "1" }, { a: "2" })).toBe(false);
    expect(sameStringMap({ a: "1" }, {})).toBe(false);
  });
});
