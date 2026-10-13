import { describe, expect, it } from "vitest";
import { advance, newAlarm, nextDue, retime, setEnabled, soonest, type Alarm } from "./alarms";
import { alarmReducer, initialAlarm } from "./alarm";

const reading = { condition: "clear" as const, cloudCover: 0, brightness: 0.5 };
const morning = new Date(2026, 5, 21, 5, 0);

function alarm(id: string, time: string, now = morning): Alarm {
  return newAlarm(id, time, now);
}

describe("alarm list", () => {
  it("schedules a new alarm at its next occurrence, not in the past", () => {
    const a = alarm("a", "07:00");
    expect(new Date(a.nextAt).getHours()).toBe(7);
    expect(Date.parse(a.nextAt)).toBeGreaterThan(morning.getTime());
  });

  it("rings the earliest due enabled alarm", () => {
    const late = { ...alarm("late", "06:00"), nextAt: new Date(2026, 5, 21, 6, 0).toISOString() };
    const early = { ...alarm("early", "05:30"), nextAt: new Date(2026, 5, 21, 5, 30).toISOString() };
    const at = new Date(2026, 5, 21, 6, 1);
    expect(nextDue([late, early], at)?.id).toBe("early");
  });

  it("skips disabled alarms", () => {
    const off = setEnabled(alarm("off", "05:10"), false, morning);
    const at = new Date(2026, 5, 21, 6, 0);
    expect(nextDue([{ ...off, nextAt: new Date(2026, 5, 21, 5, 10).toISOString() }], at)).toBeNull();
  });

  it("does not ring again the same day once advanced", () => {
    const due = { ...alarm("a", "06:00"), nextAt: new Date(2026, 5, 21, 6, 0).toISOString() };
    const at = new Date(2026, 5, 21, 6, 0, 5);
    const next = advance(due, at);
    expect(nextDue([next], at)).toBeNull();
    expect(new Date(next.nextAt).getDate()).toBe(22);
  });

  it("retiming moves the next ring to the new time", () => {
    const a = retime(alarm("a", "07:00"), "08:15", morning);
    expect(new Date(a.nextAt).getHours()).toBe(8);
    expect(new Date(a.nextAt).getMinutes()).toBe(15);
  });

  it("picks the soonest enabled alarm for display", () => {
    const later = alarm("later", "09:00");
    const sooner = alarm("sooner", "06:00");
    expect(soonest([later, sooner, setEnabled(alarm("off", "05:30"), false, morning)])?.id).toBe("sooner");
  });
});

describe("ring state with several alarms", () => {
  it("rings one alarm at a time and keeps the second waiting", () => {
    let s = alarmReducer(initialAlarm, { type: "TRIGGER", alarmId: "a", at: "t1" });
    s = alarmReducer(s, { type: "TRIGGER", alarmId: "b", at: "t1" });
    expect(s).toEqual({ status: "ringing", alarmId: "a", startedAt: "t1" });
  });

  it("cannot be dismissed without a photo", () => {
    const s = alarmReducer(initialAlarm, { type: "TRIGGER", alarmId: "a", at: "t1" });
    expect(alarmReducer(s, { type: "ACKNOWLEDGE" }).status).toBe("ringing");
  });

  it("returns to idle only after a captured photo", () => {
    let s = alarmReducer(initialAlarm, { type: "TRIGGER", alarmId: "a", at: "t1" });
    s = alarmReducer(s, { type: "CAPTURE", at: "t2", reading });
    expect(s.status).toBe("captured");
    expect(alarmReducer(s, { type: "ACKNOWLEDGE" }).status).toBe("idle");
  });
});
