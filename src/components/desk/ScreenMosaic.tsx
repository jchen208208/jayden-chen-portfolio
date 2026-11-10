import { useMemo, type CSSProperties } from "react";
import { rampColour, rampPosition } from "@/lib/goldRamp";
import { mulberry32 } from "@/lib/svg";

/**
 * The ground behind a desk screen's name: a shard mosaic in the amber
 * shades of the hero name's squares — the gold stretch of its ramp
 * (`lib/goldRamp`), none of the greys — laid with thin black grout.
 *
 * The same recipe as the shard mosaic on the tennis site
 * (client-website-1 `Mosaic.tsx`): a coarse grid whose inner corners wander
 * a long way, so every cell is an irregular quad, and some cells are split
 * corner to corner into two triangles. Each piece takes a shade from that
 * ramp, never too close to the piece before it or the one above, so
 * neighbours always read apart. Corners on the glass's edge only slide along it, so the
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
 *
 * On the pixel desk (`cell`, the desk's art pixel) the same pieces are laid
 * in whole pixels, like the desk around them: each pixel of the glass takes
 * the piece its middle falls in, and one where the piece to its right or
 * below is another is left as grout, a pixel wide. Hovering then moves each
 * piece out by exactly one pixel, with no tilt, so the grout opens a pixel.
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
/** neighbouring pieces sit at least this far apart along the ramp (0–1),
 *  so they always read apart. The gold stretch they're drawn from is 0.45
 *  wide, and a piece steers clear of two neighbours, so this has to stay
 *  under a quarter of that or a piece could be left nothing to pick. */
const MIN_STEP = 0.08;
/** the share of black mixed into every piece — the glass turned down a
 *  touch from the name's own shades, so the route's white lettering
 *  (`.screen-label`) stands off it */
const DIM = 20;
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
  /** its corners */
  shape: Point[];
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

  // a shade unlike its neighbours', landing on the ramp just as one of the
  // name's gold squares does — never on its grey stretch
  const above = new Array<number>(cols).fill(-1);
  let last = -1;
  const pickShade = (avoid: number[]) => {
    let t: number;
    do t = rampPosition(rnd, true);
    while (avoid.some((a) => Math.abs(a - t) < MIN_STEP));
    return t;
  };

  const pieces: Piece[] = [];
  const centre = { x: w / 2, y: h / 2 };
  const add = (shape: Point[], shade: number) => {
    const c = {
      x: shape.reduce((s, p) => s + p.x, 0) / shape.length,
      y: shape.reduce((s, p) => s + p.y, 0) / shape.length,
    };
    pieces.push({
      points: shape.map((p) => `${r2(p.x)},${r2(p.y)}`).join(" "),
      shape,
      c: { x: r2(c.x), y: r2(c.y) },
      fill: `color-mix(in srgb, ${rampColour(shade)} ${100 - DIM}%, #000)`,
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
        const t1 = pickShade([last, above[c]]);
        const t2 = pickShade([t1]);
        add(a, t1);
        add(b, t2);
        above[c] = t2;
        last = t2;
      } else {
        const t = pickShade([last, above[c]]);
        add([tl, tr, br, bl], t);
        above[c] = t;
        last = t;
      }
    }
  }
  return pieces;
}

/** whether `p` is inside the polygon `shape` (even–odd) */
function inside(p: Point, shape: Point[]) {
  let hit = false;
  for (let i = 0, j = shape.length - 1; i < shape.length; j = i++) {
    const a = shape[i];
    const b = shape[j];
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) hit = !hit;
  }
  return hit;
}

/** the pieces laid in whole `cell`-sized pixels over a `w`×`h` glass: each
 *  piece's pixels as one path (in pixels), with a pixel of grout wherever
 *  the piece to the right or below is another */
