import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { Settings } from "@/core/store";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: Settings;
  onChange: (next: Settings) => void;
  onRequestLocation: () => void;
  locationStatus: string | null;
};

const themeOptions = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export function SettingsDialog({ open, onOpenChange, settings, onChange, onRequestLocation, locationStatus }: Props) {
  const hasLocation = settings.lat !== null && settings.lon !== null;
  const { theme = "system", setTheme } = useTheme();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Changes save as you make them.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6">
          <div role="group" aria-labelledby="location-heading" className="flex flex-col gap-2">
            <p id="location-heading" className="text-sm font-medium">
              Location
            </p>
            <p className="text-xs text-muted-foreground" role="status">
              {locationStatus ?? (hasLocation ? "Location saved on this device." : "Used only for sunrise times.")}
            </p>
            <Button variant="outline" className="w-fit" onClick={onRequestLocation}>
              {hasLocation ? "Update location" : "Use my location"}
            </Button>
          </div>

          <Separator />

          <div role="group" aria-labelledby="sound-heading" className="flex flex-col gap-2">
            <p id="sound-heading" className="text-sm font-medium">
              Alarm sound
            </p>
            <Toggle
              variant="outline"
              className="w-fit"
              pressed={settings.soundOn}
              onPressedChange={(soundOn) => onChange({ ...settings, soundOn })}
            >
              Sound
            </Toggle>
          </div>

          <Separator />

          <div role="group" aria-labelledby="theme-heading" className="flex flex-col gap-2">
            <p id="theme-heading" className="text-sm font-medium">
              Theme
            </p>
            <ToggleGroup
              variant="outline"
              value={[theme]}
              onValueChange={(values) => values[0] && setTheme(values[0])}
            >
              {themeOptions.map((option) => (
                <ToggleGroupItem key={option.value} value={option.value}>
                  {option.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
