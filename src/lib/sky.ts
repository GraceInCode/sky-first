/**
 * The colour of the sky for a given sun altitude, as two gradient stops
 * (zenith at the top, horizon at the bottom) plus a readable text colour.
 * Bands follow the twilight definitions used elsewhere in the app.
 */
export type SkyTone = {
  name: "night" | "twilight" | "dawn" | "morning" | "day";
  zenith: string;
  horizon: string;
  ink: string;
};

const tones: Record<SkyTone["name"], SkyTone> = {
  night: { name: "night", zenith: "#0d1330", horizon: "#24305a", ink: "#e8ecf7" },
  twilight: { name: "twilight", zenith: "#1c2550", horizon: "#5d6aa0", ink: "#eef0fa" },
  dawn: { name: "dawn", zenith: "#3f5494", horizon: "#f1b98f", ink: "#fbf7f2" },
  morning: { name: "morning", zenith: "#6f9bd3", horizon: "#f6dcae", ink: "#142039" },
  day: { name: "day", zenith: "#4f8fd1", horizon: "#cfe6f6", ink: "#0f1b33" },
};

export function skyTone(altitudeDeg: number | null): SkyTone {
  if (altitudeDeg === null) return tones.twilight;
  if (altitudeDeg < -12) return tones.night;
  if (altitudeDeg < -4) return tones.twilight;
  if (altitudeDeg < 4) return tones.dawn;
  if (altitudeDeg < 18) return tones.morning;
  return tones.day;
}