function pixelate(pieces: Piece[], w: number, h: number, cell: number) {
  const cols = Math.round(w / cell);
  const rows = Math.round(h / cell);
  const owner = new Int16Array(cols * rows);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const c = { x: (x + 0.5) * cell, y: (y + 0.5) * cell };
      let k = pieces.findIndex((piece) => inside(c, piece.shape));
      if (k < 0) {
        // right on an edge between pieces: the nearest piece's
        let best = Infinity;
        pieces.forEach((piece, i) => {
          const d = Math.hypot(piece.c.x - c.x, piece.c.y - c.y);
          if (d < best) [best, k] = [d, i];
        });
      }
      owner[y * cols + x] = k;
    }
  }
  const paths = pieces.map(() => "");
  for (let y = 0; y < rows; y++) {
    let x = 0;
    while (x < cols) {
      const k = owner[y * cols + x];
      const grout = (i: number) =>
        (i + 1 < cols && owner[y * cols + i + 1] !== k) || (y + 1 < rows && owner[(y + 1) * cols + i] !== k);
      if (grout(x)) {
        x++;
        continue;
      }
      let n = 1;
      while (x + n < cols && owner[y * cols + x + n] === k && !grout(x + n)) n++;
      paths[k] += `M${x} ${y}h${n}v1h-${n}z`;
      x += n;
    }
  }
  return { cols, rows, paths };
}

/** where `piece` flies when the glass is hit at `burst`: straight away from
 *  that point, far enough that even a piece crossing the whole glass is past
 *  its far edge */
function flight(piece: Piece, burst: Point, w: number, h: number, unit = 1): CSSProperties {
  const diag = Math.hypot(w, h);
  const dx = piece.c.x - burst.x;
  const dy = piece.c.y - burst.y;
  const dist = Math.hypot(dx, dy);
  const [ux, uy] =
    dist > 0.5 ? [dx / dist, dy / dist] : [Math.cos(piece.heading), Math.sin(piece.heading)];
  const reach = diag + CELL * 1.5 + piece.reach * diag * 0.5;
  return {
    "--fly-x": `${r2((ux * reach) / unit)}px`,
    "--fly-y": `${r2((uy * reach) / unit)}px`,
    "--fly-r": `${piece.spin}deg`,
    "--fly-delay": `${Math.round((dist / diag) * RIPPLE_MS)}ms`,
  } as CSSProperties;
}

/** a pixel piece's hover move: one pixel out from the glass's middle along
 *  each way it's clearly off it */
const PIXEL_PART_DEADZONE = 0.12;

export default function ScreenMosaic({
  w,
  h,
  seed,
  burst,
  cell,
}: {
  /** the glass's inner size, in desk units */
  w: number;
  h: number;
  seed: number;
  /** where the glass was hit, in the same units — set, the pieces fly off */
  burst: Point | null;
  /** lay it in whole pixels this many desk units across (the pixel desk's) */
  cell?: number;
}) {
  const pieces = useMemo(() => layPieces(w, h, seed), [w, h, seed]);
  const pixels = useMemo(() => (cell ? pixelate(pieces, w, h, cell) : null), [pieces, w, h, cell]);

  if (pixels && cell) {
    const away = (d: number, size: number) => (Math.abs(d) < size * PIXEL_PART_DEADZONE ? 0 : Math.sign(d));
    return (
      <svg
        aria-hidden
        viewBox={`0 0 ${pixels.cols} ${pixels.rows}`}
        preserveAspectRatio="none"
        shapeRendering="crispEdges"
        className="mosaic-px pointer-events-none absolute inset-0 h-full w-full"
      >
        {pieces.map((piece, i) =>
          pixels.paths[i] ? (
            <path
              key={piece.points}
              d={pixels.paths[i]}
              className="mosaic-tile"
              style={
                {
                  fill: piece.fill,
                  "--part-x": `${away(piece.c.x - w / 2, w)}px`,
                  "--part-y": `${away(piece.c.y - h / 2, h)}px`,
                  "--part-r": "0deg",
                  "--tile-delay": `${piece.delay}ms`,
                  ...(burst && flight(piece, burst, w, h, cell)),
                } as CSSProperties
              }
            />
          ) : null,
        )}
      </svg>
    );
  }

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
