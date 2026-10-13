import { useEffect } from "react";

/** Keeps the screen on while the alarm rings, so the capture step stays visible. */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return;

    let sentinel: WakeLockSentinel | null = null;

    const request = async () => {
      try {
        sentinel = await navigator.wakeLock.request("screen");
        sentinel.addEventListener("release", () => {
          sentinel = null;
        });
      } catch {
        // Denied or unsupported: the alarm still rings, the screen may dim.
      }
    };

    // The browser drops the lock when the page is hidden, so take it again on return.
    const onVisibility = () => {
      if (document.visibilityState === "visible" && !sentinel) void request();
    };

    void request();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      void sentinel?.release().catch(() => {});
    };
  }, [active]);
}
