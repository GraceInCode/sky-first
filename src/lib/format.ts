import type { SkyCondition } from "@/core/sky-check";

export function formatClock(d: Date): string {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/** "1h 05m" or "42m". Pass a non-negative number. */
export function formatMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m`;
}

/** Field-note wording, deliberately not motivational. */
export const conditionCopy: Record<SkyCondition, { label: string; note: string }> = {
  clear: { label: "Clear", note: "Open sky" },
  cloudy: { label: "Overcast", note: "Cloud cover logged" },
  night: { label: "Before sunrise", note: "Dark sky counts" },
};
