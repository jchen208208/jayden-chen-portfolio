import { useMemo, type CSSProperties } from "react";
import { mulberry32 } from "@/lib/svg";

/**
 * The ground behind a desk screen's name: a shard mosaic in shades of the
 * screens' umber (`--screen-bg` — the glow's own hue, darkened, so it isn't a
 * second colour), laid with thin black grout.
 *
 * The same recipe as the shard mosaic on the tennis site
 * (client-website-1 `Mosaic.tsx`): a coarse grid whose inner corners wander
 * a long way, so every cell is an irregular quad, and some cells are split
 * corner to corner into two triangles. Each piece takes one of a few tints,
 * never the same as the piece before it or the one above, so neighbours
 * always read apart. Corners on the glass's edge only slide along it, so the
 * mosaic still fills the glass. The grout is each piece's own black stroke:
 * neighbours share their edges, so it's one even line wherever they meet.
 *
 * Hovering the screen draws the pieces slightly apart — each drifts out from
 * the glass's centre with a faint tilt, like an exploded view, so the grout
 * widens a little. Clicking it (`burst`) throws them all outward from the point that
 * was hit, spinning, nearest first, until they've slid off the glass;
 * clearing `burst` brings them back. All of that motion is CSS
 * (`.mosaic-tile` in globals.css); this only lays the pieces and hands each
 * its moves.
 */

/** a cell's rough size, in desk units — only a few big pieces per screen.
 *  Never fewer than two cells each way, so even the small laptop's short
 *  glass is a mosaic rather than a row of strips. */
const CELL = 56;
/** how far an inner corner may wander, either way, as a share of a cell */
const JITTER = 0.35;
/** the share of cells split corner to corner into two triangles */
const SPLIT = 0.3;
/** the grout's width, in desk units */
const GROUT = 1.6;
/** a piece's tint over the umber: a share of black or of the glow mixed
 *  in, or none. The light pieces warm toward the glow rather than white,
 *  which would grey the umber out. Picked evenly, so about one piece in six
 *  is the lightest — a few bright shards per screen. That one stops at 26%
 *  so the amber route still reads on it. */
const TINTS = [
  { mix: "#000", amount: 25 },
  { mix: "#000", amount: 12 },
  null,
  { mix: "var(--glow)", amount: 10 },
  { mix: "var(--glow)", amount: 18 },
  { mix: "var(--glow)", amount: 26 },
];
/** hovering moves each piece out from the glass's centre by this share of
 *  its distance from it — so neighbours a cell apart part by only ~2.5
 *  units, a slight widening of the grout */
const SPREAD = 0.05;
/** …and tilts it by up to this many degrees either way */
const TILT = 1;
/** hovering staggers each piece's move by up to this, so they don't shift in
 *  lockstep */
const STAGGER_MS = 80;
/** a burst reaches the farthest piece this long after the nearest */
const RIPPLE_MS = 120;

type Point = { x: number; y: number };

type Piece = {
  points: string;
  /** the piece's centre */
  c: Point;
  fill: string;
  /** its hover move */
  part: Point;
  tilt: number;
  delay: number;
  /** its spin when thrown, in degrees */
  spin: number;
  /** how much farther than the minimum it flies, 0–1 */
  reach: number;
  /** the way it flies if the burst lands right on it */
  heading: number;
};

const r2 = (v: number) => Math.round(v * 100) / 100;

