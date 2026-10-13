import { getPosition, getTimes } from "suncalc";

export type Coords = { lat: number; lon: number };

export type SunInfo = {
  /** Null when the sun does not rise that day (polar night or midnight sun). */
  sunrise: Date | null;
  sunset: Date | null;
  /** Sun altitude in degrees above the horizon (negative means below). */
  altitudeDeg: number;
};

/** Sunrise, sunset and current sun altitude for a place and moment. */
export function sunInfo(now: Date, { lat, lon }: Coords): SunInfo {
  const times = getTimes(now, lat, lon);
  const pos = getPosition(now, lat, lon);
  return {
    sunrise: isValidDate(times.sunrise) ? times.sunrise : null,
    sunset: isValidDate(times.sunset) ? times.sunset : null,
    altitudeDeg: (pos.altitude * 180) / Math.PI,
  };
}

/** Minutes from today's sunrise to `at`. Negative before sunrise, null if there is none. */
export function minutesAfterSunrise(at: Date, coords: Coords): number | null {
  const { sunrise } = sunInfo(at, coords);
  if (!sunrise) return null;
  return Math.round((at.getTime() - sunrise.getTime()) / 60_000);
}

/** Next occurrence of "HH:MM" local time that is strictly after `now`. */
export function nextWakeAt(now: Date, hhmm: string): Date {
  const [h, m] = hhmm.split(":").map(Number);
  const next = new Date(now);
  next.setHours(h, m, 0, 0);
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
  return next;
}

function isValidDate(d: Date | null | undefined): d is Date {
  return d instanceof Date && !Number.isNaN(d.getTime());
}
