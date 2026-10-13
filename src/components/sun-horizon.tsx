/** The sun's altitude as a small arc over a horizon line. Decorative: the text beside it carries the meaning. */
export function SunHorizon({ altitudeDeg }: { altitudeDeg: number }) {
  // -18° (full night) sits on the left horizon, 60° (high day) at the top right.
  const t = Math.min(1, Math.max(0, (altitudeDeg + 18) / 78));
  const angle = Math.PI * (1 - t);
  const x = 100 + 72 * Math.cos(angle);
  const y = 80 - 72 * Math.sin(angle);
  const below = altitudeDeg < 0;

  return (
    <svg viewBox="0 0 200 88" aria-hidden className="w-full max-w-xs" overflow="visible">
      <path d="M28 80 A72 72 0 0 1 172 80" fill="none" strokeDasharray="2 4" className="stroke-muted-foreground/50" />
      <line x1="8" x2="192" y1="80" y2="80" className="stroke-border" strokeWidth="1" />
      <circle cx={x} cy={below ? 80 : y} r="6" className={below ? "fill-muted-foreground/40" : "fill-warning"} />
    </svg>
  );
}
