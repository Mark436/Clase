import { describe, expect, it } from "vitest";
import type { ClassMeeting } from "./types";
import { formatEatenPortion, resolveConflicts } from "./conflicts";

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
    const resolved = resolveConflicts([
      meeting({ clave: "A", startMinutes: 600 }),
      meeting({ clave: "B", startMinutes: 660 }),
    ]);

    expect(resolved).toHaveLength(2);
    expect(resolved.every((m) => m.overlap === undefined)).toBe(true);
  });

  it("annotates both overlapping classes with their overlap note", () => {
    const resolved = resolveConflicts([
      meeting({ clave: "MAT", subjectName: "Matemáticas" }),
      meeting({
        clave: "USR-eng",
        subjectName: "Inglés",
        startMinutes: 645,
        endMinutes: 690,
      }),
    ]);

    const english = resolved.find((m) => m.clave === "USR-eng");
    const math = resolved.find((m) => m.clave === "MAT");
    expect(english?.overlap).toBe("Encimada 1/3 por Matemáticas");
    expect(math?.overlap).toBe("Encimada 1/4 por Inglés");
    expect(resolved).toHaveLength(2);
  });

  it("marks a fully displaced class as 'completa'", () => {
    const resolved = resolveConflicts([
      meeting({ clave: "FIS", subjectName: "Física" }),
      meeting({ clave: "QUI", subjectName: "Química", startMinutes: 600 }),
    ]);

    const fisica = resolved.find((m) => m.clave === "FIS");
    const quimica = resolved.find((m) => m.clave === "QUI");
    expect(fisica?.overlap).toBe("Encimada completa por Química");
    expect(quimica?.overlap).toBe("Encimada completa por Física");
    expect(resolved).toHaveLength(2);
  });

  it("does not swallow non-overlapping classes that start before a manual subject", () => {
    // A(7-9), B(11-13), manual Inglés(12-13). Only B overlaps Inglés; the
    // mid-day manual subject must not pull A into the cluster.
    const resolved = resolveConflicts([
      meeting({ clave: "A", subjectName: "A", startMinutes: 420, endMinutes: 540 }),
      meeting({ clave: "B", subjectName: "B", startMinutes: 660, endMinutes: 780 }),
      meeting({
        clave: "USR-eng",
        subjectName: "Inglés",
        startMinutes: 720,
        endMinutes: 780,
      }),
    ]);

    // A stays as its own untouched card.
    const a = resolved.find((m) => m.clave === "A");
    expect(a?.overlap).toBeUndefined();

    const english = resolved.find((m) => m.clave === "USR-eng");
    const b = resolved.find((m) => m.clave === "B");
    expect(english?.overlap).toBe("Encimada completa por B");
    expect(b?.overlap).toBe("Encimada 1/2 por Inglés");

    expect(resolved).toHaveLength(3);
  });

  it("handles a three-way cluster annotating each member", () => {
    const resolved = resolveConflicts([
      meeting({ clave: "A", subjectName: "A", startMinutes: 600, endMinutes: 720 }),
      meeting({ clave: "B", subjectName: "B", startMinutes: 630, endMinutes: 690 }),
      meeting({ clave: "C", subjectName: "C", startMinutes: 660, endMinutes: 750 }),
    ]);

    expect(resolved).toHaveLength(3);
    expect(resolved.find((m) => m.clave === "A")?.overlap).toBeDefined();
    expect(resolved.find((m) => m.clave === "B")?.overlap).toBeDefined();
    expect(resolved.find((m) => m.clave === "C")?.overlap).toBeDefined();
  });
});
