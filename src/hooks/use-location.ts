import { useCallback, useState } from "react";

export type LocationState =
  | { kind: "idle" }
  | { kind: "finding" }
  | { kind: "error"; reason: "blocked" | "off" | "slow" | "unsupported"; message: string };

const messages = {
  blocked:
    "Location is blocked for this site. Tap the icon to the left of the address bar, allow Location, then tap Try again.",
  off: "Your phone's location is turned off. Turn it on from quick settings, then tap Try again.",
  slow: "Finding you took too long. Move near a window, then tap Try again.",
  unsupported: "This browser cannot share a location.",
} as const;

/**
 * Asks for the current position and explains clearly what went wrong.
 * Every failure can be retried with the same button; no page refresh needed.
 * enableHighAccuracy makes Android show its "Turn on location" prompt
 * when the phone's location is switched off.
 */
export function useLocation(onFound: (lat: number, lon: number) => void) {
  const [state, setState] = useState<LocationState>({ kind: "idle" });

  const request = useCallback(() => {
    if (!navigator.geolocation) {
      setState({ kind: "error", reason: "unsupported", message: messages.unsupported });
      return;
    }
    setState({ kind: "finding" });
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        onFound(coords.latitude, coords.longitude);
        setState({ kind: "idle" });
      },
      (err) => {
        const reason = err.code === err.PERMISSION_DENIED ? "blocked" : err.code === err.TIMEOUT ? "slow" : "off";
        setState({ kind: "error", reason, message: messages[reason] });
      },
      { enableHighAccuracy: true, timeout: 20_000, maximumAge: 60 * 60_000 },
    );
  }, [onFound]);

  return { state, request };
}
