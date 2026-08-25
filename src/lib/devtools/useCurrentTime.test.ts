import { describe, expect, it } from "vitest";
import { msUntilNextMinute } from "./useCurrentTime";

/** Builds a Date at a fixed second offset inside a minute, TZ-independent. */
function dateAtSecond(second: number): Date {
  return new Date(Date.UTC(2026, 7, 24, 10, 34, second, 0));
}

describe("msUntilNextMinute", () => {
  it("returns the time remaining until the next minute boundary", () => {
    expect(msUntilNextMinute(dateAtSecond(48))).toBe(12_000);
    expect(msUntilNextMinute(dateAtSecond(55))).toBe(5_000);
    expect(msUntilNextMinute(dateAtSecond(59))).toBe(1_000);
  });

  it("returns a full minute right after a boundary tick", () => {
    expect(msUntilNextMinute(dateAtSecond(0))).toBe(60_000);
  });
});
