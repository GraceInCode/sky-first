import { useCallback, useEffect, useReducer, useState, type Dispatch, type SetStateAction } from "react";
import { alarmReducer, initialAlarm, type AlarmState } from "@/core/alarm";
import { advance, newAlarm, nextDue, retime, setEnabled, type Alarm } from "@/core/alarms";
import { unlockAlarmSound } from "@/hooks/use-alarm-sound";

const LIST_KEY = "sky-first:alarms";
const RING_KEY = "sky-first:alarm";

/** Alarms live in localStorage and survive a reload or a closed tab. */
function loadAlarms(): Alarm[] {
  try {
    const raw = window.localStorage.getItem(LIST_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as Alarm[]) : [];
  } catch {
    return [];
  }
}

function saveAlarms(alarms: Alarm[]): void {
  try {
    window.localStorage.setItem(LIST_KEY, JSON.stringify(alarms));
  } catch {
    // Alarms stay in memory for this session if storage is unavailable.
  }
}

// A ring in progress is stored so a reload cannot skip it.
function loadRing(): AlarmState {
  try {
    const raw = window.localStorage.getItem(RING_KEY);
    const parsed = raw ? (JSON.parse(raw) as AlarmState) : initialAlarm;
    return parsed.status === "ringing" ? parsed : initialAlarm;
  } catch {
    return initialAlarm;
  }
}

function saveRing(state: AlarmState): void {
  try {
    window.localStorage.setItem(RING_KEY, JSON.stringify(state));
  } catch {
    // Without storage the ring still works for this session.
  }
}

/** The alarm list, with the actions the screen needs. */
export function useAlarms() {
  const [alarms, setAlarms] = useState<Alarm[]>(loadAlarms);

  useEffect(() => saveAlarms(alarms), [alarms]);

  // Each action unlocks audio here, because it runs from a click or tap.
  const add = useCallback(() => {
    unlockAlarmSound();
    setAlarms((list) => [...list, newAlarm(crypto.randomUUID(), "07:00", new Date())]);
  }, []);

  const setTime = useCallback((id: string, time: string) => {
    setAlarms((list) => list.map((a) => (a.id === id ? retime(a, time, new Date()) : a)));
  }, []);

  const setOn = useCallback((id: string, enabled: boolean) => {
    if (enabled) unlockAlarmSound();
    setAlarms((list) => list.map((a) => (a.id === id ? setEnabled(a, enabled, new Date()) : a)));
  }, []);

  const remove = useCallback((id: string) => {
    setAlarms((list) => list.filter((a) => a.id !== id));
  }, []);

  return { alarms, setAlarms, add, setTime, setOn, remove };
}

/**
 * Watches the list and starts the ring when an alarm is due.
 * Returns the ring state; the ring dialog reads it and dispatches the photo events.
 */
export function useAlarmClock(alarms: Alarm[], setAlarms: Dispatch<SetStateAction<Alarm[]>>) {
  const [ring, dispatch] = useReducer(alarmReducer, undefined, loadRing);

  useEffect(() => saveRing(ring), [ring]);

  useEffect(() => {
    const check = () => {
      if (ring.status !== "idle") return;
      const now = new Date();
      const due = nextDue(alarms, now);
      if (!due) return;
      dispatch({ type: "TRIGGER", alarmId: due.id, at: now.toISOString() });
      setAlarms((list) => list.map((a) => (a.id === due.id ? advance(a, now) : a)));
    };
    check();
    const id = window.setInterval(check, 1000);
    return () => window.clearInterval(id);
  }, [alarms, ring.status, setAlarms]);

  return [ring, dispatch] as const;
}
