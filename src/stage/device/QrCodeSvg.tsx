const N = 29;
const FINDERS = [
  [0, 0],
  [N - 7, 0],
  [0, N - 7],
] as const;
/** Version 3 QR layout: alignment pattern centred on (22, 22). */
const ALIGN = [20, 20] as const;

/** Small seeded PRNG (mulberry32) so a given print always draws the same code. */
const rng = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const hash = (s: string) => [...s].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261);

/** A look-alike order QR: real finder and alignment patterns around random data modules. */
export function QrCodeSvg({
  seed,
  size = 260,
  fg = "#27364b",
  clearCenter = false,
  className,
}: {
  seed: string;
  size?: number;
  fg?: string;
  /** Leave the middle blank, for a logo laid over the code. */
  clearCenter?: boolean;
  className?: string;
}) {
  const rand = rng(hash(seed));
  const reserved = (x: number, y: number) =>
    FINDERS.some(([fx, fy]) => x >= fx - 1 && x <= fx + 7 && y >= fy - 1 && y <= fy + 7) ||
    (x >= ALIGN[0] && x < ALIGN[0] + 5 && y >= ALIGN[1] && y < ALIGN[1] + 5) ||
    (clearCenter && x >= 10 && x <= 18 && y >= 10 && y <= 18);

  let d = "";
  const cell = (x: number, y: number) => {
    d += `M${x} ${y}h1v1h-1z`;
  };

  for (let y = 0; y < N; y += 1) for (let x = 0; x < N; x += 1) if (!reserved(x, y) && rand() < 0.5) cell(x, y);

  // finder: 7x7 ring + 3x3 eye
  for (const [fx, fy] of FINDERS)
    for (let y = 0; y < 7; y += 1)
      for (let x = 0; x < 7; x += 1) {
        const ring = x === 0 || x === 6 || y === 0 || y === 6;
        const eye = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        if (ring || eye) cell(fx + x, fy + y);
      }
  // alignment: 5x5 ring + centre
  for (let y = 0; y < 5; y += 1)
    for (let x = 0; x < 5; x += 1)
      if (x === 0 || x === 4 || y === 0 || y === 4 || (x === 2 && y === 2)) cell(ALIGN[0] + x, ALIGN[1] + y);

  return (
    <svg viewBox={`0 0 ${N} ${N}`} width={size} height={size} role="img" aria-label="Order QR code" shapeRendering="crispEdges" className={className}>
      <rect width={N} height={N} fill="#fff" />
      <path d={d} fill={fg} />
    </svg>
  );
}
