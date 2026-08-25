import { describe, expect, it } from "vitest";
import {
  EMPTY_SCHEDULE_EDITS,
  parseScheduleEdits,
} from "./scheduleEditsStore";

describe("parseScheduleEdits", () => {
  it("returns empty edits for null or invalid JSON", () => {
    expect(parseScheduleEdits(null)).toEqual(EMPTY_SCHEDULE_EDITS);
    expect(parseScheduleEdits("not json{")).toEqual(EMPTY_SCHEDULE_EDITS);
  });

  it("rejects non-object payloads", () => {
    expect(parseScheduleEdits(JSON.stringify(42))).toEqual(
      EMPTY_SCHEDULE_EDITS,
    );
    expect(parseScheduleEdits(JSON.stringify([1, 2]))).toEqual(
      EMPTY_SCHEDULE_EDITS,
    );
  });

  it("parses valid persisted shapes and drops malformed entries", () => {
    const parsed = parseScheduleEdits(
      JSON.stringify({
        fieldEdits: {
          MAT: { subjectName: "Cálculo", professor: "", classroom: "" },
          BAD: { subjectName: 5 },
        },
        timeEdits: {
          "MAT|1": { startMinutes: 630, endMinutes: 700 },
          "BAD|2": { startMinutes: 700, endMinutes: 600 },
        },
        customSubjects: [
          {
            clave: "USR-eng",
            subjectName: "Inglés",
            classroom: "",
            professor: "",
            slots: [{ weekday: 2, startMinutes: 540, endMinutes: 600 }],
          },
          {
            clave: "NOT-CUSTOM",
            subjectName: "Falsa",
            classroom: "",
            professor: "",
            slots: [],
          },
        ],
        conflictOverrides: { "A|B": "A" },
      }),
    );

    expect(parsed.fieldEdits).toEqual({
      MAT: { subjectName: "Cálculo" },
    });
    expect(parsed.timeEdits).toEqual({
      "MAT|1": { startMinutes: 630, endMinutes: 700 },
    });
    expect(parsed.customSubjects).toHaveLength(1);
    expect(parsed.customSubjects[0]?.clave).toBe("USR-eng");
    expect(parsed.conflictOverrides).toEqual({ "A|B": "A" });
  });

  it("drops custom subjects whose clave lacks the USR- prefix", () => {
    const parsed = parseScheduleEdits(
      JSON.stringify({
        customSubjects: [
          {
            clave: "MAT",
            subjectName: "Impostor",
            classroom: "",
            professor: "",
            slots: [],
          },
        ],
      }),
    );

    expect(parsed.customSubjects).toHaveLength(0);
  });
});
