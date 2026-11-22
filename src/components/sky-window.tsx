import type { ReactNode } from "react";
import { skyTone } from "@/lib/sky";

type Props = {
  /** Sun altitude in degrees, or null when the location is unknown. */
  altitudeDeg: number | null;
  children?: ReactNode;
};

/**
 * The top of the app: the sky as it looks right now where you are.
 * The gradient and the sun's position come from the real sun altitude,
 * so the panel is information, not decoration.
 */
export function SkyWindow({ altitudeDeg, children }: Props) {
  const tone = skyTone(altitudeDeg);
  const known = altitudeDeg !== null;
  // -18° (full night) sits at the horizon on the left, 60° (high day) near the top right.
  const t = known ? Math.min(1, Math.max(0, (altitudeDeg + 18) / 78)) : 0.3;
  // Kept to the right half so the sun never sits on top of the text.
  const sunLeft = 56 + 32 * t;
  const sunUp = known && altitudeDeg > 0;
  const sunBottom = 10 + Math.min(1, Math.max(0, altitudeDeg ?? 0) / 50) * 62;

  return (
    <section
      aria-label="The sky now"
      className="sky-window relative isolate overflow-hidden rounded-[1.75rem] px-6 pt-6 pb-7"
      style={{
        background: `linear-gradient(180deg, ${tone.zenith} 0%, ${tone.horizon} 100%)`,
        color: tone.ink,
      }}
    >
      {known && sunUp && (
        <span
          aria-hidden
          className="sky-sun absolute size-9 -translate-x-1/2 rounded-full"
          style={{
            left: `${sunLeft}%`,
            bottom: `${sunBottom}%`,
            background: "radial-gradient(circle, #fff6d6 0%, #ffd36b 55%, #ffb547 100%)",
            boxShadow: "0 0 48px 16px rgb(255 205 110 / 0.45)",
          }}
        />
      )}
      {known && !sunUp && altitudeDeg > -12 && (
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-1/2"
          style={{ background: "radial-gradient(60% 70% at 50% 100%, rgb(255 196 140 / 0.45), transparent)" }}
        />
      )}
      <div aria-hidden className="absolute inset-x-0 bottom-3 h-px bg-white/30" />
      <div className="relative flex min-h-44 flex-col gap-3">{children}</div>
    </section>
  );
}
