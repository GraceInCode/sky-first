import { describe, expect, it } from "vitest";
import { streakDays } from "./store";

const day = (y: number, m: number, d: number) => ({ takenAt: new Date(y, m, d, 7).toISOString() });

describe("streakDays", () => {
  it("counts consecutive days ending today", () => {
    const entries = [day(2026, 5, 19), day(2026, 5, 20), day(2026, 5, 21)];
    expect(streakDays(entries, new Date(2026, 5, 21, 9))).toBe(3);
  });

  it("keeps the streak alive if today has no entry yet", () => {
    const entries = [day(2026, 5, 19), day(2026, 5, 20)];
    expect(streakDays(entries, new Date(2026, 5, 21, 9))).toBe(2);
  });

  it("resets after a missed day", () => {
    const entries = [day(2026, 5, 18), day(2026, 5, 20)];
    expect(streakDays(entries, new Date(2026, 5, 21, 9))).toBe(1);
  });

  it("is zero with no entries", () => {
    expect(streakDays([], new Date(2026, 5, 21))).toBe(0);
  });
});
