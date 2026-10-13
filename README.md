# Sky First

An alarm that keeps ringing until you photograph the sky. Clear, cloudy and before-sunrise photos all count.

## Run

```sh
npm install
npm run dev        # http://localhost:5173
npm test           # core logic (sun, sky check, alarm, streaks)
npm run build      # production build + installable PWA
```

Open it on your phone over the same network, or deploy the `dist/` folder to any static host, then "Add to Home Screen".

## How it works

- **Alarms:** add as many daily alarms as you like, each with its own time and on/off switch. When one is due the screen goes into a full-screen prompt that cannot be dismissed. The only way out is a saved sky photo. Due alarms ring one at a time.
- **Sky check:** on-device only. Each photo gets one label: `clear`, `cloudy` (overcast) or `night`. A photo is never rejected.
- **Sunrise:** computed from your location with `suncalc`. Nothing is sent to a server.
- **Log:** every photo is kept on this device with its label and time relative to sunrise.

## Limits

- A locked phone can stop a web page from ringing. Keep the app open or pinned to the home screen. Converting to a native app (Capacitor with a local-notification plugin) fixes this, and `src/core/` has no React imports so it moves over unchanged.
- Photos and settings stay in the browser (IndexedDB and localStorage). Clearing site data deletes them.

## Layout

- `src/core/` framework-free logic: `sun.ts`, `sky-check.ts`, `alarms.ts` (the alarm list), `alarm.ts` (the ring), `store.ts`
- `src/hooks/` alarm list and clock, sound, wake lock, camera, clock
- `src/screens/` alarm, ring prompt, log, settings
- `src/components/` shared UI pieces; `components/ui` and `components/reui` are installed by shadcn/ReUI
