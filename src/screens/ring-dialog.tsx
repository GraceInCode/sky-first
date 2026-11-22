import { useRef, useState } from "react";
import { Camera, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useCamera } from "@/hooks/use-camera";
import { classifyPhoto } from "@/core/sky-check";
import { minutesAfterSunrise, sunInfo, type Coords } from "@/core/sun";
import { addEntry } from "@/core/store";
import type { AlarmEvent } from "@/core/alarm";
import { conditionCopy, formatClock } from "@/lib/format";
import { skyTone } from "@/lib/sky";

type Props = {
  open: boolean;
  now: Date;
  coords: Coords | null;
  dispatch: (event: AlarmEvent) => void;
};

/**
 * Full-screen and cannot be dismissed. The only exit is a saved photo,
 * which the alarm reducer turns into "captured" and then "idle".
 */
export function RingDialog({ open, now, coords, dispatch }: Props) {
  const camera = useCamera(open);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sun = coords ? sunInfo(now, coords) : null;
  const tone = skyTone(sun ? sun.altitudeDeg : null);
  const isNight = sun !== null && sun.altitudeDeg < -6;
  const ready = camera.status === "ready";

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
      setError("The camera did not return a picture. Use your phone's camera instead.");
    }
  }

  const openPhoneCamera = () => fileRef.current?.click();

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        showCloseButton={false}
        className="flex h-svh max-h-svh w-screen max-w-none flex-col gap-5 rounded-none border-0 p-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:max-w-none"
        style={{ background: `linear-gradient(180deg, ${tone.zenith} 0%, ${tone.horizon} 100%)`, color: tone.ink }}
      >
        <div className="flex flex-col gap-1">
          <p className="font-heading text-6xl leading-none font-bold tracking-tight tabular-nums">{formatClock(now)}</p>
          <DialogTitle className="font-heading text-2xl font-bold">Go and look at the sky</DialogTitle>
          <DialogDescription className="max-w-[34ch] text-sm" style={{ color: tone.ink, opacity: 0.85 }}>
            {isNight
              ? `It is still dark, and a dark sky counts.${sun?.sunrise ? ` Sunrise is at ${formatClock(sun.sunrise)}.` : ""}`
              : "Clouds, twilight and darkness all count. The alarm stops when you save a photo of the sky."}
          </DialogDescription>
        </div>

        <div className="relative min-h-0 flex-1 overflow-hidden rounded-[1.75rem] bg-black/30 ring-1 ring-white/25">
          <video
            ref={camera.videoRef}
            autoPlay
            muted
            playsInline
            onLoadedData={camera.markReady}
            onPlaying={camera.markReady}
            aria-label="Camera preview. Point it at the sky."
            className={`size-full object-cover ${ready ? "" : "invisible"}`}
          />
          {!ready && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center">
              <Camera className="size-8 opacity-80" aria-hidden />
              <p role="status" className="max-w-[28ch] text-sm">
                {camera.status === "starting"
                  ? "Starting the camera…"
                  : "The camera preview is not available here. Use your phone's camera below."}
              </p>
            </div>
          )}
        </div>

        {error && (
          <p role="alert" className="rounded-xl bg-black/35 px-3 py-2 text-sm text-white">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-2">
          {ready && (
            <Button
              size="lg"
              className="h-14 w-full rounded-full bg-white text-base text-[#142039] hover:bg-white/90"
              disabled={busy}
              onClick={takeFromCamera}
            >
              <Camera />
              {busy ? "Saving…" : "Take photo"}
            </Button>
          )}
          <Button
            size="lg"
            variant={ready ? "ghost" : "default"}
            className={
              ready
                ? "h-11 w-full rounded-full text-current hover:bg-white/15"
                : "h-14 w-full rounded-full bg-white text-base text-[#142039] hover:bg-white/90"
            }
            disabled={busy}
            onClick={openPhoneCamera}
          >
            <ImagePlus />
            {busy && !ready ? "Saving…" : "Use my phone's camera"}
          </Button>
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
