import { describe, expect, it } from "vitest";
import type { ClassMeeting } from "./types";
import {
  formatMinutes,
  formatRelativeTime,
  getCurrentClass,
  getNextClass,
  getNextClassNote,
  getVisibleClasses,
  minutesOf,
  parseMinutes,
} from "./utils";

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

// Monday 2026-08-24 at 10:00 local time.
function at(minutes: number): Date {
  const date = new Date(2026, 7, 24, Math.floor(minutes / 60), minutes % 60);
  return date;
}

describe("formatRelativeTime", () => {
  it("formats hours, minutes and combinations", () => {
    expect(formatRelativeTime(60)).toBe("1 hr");
    expect(formatRelativeTime(20)).toBe("20 min");
    expect(formatRelativeTime(80)).toBe("1 hr y 20 min");
    expect(formatRelativeTime(125)).toBe("2 hr y 5 min");
    expect(formatRelativeTime(90)).toBe("1 hr y 30 min");
    expect(formatRelativeTime(1)).toBe("1 min");
  });

  it("never emits zero units or plural hours", () => {
    expect(formatRelativeTime(120)).toBe("2 hr");
    expect(formatRelativeTime(61)).toBe("1 hr y 1 min");
  });

  it("returns empty for zero and negative values", () => {
    expect(formatRelativeTime(0)).toBe("");
    expect(formatRelativeTime(-15)).toBe("");
  });
});

describe("getNextClassNote", () => {
  const subject = meeting({ startMinutes: 600 });

  it("shows a relative countdown while positive", () => {
    expect(getNextClassNote(subject, 520)).toBe("1 hr y 20 min");
  });

  it('shows "Empieza pronto" at the exact start minute', () => {
    expect(getNextClassNote(subject, 600)).toBe("Empieza pronto");
  });

  it("falls back to the scheduled time after the start has passed", () => {
    expect(getNextClassNote(subject, 605)).toBe("Empieza a las 10:00");
  });
});

describe("class selection around the exact start minute", () => {
  const day = [
    meeting({ clave: "A", startMinutes: 600, endMinutes: 660 }),
    meeting({ clave: "B", startMinutes: 700, endMinutes: 730 }),
  ];

  it("announces the class as next at its exact start minute", () => {
    const now = at(600);
    expect(getCurrentClass(day, now)).toBeNull();
    expect(getNextClass(day, now)?.clave).toBe("A");
  });

  it("marks it as current from the following minute", () => {
    const now = at(601);
    expect(getCurrentClass(day, now)?.clave).toBe("A");
    expect(getNextClass(day, now)?.clave).toBe("B");
  });

  it("keeps later classes visible until they finish", () => {
    const visible = getVisibleClasses(day, at(705), true);
    expect(visible.map((m) => m.clave)).toEqual(["B"]);
  });
});

describe("minutes helpers", () => {
  it("formats padded times", () => {
    expect(formatMinutes(605)).toBe("10:05");
    expect(formatMinutes(0)).toBe("00:00");
  });

  it("parses HH:MM inputs", () => {
    expect(parseMinutes("10:05")).toBe(605);
    expect(parseMinutes(" 9:59 ")).toBe(599);
    expect(parseMinutes("24:00")).toBeNull();
    expect(parseMinutes("10:60")).toBeNull();
    expect(parseMinutes("10")).toBeNull();
  });

  it("computes minutes-of-day", () => {
    expect(minutesOf(at(605))).toBe(605);
  });
});