/** the same mosaic for a `w`×`h` glass every render, server and client */
function layPieces(w: number, h: number, seed: number): Piece[] {
  const rnd = mulberry32(seed);
  const cols = Math.max(2, Math.round(w / CELL));
  const rows = Math.max(2, Math.round(h / CELL));
  const cw = w / cols;
  const ch = h / rows;

  const corners: Point[][] = [];
  for (let r = 0; r <= rows; r++) {
    const row: Point[] = [];
    for (let c = 0; c <= cols; c++) {
      const dx = (rnd() * 2 - 1) * JITTER * cw;
      const dy = (rnd() * 2 - 1) * JITTER * ch;
      row.push({
        x: c * cw + (c > 0 && c < cols ? dx : 0),
        y: r * ch + (r > 0 && r < rows ? dy : 0),
      });
    }
    corners.push(row);
  }

  // a tint unlike its neighbours'
  const above = new Array<number>(cols).fill(-1);
  let last = -1;
  const pickTint = (avoid: number[]) => {
    let t: number;
    do t = Math.floor(rnd() * TINTS.length);
    while (avoid.includes(t));
    return t;
  };

  const pieces: Piece[] = [];
  const centre = { x: w / 2, y: h / 2 };
  const add = (shape: Point[], tint: number) => {
    const c = {
      x: shape.reduce((s, p) => s + p.x, 0) / shape.length,
      y: shape.reduce((s, p) => s + p.y, 0) / shape.length,
    };
    const t = TINTS[tint];
    pieces.push({
      points: shape.map((p) => `${r2(p.x)},${r2(p.y)}`).join(" "),
      c: { x: r2(c.x), y: r2(c.y) },
      fill: t ? `color-mix(in srgb, var(--screen-bg) ${100 - t.amount}%, ${t.mix})` : "var(--screen-bg)",
      part: { x: r2((c.x - centre.x) * SPREAD), y: r2((c.y - centre.y) * SPREAD) },
      tilt: r2((rnd() * 2 - 1) * TILT),
      delay: Math.round(rnd() * STAGGER_MS),
      spin: Math.round((40 + rnd() * 120) * (rnd() < 0.5 ? -1 : 1)),
      reach: rnd(),
      heading: rnd() * Math.PI * 2,
    });
  };

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const tl = corners[r][c];
      const tr = corners[r][c + 1];
      const br = corners[r + 1][c + 1];
      const bl = corners[r + 1][c];
      if (rnd() < SPLIT) {
        const [a, b] =
          rnd() < 0.5
            ? [
                [tl, tr, bl],
                [tr, br, bl],
              ]
            : [
                [tl, tr, br],
                [tl, br, bl],
              ];
        const t1 = pickTint([last, above[c]]);
        const t2 = pickTint([t1]);
        add(a, t1);
        add(b, t2);
        above[c] = t2;
        last = t2;
      } else {
        const t = pickTint([last, above[c]]);
        add([tl, tr, br, bl], t);
        above[c] = t;
        last = t;
      }
    }
  }
  return pieces;
}

/** where `piece` flies when the glass is hit at `burst`: straight away from
 *  that point, far enough that even a piece crossing the whole glass is past
 *  its far edge */
function flight(piece: Piece, burst: Point, w: number, h: number): CSSProperties {
  const diag = Math.hypot(w, h);
  const dx = piece.c.x - burst.x;
  const dy = piece.c.y - burst.y;
  const dist = Math.hypot(dx, dy);
  const [ux, uy] =
    dist > 0.5 ? [dx / dist, dy / dist] : [Math.cos(piece.heading), Math.sin(piece.heading)];
  const reach = diag + CELL * 1.5 + piece.reach * diag * 0.5;
  return {
    "--fly-x": `${r2(ux * reach)}px`,
    "--fly-y": `${r2(uy * reach)}px`,
    "--fly-r": `${piece.spin}deg`,
    "--fly-delay": `${Math.round((dist / diag) * RIPPLE_MS)}ms`,
  } as CSSProperties;
}

export default function ScreenMosaic({
  w,
  h,
  seed,
  burst,
}: {
  /** the glass's inner size, in desk units */
  w: number;
  h: number;
  seed: number;
  /** where the glass was hit, in the same units — set, the pieces fly off */
  burst: Point | null;
}) {
  const pieces = useMemo(() => layPieces(w, h, seed), [w, h, seed]);
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${r2(w)} ${r2(h)}`}
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 h-full w-full"
    >
      <g style={{ stroke: "var(--paper, #000)" }} strokeWidth={GROUT} strokeLinejoin="round">
        {pieces.map((piece) => (
          <polygon
            key={piece.points}
            points={piece.points}
            className="mosaic-tile"
            style={
              {
                fill: piece.fill,
                "--part-x": `${piece.part.x}px`,
                "--part-y": `${piece.part.y}px`,
                "--part-r": `${piece.tilt}deg`,
                "--tile-delay": `${piece.delay}ms`,
                ...(burst && flight(piece, burst, w, h)),
              } as CSSProperties
            }
          />
        ))}
      </g>
    </svg>
  );
}
