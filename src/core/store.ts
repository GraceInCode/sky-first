import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { SkyCondition } from "./sky-check";

export type Settings = {
  lat: number | null;
  lon: number | null;
  soundOn: boolean;
};

export const defaultSettings: Settings = {
  lat: null,
  lon: null,
  soundOn: true,
};

const SETTINGS_KEY = "sky-first:settings";

/** Settings live in localStorage. Storage can be blocked, so every access is guarded. */
export function loadSettings(): Settings {
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings;
    return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings: Settings): void {
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Settings stay in memory for this session if storage is unavailable.
  }
}

export type SkyEntry = {
  id: string;
  takenAt: string; // ISO
  condition: SkyCondition;
  cloudCover: number;
  brightness: number;
  minutesAfterSunrise: number | null;
  blob: Blob;
};

interface SkyDB extends DBSchema {
  entries: {
    key: string;
    value: SkyEntry;
    indexes: { "by-date": string };
  };
}

let dbPromise: Promise<IDBPDatabase<SkyDB>> | null = null;

function db(): Promise<IDBPDatabase<SkyDB>> {
  dbPromise ??= openDB<SkyDB>("sky-first", 1, {
    upgrade(database) {
      const store = database.createObjectStore("entries", { keyPath: "id" });
      store.createIndex("by-date", "takenAt");
    },
  });
  return dbPromise;
}

export async function addEntry(entry: SkyEntry): Promise<void> {
  await (await db()).put("entries", entry);
}

/** Newest first. */
export async function listEntries(): Promise<SkyEntry[]> {
  const all = await (await db()).getAllFromIndex("entries", "by-date");
  return all.reverse();
}

/**
 * Consecutive days with at least one entry, counting back from today.
 * If today has no entry yet, the streak still counts from yesterday.
 */
export function streakDays(entries: Pick<SkyEntry, "takenAt">[], now: Date): number {
  const days = new Set(entries.map((e) => dayKey(new Date(e.takenAt))));
  const cursor = new Date(now);
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);

  let count = 0;
  while (days.has(dayKey(cursor))) {
    count++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}
