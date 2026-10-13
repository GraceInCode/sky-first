import { MapPin, Plus, Trash2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { SunHorizon } from "@/components/sun-horizon";
import { soonest, type Alarm } from "@/core/alarms";
import { sunInfo, type Coords } from "@/core/sun";
import { formatClock, formatMinutes } from "@/lib/format";

type Props = {
  now: Date;
  coords: Coords | null;
  alarms: Alarm[];
  ringing: boolean;
  onAdd: () => void;
  onSetTime: (id: string, time: string) => void;
  onSetOn: (id: string, enabled: boolean) => void;
  onRemove: (id: string) => void;
  onRequestLocation: () => void;
  locationError: string | null;
};

export function AlarmScreen({
  now,
  coords,
  alarms,
  ringing,
  onAdd,
  onSetTime,
  onSetOn,
  onRemove,
  onRequestLocation,
  locationError,
}: Props) {
  const sun = coords ? sunInfo(now, coords) : null;
  const next = soonest(alarms);

  const sunLine = sun?.sunrise
    ? `Sunrise ${formatClock(sun.sunrise)} · sun is ${formatAltitude(sun.altitudeDeg)}`
    : coords
      ? "No sunrise today at this place"
      : "Set your location to see sunrise";

  return (
    <div className="flex flex-col gap-8">
      {!coords && (
        <Alert variant="info">
          <MapPin />
          <AlertTitle>Location is needed for sunrise</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <span>The app uses it to tell you when the sun rises, and whether it is still night.</span>
            {locationError && <span role="status">{locationError}</span>}
            <Button size="sm" variant="outline" className="w-fit" onClick={onRequestLocation}>
              Use my location
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <section aria-label="Sky" className="flex flex-col gap-3">
        {sun && <SunHorizon altitudeDeg={sun.altitudeDeg} />}
        <p className="text-sm tabular-nums">{sunLine}</p>
        {next && (
          <p className="text-xs text-muted-foreground tabular-nums">Next alarm {nextLabel(new Date(next.nextAt), now)}</p>
        )}
      </section>

      {alarms.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>No alarms yet</EmptyTitle>
            <EmptyDescription>Add one for each morning you want to catch the sky.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={onAdd} disabled={ringing}>
              <Plus />
              Add an alarm
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="flex flex-col gap-4">
          <ul className="flex flex-col gap-3" aria-label="Alarms">
            {alarms.map((alarm) => (
              <li key={alarm.id}>
                <AlarmCard
                  alarm={alarm}
                  now={now}
                  disabled={ringing}
                  onSetTime={onSetTime}
                  onSetOn={onSetOn}
                  onRemove={onRemove}
                />
              </li>
            ))}
          </ul>
          <Button variant="outline" className="w-full" onClick={onAdd} disabled={ringing}>
            <Plus />
            Add an alarm
          </Button>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Browsers can stop a locked phone from ringing. Keep the app open or pinned to your home screen.
      </p>
    </div>
  );
}

type CardProps = {
  alarm: Alarm;
  now: Date;
  disabled: boolean;
  onSetTime: (id: string, time: string) => void;
  onSetOn: (id: string, enabled: boolean) => void;
  onRemove: (id: string) => void;
};

function AlarmCard({ alarm, now, disabled, onSetTime, onSetOn, onRemove }: CardProps) {
  const meta = alarm.enabled ? `Daily · next ${nextLabel(new Date(alarm.nextAt), now)}` : "Off";

  return (
    <Card size="sm">
      <CardContent className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <input
            type="time"
            aria-label="Wake time"
            value={alarm.time}
            disabled={disabled}
            onChange={(e) => e.target.value && onSetTime(alarm.id, e.target.value)}
            className="w-fit bg-transparent text-5xl font-semibold tracking-tight tabular-nums outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
          />
          <CardDescription className="text-xs tabular-nums">{meta}</CardDescription>
        </div>

        <div className="flex items-center gap-3">
          <Switch
            checked={alarm.enabled}
            disabled={disabled}
            aria-label={`Alarm at ${alarm.time}`}
            onCheckedChange={(checked) => onSetOn(alarm.id, checked)}
          />
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button variant="ghost" size="icon-sm" aria-label={`Delete alarm at ${alarm.time}`} disabled={disabled} />
              }
            >
              <Trash2 />
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete the {alarm.time} alarm?</AlertDialogTitle>
                <AlertDialogDescription>It will stop ringing. Your sky log stays.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep it</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={() => onRemove(alarm.id)}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}

/** "Tue 07:00, in 4h 12m". */
function nextLabel(at: Date, now: Date): string {
  const minutes = Math.max(0, Math.round((at.getTime() - now.getTime()) / 60_000));
  const day = at.toLocaleDateString([], { weekday: "short" });
  return `${day} ${formatClock(at)}, in ${formatMinutes(minutes)}`;
}

function formatAltitude(deg: number): string {
  const rounded = Math.round(Math.abs(deg));
  return deg >= 0 ? `${rounded}° up` : `${rounded}° below the horizon`;
}
