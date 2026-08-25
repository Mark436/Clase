import { describe, expect, it } from "vitest";
import type { ClassMeeting } from "./types";
import {
  conflictGroupKey,
  dailySwapKey,
  formatEatenPortion,
  resolveConflicts,
} from "./conflicts";

function meeting(partial: Partial<ClassMeeting>): ClassMeeting {
  return {
    clave: "X",
    subjectName: "Materia",
    classroom: "",
    professor: "",
    weekday: 1,
    startMinutes: 600,
    endMinutes: 660,
    ...partial,
  };
}

const NO_PREFS = { weekly: {}, daily: {} };

describe("formatEatenPortion", () => {
  it("snaps onto friendly fractions", () => {
    expect(formatEatenPortion(15, 60)).toBe("1/4");
    expect(formatEatenPortion(20, 60)).toBe("1/3");
    expect(formatEatenPortion(30, 60)).toBe("1/2");
    expect(formatEatenPortion(40, 60)).toBe("2/3");
    expect(formatEatenPortion(45, 60)).toBe("3/4");
  });

  it("falls back to minutes for unfriendly portions", () => {
    expect(formatEatenPortion(8, 60)).toBe("8 min");
  });

  it('returns empty for zero or fully eaten classes', () => {
    expect(formatEatenPortion(0, 60)).toBe("");
    expect(formatEatenPortion(60, 60)).toBe("");
    expect(formatEatenPortion(10, 0)).toBe("");
  });
});

describe("resolveConflicts", () => {
  it("passes non-overlapping meetings through untouched", () => {
    const resolved = resolveConflicts(
      [
        meeting({ clave: "A", startMinutes: 600 }),
        meeting({ clave: "B", startMinutes: 660 }),
      ],
      NO_PREFS,
    );

    expect(resolved).toHaveLength(2);
    expect(resolved.every((m) => m.conflicts === undefined)).toBe(true);
  });

  it("collapses an overlap into one card with a portion notice", () => {
    const [resolved] = resolveConflicts(
      [
        meeting({ clave: "MAT", subjectName: "Matemáticas" }),
        meeting({
          clave: "USR-eng",
          subjectName: "Inglés",
          startMinutes: 645,
          endMinutes: 690,
        }),
      ],
      NO_PREFS,
    );

    expect(resolved.subjectName).toBe("Inglés");
    expect(resolved.conflictKey).toBe(conflictGroupKey(["MAT", "USR-eng"]));
    expect(resolved.conflicts).toEqual([
      { clave: "MAT", subjectName: "Matemáticas", portionLabel: "1/4" },
    ]);
  });

  it("shows only the name for fully displaced classes", () => {
    const [resolved] = resolveConflicts(
      [
        meeting({ clave: "FIS", subjectName: "Física" }),
        meeting({
          clave: "QUI",
          subjectName: "Química",
          startMinutes: 600,
        }),
      ],
      NO_PREFS,
    );

    // Same range: the earlier-start fetched class wins; Química is swallowed.
    expect(resolved.subjectName).toBe("Física");
    expect(resolved.conflicts).toEqual([
      { clave: "QUI", subjectName: "Química", portionLabel: "" },
    ]);
  });

  it("prefers manually added subjects over fetched ones", () => {
    const [resolved] = resolveConflicts(
      [
        meeting({ clave: "MAT", subjectName: "Matemáticas" }),
        meeting({
          clave: "USR-1",
          subjectName: "Inglés",
          startMinutes: 620,
          endMinutes: 700,
        }),
      ],
      NO_PREFS,
    );

    expect(resolved.subjectName).toBe("Inglés");
    expect(resolved.swapped).toBe(false);
    expect(resolved.conflicts?.[0]?.subjectName).toBe("Matemáticas");
    expect(resolved.conflicts?.[0]?.portionLabel).toBe("2/3");
  });

  it("applies a weekly preference to every occurrence of the group", () => {
    const meetings: ClassMeeting[] = [1, 3].flatMap((weekday) => [
      meeting({ clave: "A", subjectName: "A", weekday }),
      meeting({
        clave: "B",
        subjectName: "B",
        weekday,
        startMinutes: 620,
        endMinutes: 680,
      }),
    ]);
    const key = conflictGroupKey(["A", "B"]);

    const resolved = resolveConflicts(meetings, {
      weekly: { [key]: "B" },
      daily: {},
    });

    expect(
      resolved.every((m) => m.subjectName === "B" && m.swapped === true),
    ).toBe(true);
    expect(
      resolved.every((m) => m.conflicts?.[0]?.clave === "A"),
    ).toBe(true);
  });

  it("lets a day-only swap override the weekly preference", () => {
    const meetings = [
      meeting({ clave: "A", subjectName: "A" }),
      meeting({
        clave: "B",
        subjectName: "B",
        startMinutes: 620,
        endMinutes: 680,
      }),
    ];
    const key = conflictGroupKey(["A", "B"]);

    const [resolved] = resolveConflicts(meetings, {
      weekly: { [key]: "B" },
      daily: { [dailySwapKey(key, 1)]: "A" },
    });

    expect(resolved.subjectName).toBe("A");
    expect(resolved.conflicts?.[0]?.clave).toBe("B");
  });

  it("keeps the default order when a preference references a stale clave", () => {
    const meetings = [
      meeting({ clave: "A", subjectName: "A" }),
      meeting({
        clave: "B",
        subjectName: "B",
        startMinutes: 620,
        endMinutes: 680,
      }),
    ];
    const key = conflictGroupKey(["A", "B"]);

    const [resolved] = resolveConflicts(meetings, {
      weekly: { [key]: "BORRADA" },
      daily: {},
    });

    expect(resolved.subjectName).toBe("A");
    expect(resolved.conflicts?.[0]?.clave).toBe("B");
  });
});

describe("conflictGroupKey", () => {
  it("is order-independent and de-duplicated", () => {
    expect(conflictGroupKey(["B", "A", "B"])).toBe("A|B");
    expect(conflictGroupKey(["A", "B"])).toBe(conflictGroupKey(["B", "A"]));
  });
});
