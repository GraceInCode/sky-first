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
import { useLocation } from "@/hooks/use-location";
import { useNow } from "@/hooks/use-now";
import { useWakeLock } from "@/hooks/use-wake-lock";
import { loadSettings, saveSettings, type Settings } from "@/core/store";
import type { Coords } from "@/core/sun";

type View = "alarm" | "log";

export default function App() {
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [view, setView] = useState<View>("alarm");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { alarms, setAlarms, add, setTime, setOn, remove } = useAlarms();
  const [ring, dispatch] = useAlarmClock(alarms, setAlarms);
  const now = useNow();
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", resolvedTheme === "dark" ? "#0f1630" : "#eef3f8");
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

  const onFound = useCallback((lat: number, lon: number) => {
    setSettings((prev) => {
      const next = { ...prev, lat, lon };
      saveSettings(next);
      return next;
    });
  }, []);
  const location = useLocation(onFound);

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-md flex-col gap-5 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-10">
      <header className="flex items-center justify-between gap-2">
        <span className="font-heading text-xl font-bold tracking-tight">Sky First</span>
        <div className="flex items-center gap-1">
          <nav aria-label="Sections" className="flex rounded-full bg-secondary p-1">
            {(["alarm", "log"] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                onClick={() => setView(v)}
                className="rounded-full px-3.5 py-1 text-sm font-medium text-muted-foreground transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-pressed:bg-card aria-pressed:text-foreground aria-pressed:shadow-sm"
              >
                {v === "alarm" ? "Alarms" : "Sky log"}
              </button>
            ))}
          </nav>
          <Button
            variant="ghost"
            size="icon"
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
            location={location.state}
            onRequestLocation={location.request}
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
        onRequestLocation={location.request}
        locationStatus={
          location.state.kind === "error"
            ? location.state.message
            : location.state.kind === "finding"
              ? "Finding you…"
              : null
        }
      />
      <Toaster />
    </div>
  );
}
