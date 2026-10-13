import type { SkyReading } from "./sky-check";

/**
 * Ringing state machine. The only way out of "ringing" is a captured photo.
 * There is no dismiss or snooze event, so nothing else can reach "idle".
 * Which alarm is due is decided in alarms.ts; this only tracks the ring itself.
 */
export type AlarmState =
  | { status: "idle" }
  | { status: "ringing"; alarmId: string; startedAt: string }
  | { status: "captured"; alarmId: string; capturedAt: string; reading: SkyReading };

export type AlarmEvent =
  | { type: "TRIGGER"; alarmId: string; at: string }
  | { type: "CAPTURE"; at: string; reading: SkyReading }
  | { type: "ACKNOWLEDGE" };

export const initialAlarm: AlarmState = { status: "idle" };

export function alarmReducer(state: AlarmState, event: AlarmEvent): AlarmState {
  switch (event.type) {
    case "TRIGGER":
      // One ring at a time. A second alarm that is due waits until the first has a photo.
      if (state.status === "idle") {
        return { status: "ringing", alarmId: event.alarmId, startedAt: event.at };
      }
      return state;

    case "CAPTURE":
      if (state.status === "ringing") {
        return { status: "captured", alarmId: state.alarmId, capturedAt: event.at, reading: event.reading };
      }
      return state;

    case "ACKNOWLEDGE":
      if (state.status === "captured") return { status: "idle" };
      return state;
  }
}

export function isRinging(state: AlarmState): boolean {
  return state.status === "ringing";
}
