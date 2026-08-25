import { describe, expect, it } from "vitest";
import type { WeekSchedule } from "./types";
import { applyScheduleEdits, timeEditKey } from "./edits";
import { EMPTY_SCHEDULE_EDITS } from "@/lib/storage/scheduleEditsStore";

function baseWeek(): WeekSchedule {
  return [
    {
      clave: "MAT",
      subjectName: "Matemáticas",
      classroom: "A-101",
      professor: "García",
      weekday: 1,
      startMinutes: 600,
      endMinutes: 660,
    },
    {
      clave: "MAT",
      subjectName: "Matemáticas",
      classroom: "A-101",
      professor: "García",
      weekday: 3,
      startMinutes: 600,
      endMinutes: 660,
    },
    {
      clave: "FIS",
      subjectName: "Física",
      classroom: "B-202",
      professor: "López",
      weekday: 1,
      startMinutes: 700,
      endMinutes: 760,
    },
  ];
}

describe("applyScheduleEdits", () => {
  it("returns the same meetings when there are no edits", () => {
    const week = baseWeek();
    expect(applyScheduleEdits(week, EMPTY_SCHEDULE_EDITS)).toEqual(week);
  });

  it("applies field edits to every occurrence of the subject", () => {
    const resolved = applyScheduleEdits(baseWeek(), {
      ...EMPTY_SCHEDULE_EDITS,
      fieldEdits: { MAT: { subjectName: "Cálculo" } },
    });

    expect(
      resolved.filter((m) => m.clave === "MAT").map((m) => m.subjectName),
    ).toEqual(["Cálculo", "Cálculo"]);
    // Untouched fields stay intact.
    expect(resolved[0]?.professor).toBe("García");
  });

  it("replaces times only for the edited weekday occurrence", () => {
    const resolved = applyScheduleEdits(baseWeek(), {
      ...EMPTY_SCHEDULE_EDITS,
      timeEdits: {
        [timeEditKey("MAT", 1)]: { startMinutes: 630, endMinutes: 700 },
      },
    });

    const monday = resolved.find((m) => m.clave === "MAT" && m.weekday === 1);
    const wednesday = resolved.find(
      (m) => m.clave === "MAT" && m.weekday === 3,
    );

    expect(monday).toMatchObject({ startMinutes: 630, endMinutes: 700 });
    expect(wednesday).toMatchObject({ startMinutes: 600, endMinutes: 660 });
  });

  it("expands custom subjects into one meeting per slot", () => {
    const resolved = applyScheduleEdits(baseWeek(), {
      ...EMPTY_SCHEDULE_EDITS,
      customSubjects: [
        {
          clave: "USR-eng",
          subjectName: "Inglés",
          classroom: "C-1",
          professor: "",
          slots: [
            { weekday: 2, startMinutes: 540, endMinutes: 600 },
            { weekday: 4, startMinutes: 540, endMinutes: 600 },
          ],
        },
      ],
    });

    const english = resolved.filter((m) => m.clave === "USR-eng");
    expect(english.map((m) => m.weekday)).toEqual([2, 4]);
    expect(english.every((m) => m.subjectName === "Inglés")).toBe(true);
  });
});
