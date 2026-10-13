import { useRef, useState } from "react";
import { Camera, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/reui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCamera } from "@/hooks/use-camera";
import { classifyPhoto } from "@/core/sky-check";
import { minutesAfterSunrise, sunInfo, type Coords } from "@/core/sun";
import { addEntry } from "@/core/store";
import type { AlarmEvent } from "@/core/alarm";
import { conditionCopy, formatClock } from "@/lib/format";

type Props = {
  open: boolean;
  now: Date;
  coords: Coords | null;
  dispatch: (event: AlarmEvent) => void;
};

/**
 * Cannot be dismissed. The only exit is a saved photo, which the alarm
 * reducer turns into "captured" and then "idle".
 */
export function RingDialog({ open, now, coords, dispatch }: Props) {
  const camera = useCamera(open);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sun = coords ? sunInfo(now, coords) : null;
  const isNight = sun !== null && sun.altitudeDeg < -6;
  const sunriseNote = sun?.sunrise ? ` The sun rises at ${formatClock(sun.sunrise)}.` : "";

  async function save(blob: Blob) {
    setBusy(true);
    setError(null);
    try {
      const at = new Date();
      const altitude = coords ? sunInfo(at, coords).altitudeDeg : 0;
      const reading = await classifyPhoto(blob, altitude);
      await addEntry({
        id: crypto.randomUUID(),
        takenAt: at.toISOString(),
        ...reading,
        minutesAfterSunrise: coords ? minutesAfterSunrise(at, coords) : null,
        blob,
      });
      dispatch({ type: "CAPTURE", at: at.toISOString(), reading });
      dispatch({ type: "ACKNOWLEDGE" });
      toast.success(`Logged: ${conditionCopy[reading.condition].label.toLowerCase()}`, {
        description: conditionCopy[reading.condition].note,
      });
    } catch {
      setError("That photo did not save. Take another one.");
    } finally {
      setBusy(false);
    }
  }

  async function takeFromCamera() {
    try {
      await save(await camera.snapshot());
    } catch {
      setError("The camera did not return a frame. Try again.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Look at the sky</DialogTitle>
          <DialogDescription>
            {isNight
              ? `It is still dark, and a dark sky counts.${sunriseNote}`
              : "Clouds, twilight and darkness all count. Photograph the sky above you."}
          </DialogDescription>
        </DialogHeader>

        {camera.status === "ready" && (
          <video
            ref={camera.videoRef}
            muted
            playsInline
            aria-label="Camera preview, pointed at the sky"
            className="aspect-[3/4] w-full bg-muted object-cover"
          />
        )}

        {error && (
          <div className="animate-in fade-in duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:animate-none">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          {camera.status === "ready" ? (
            <Button size="lg" className="w-full" disabled={busy} onClick={takeFromCamera}>
              <Camera />
              {busy ? "Saving" : "Take photo"}
            </Button>
          ) : (
            <Button size="lg" className="w-full" disabled={busy} onClick={() => fileRef.current?.click()}>
              <ImagePlus />
              {busy ? "Saving" : "Take a photo of the sky"}
            </Button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) void save(file);
            }}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
