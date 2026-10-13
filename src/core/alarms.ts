import { nextWakeAt } from "./sun";

/** A daily alarm. `nextAt` is the next time it should ring, as ISO text. */
export type Alarm = {
  id: string;
  time: string; // "HH:MM"
  enabled: boolean;
  nextAt: string;
};

export function newAlarm(id: string, time: string, now: Date): Alarm {
  return { id, time, enabled: true, nextAt: nextWakeAt(now, time).toISOString() };
}

export function retime(alarm: Alarm, time: string, now: Date): Alarm {
  return { ...alarm, time, nextAt: nextWakeAt(now, time).toISOString() };
}

export function setEnabled(alarm: Alarm, enabled: boolean, now: Date): Alarm {
  if (!enabled) return { ...alarm, enabled };
  return { ...alarm, enabled, nextAt: nextWakeAt(now, alarm.time).toISOString() };
}

/** After an alarm rings, its next ring is the same time on the next day. */
export function advance(alarm: Alarm, now: Date): Alarm {
  return { ...alarm, nextAt: nextWakeAt(now, alarm.time).toISOString() };
}

/** The earliest enabled alarm whose time has arrived. Overdue alarms count, so a closed app still rings. */
export function nextDue(alarms: Alarm[], now: Date): Alarm | null {
  let due: Alarm | null = null;
  for (const alarm of alarms) {
    if (!alarm.enabled || Date.parse(alarm.nextAt) > now.getTime()) continue;
    if (!due || Date.parse(alarm.nextAt) < Date.parse(due.nextAt)) due = alarm;
  }
  return due;
}

/** The soonest enabled alarm, for the "next ring" line. */
export function soonest(alarms: Alarm[]): Alarm | null {
  let next: Alarm | null = null;
  for (const alarm of alarms) {
    if (!alarm.enabled) continue;
    if (!next || Date.parse(alarm.nextAt) < Date.parse(next.nextAt)) next = alarm;
  }
  return next;
}
