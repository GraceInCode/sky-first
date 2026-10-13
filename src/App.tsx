import { useCallback, useEffect, useState } from "react";
import { Settings as SettingsIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { AlarmScreen } from "@/screens/alarm-screen";
import { RingDialog } from "@/screens/ring-dialog";
import { LogScreen } from "@/screens/log-screen";
import { SettingsDialog } from "@/screens/settings-dialog";
import { useAlarmClock, useAlarms } from "@/hooks/use-alarm";
import { useAlarmSound } from "@/hooks/use-alarm-sound";
import { useNow } from "@/hooks/use-now";
import { useWakeLock } from "@/hooks/use-wake-lock";
import { loadSettings, saveSettings, type Settings } from "@/core/store";
import type { Coords } from "@/core/sun";

type View = "alarm" | "log";

export default function App() {
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [view, setView] = useState<View>("alarm");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);
  const { alarms, setAlarms, add, setTime, setOn, remove } = useAlarms();
  const [ring, dispatch] = useAlarmClock(alarms, setAlarms);
  const now = useNow();
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", resolvedTheme === "dark" ? "#27304a" : "#f4f1ea");
  }, [resolvedTheme]);

  const coords: Coords | null =
    settings.lat !== null && settings.lon !== null ? { lat: settings.lat, lon: settings.lon } : null;
  const ringing = ring.status === "ringing";

  useAlarmSound(ringing && settings.soundOn);
  useWakeLock(ringing);

  const updateSettings = useCallback((next: Settings) => {
    setSettings(next);
    saveSettings(next);
  }, []);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationStatus("This browser cannot share a location.");
      return;
    }
    setLocationStatus("Finding you…");
    navigator.geolocation.getCurrentPosition(
      ({ coords: c }) => {
        updateSettings({ ...settings, lat: c.latitude, lon: c.longitude });
        setLocationStatus(null);
      },
      () => setLocationStatus("Location was not shared. Sunrise times need it."),
      { enableHighAccuracy: false, timeout: 15_000, maximumAge: 60 * 60_000 },
    );
  }, [settings, updateSettings]);

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-md flex-col gap-6 p-4 pb-10">
      <header className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button
            variant={view === "alarm" ? "secondary" : "ghost"}
            size="sm"
            aria-pressed={view === "alarm"}
            onClick={() => setView("alarm")}
          >
            Alarm
          </Button>
          <Button
            variant={view === "log" ? "secondary" : "ghost"}
            size="sm"
            aria-pressed={view === "log"}
            onClick={() => setView("log")}
          >
            Log
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold tracking-tight">Sky First</span>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Settings"
            disabled={ringing}
            onClick={() => setSettingsOpen(true)}
          >
            <SettingsIcon />
          </Button>
        </div>
      </header>

      <main className="flex min-w-0 flex-1 flex-col">
        {view === "alarm" ? (
          <AlarmScreen
            now={now}
            coords={coords}
            alarms={alarms}
            ringing={ringing}
            onAdd={add}
            onSetTime={setTime}
            onSetOn={setOn}
            onRemove={remove}
            onRequestLocation={requestLocation}
            locationError={locationStatus}
          />
        ) : (
          <LogScreen onGoToAlarm={() => setView("alarm")} />
        )}
      </main>

      <RingDialog open={ringing} now={now} coords={coords} dispatch={dispatch} />
      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        onChange={updateSettings}
        onRequestLocation={requestLocation}
        locationStatus={locationStatus}
      />
      <Toaster />
    </div>
  );
}
