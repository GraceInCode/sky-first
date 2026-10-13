import { describe, expect, it } from "vitest";
import { nextWakeAt, sunInfo } from "./sun";

const london = { lat: 51.5074, lon: -0.1278 };

describe("sunInfo", () => {
  it("finds London's midsummer sunrise within 10 minutes", () => {
    const info = sunInfo(new Date("2026-06-21T12:00:00Z"), london);
    const expected = Date.parse("2026-06-21T03:43:00Z");
    expect(info.sunrise).not.toBeNull();
    expect(Math.abs(info.sunrise!.getTime() - expected)).toBeLessThan(10 * 60_000);
  });

  it("reports the sun below the horizon at local midnight", () => {
    const info = sunInfo(new Date("2026-06-21T23:30:00Z"), london);
    expect(info.altitudeDeg).toBeLessThan(0);
  });
});

describe("nextWakeAt", () => {
  it("returns today if the wake time is still ahead", () => {
    const now = new Date(2026, 5, 21, 6, 0, 0);
    const next = nextWakeAt(now, "07:30");
    expect(next.getDate()).toBe(21);
    expect(next.getHours()).toBe(7);
    expect(next.getMinutes()).toBe(30);
  });

  it("rolls to tomorrow if the wake time has passed", () => {
    const now = new Date(2026, 5, 21, 8, 0, 0);
    const next = nextWakeAt(now, "07:00");
    expect(next.getDate()).toBe(22);
  });
});
