import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

/** A short, wide crop of the photo: the sky shown as a strip, not a square tile. */
export function SkyStrip({ blob, alt }: { blob: Blob; alt: string }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [blob]);

  if (!url) return <Skeleton className="h-14 w-24 shrink-0" />;
  return <img src={url} alt={alt} className="h-14 w-24 shrink-0 bg-muted object-cover" />;
}
