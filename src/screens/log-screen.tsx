import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/reui/badge";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/reui/alert";
import { SkyStrip } from "@/components/sky-strip";
import { listEntries, streakDays, type SkyEntry } from "@/core/store";
import { useNow } from "@/hooks/use-now";
import { conditionCopy, formatClock, formatMinutes } from "@/lib/format";

type Props = { onGoToAlarm: () => void };

const badgeVariant = {
  clear: "success-light",
  cloudy: "outline",
  night: "outline",
} as const;

export function LogScreen({ onGoToAlarm }: Props) {
  const now = useNow();
  const [entries, setEntries] = useState<SkyEntry[] | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setError(false);
    listEntries()
      .then(setEntries)
      .catch(() => setError(true));
  }, []);

  useEffect(load, [load]);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>The log did not load</AlertTitle>
        <AlertDescription>Your photos are still saved on this device.</AlertDescription>
        <AlertAction>
          <Button size="sm" variant="outline" onClick={load}>
            Retry
          </Button>
        </AlertAction>
      </Alert>
    );
  }

  if (entries === null) {
    return (
      <Card>
        <CardHeader>
          <span role="status" className="sr-only">
            Loading the sky log
          </span>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-14 w-24 shrink-0" />
              <div className="flex flex-1 flex-col gap-1.5">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-28" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (entries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No skies yet</CardTitle>
          <CardDescription>Each morning you look up gets a row here.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onGoToAlarm}>Set your first alarm</Button>
        </CardContent>
      </Card>
    );
  }

  const streak = streakDays(entries, now);

  return (
    <Card>
      <CardHeader className="gap-1">
        <CardTitle>Sky log</CardTitle>
        <CardDescription className="tabular-nums">
          {streak} {streak === 1 ? "morning" : "mornings"} in a row
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col divide-y">
          {entries.map((entry) => (
            <LogRow key={entry.id} entry={entry} />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function LogRow({ entry }: { entry: SkyEntry }) {
  const taken = new Date(entry.takenAt);
  const copy = conditionCopy[entry.condition];
  const offset =
    entry.minutesAfterSunrise === null
      ? "No sunrise data"
      : entry.minutesAfterSunrise < 0
        ? `${formatMinutes(-entry.minutesAfterSunrise)} before sunrise`
        : `${formatMinutes(entry.minutesAfterSunrise)} after sunrise`;

  return (
    <li className="flex items-center gap-3 py-3">
      <SkyStrip blob={entry.blob} alt={`Sky photo taken at ${formatClock(taken)}, ${copy.label.toLowerCase()}`} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-sm font-medium tabular-nums">{formatClock(taken)}</span>
        <span className="truncate text-xs text-muted-foreground tabular-nums">{offset}</span>
      </div>
      <Badge variant={badgeVariant[entry.condition]}>{copy.label}</Badge>
    </li>
  );
}
