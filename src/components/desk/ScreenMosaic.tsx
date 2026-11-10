import { useMemo, type CSSProperties } from "react";
import { rampColour, rampPosition } from "@/lib/goldRamp";
import { mulberry32 } from "@/lib/svg";

/**
 * The ground behind a desk screen's name: a mosaic of rectangular tiles in
 * the amber shades of the hero name's squares — the gold stretch of its ramp
 * (`lib/goldRamp`), none of the greys — laid in the pixel desk's pixels
 * (`cell`) with a pixel of black grout between them.
 *
 * Only flat and upright cuts, so every edge and every line of grout is clean
 * in pixels; the old shards' slanted cracks came out as ragged staircases.
 * The glass is cut like a Mondrian: a piece is picked — the bigger, the
 * likelier — and cut across somewhere between a quarter and three quarters
 * along, until there are about as many pieces as the glass's size calls for.
 * So pieces vary a lot in size, and a few big ones survive among small ones.
 * A cut never leaves a piece thinner than `MIN_SIDE` or more stretched than
 * `MAX_ASPECT`, and never lines up (or nearly) with a line across the grout
 * at its ends, so lines meet as Ts rather than running on through as a grid.
 * Each piece takes a shade never too close to its neighbours', so they
 * always read apart. The glass's own edge has no grout.
 *
 * Hovering the screen moves each piece a pixel out from the glass's middle,
 * so the grout opens a pixel. Clicking it (`burst`) draws each piece
 * straight into the edge of the glass it's closest to, until it's gone in
 * under the bezel — those nearest the point that was hit first; clearing
 * `burst` brings them back. All of that motion is CSS (`.mosaic-tile` in
 * globals.css); this only lays the pieces and hands each its moves.
 */

/** the glass's area per piece, in pixels — so 4–12 pieces a screen */
const TILE_AREA = 150;
const MIN_TILES = 4;
const MAX_TILES = 12;
/** no piece thinner than this, in pixels */
const MIN_SIDE = 4;
/** …or longer than this many times its width — longer, and runs of them
 *  side by side read as a barcode */
const MAX_ASPECT = 2.5;
/** which piece is cut next: the odds go with its area to this power, so big
 *  pieces are usually cut but now and then one is left whole */
const SIZE_BIAS = 1.5;
/** a cut whose line would meet a parallel line across the grout at its ends
 *  (or come within this many pixels of it) is tried elsewhere */
const LINE_OFFSET = 2;
/** where along a piece a cut can fall, either side of the middle */
const CUT_RANGE = 0.25;
/** neighbouring pieces sit at least this far apart along the ramp (0–1), so
 *  they always read apart — where a piece has too many neighbours for that,
 *  it takes the shade farthest from them of `SHADE_TRIES` */
const MIN_STEP = 0.08;
const SHADE_TRIES = 24;
/** the share of black mixed into every piece — the glass turned down a
 *  touch from the name's own shades, so the route's white lettering
 *  (`.screen-label`) stands off it */
const DIM = 20;
/** hovering staggers each piece's move by up to this, so they don't shift in
 *  lockstep */
const STAGGER_MS = 80;
/** a click sets the farthest piece retracting this long after the nearest */
const RIPPLE_MS = 60;
/** on hover a piece moves a pixel out along each way it's clearly off the
 *  glass's middle — not along one it's within this share of the glass of */
const PART_DEADZONE = 0.12;

type Point = { x: number; y: number };

/** a piece, in pixels */
type Tile = { x: number; y: number; w: number; h: number };

type Piece = Tile & {
  fill: string;
  delay: number;
};

const stretched = (a: number, b: number) => Math.max(a, b) / Math.min(a, b) > MAX_ASPECT;

/** the glass, `cols`×`rows` pixels, cut into pieces — the same ones every
 *  render, server and client */
function cutGlass(cols: number, rows: number, rnd: () => number): Tile[] {
  const grout = new Uint8Array(cols * rows);
  const isGrout = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < cols && y < rows && grout[y * cols + x] === 1;

  /** `t` cut in two, or null if no cut fits */
  const cut = (t: Tile): [Tile, Tile] | null => {
    const canX = t.w >= MIN_SIDE * 2 + 1;
    const canY = t.h >= MIN_SIDE * 2 + 1;
    if (!canX && !canY) return null;
    // across its longer side, unless it's near square
    const aspect = Math.max(t.w, t.h) / Math.min(t.w, t.h);
    const first = !canX ? false : !canY ? true : aspect < 1.3 ? rnd() < 0.5 : t.w > t.h;
    for (const upright of [first, !first]) {
      if (upright ? !canX : !canY) continue;
      const side = upright ? t.w : t.h;
      for (let tries = 0; tries < 8; tries++) {
        const at = Math.min(
          side - MIN_SIDE - 1,
          Math.max(MIN_SIDE, Math.round(side * (0.5 - CUT_RANGE + 2 * CUT_RANGE * rnd()))),
        );
        // the line of grout, and whether one runs on from it (near enough)
        // across the grout at either of its ends
        const line = (upright ? t.x : t.y) + at;
        let meets = false;
        for (let d = 1 - LINE_OFFSET; d < LINE_OFFSET; d++) {
          if (
            upright
              ? isGrout(line + d, t.y - 2) || isGrout(line + d, t.y + t.h + 1)
              : isGrout(t.x - 2, line + d) || isGrout(t.x + t.w + 1, line + d)
          )
            meets = true;
        }
        if (meets) continue;
        const rest = side - at - 1;
        if (upright ? stretched(at, t.h) || stretched(rest, t.h) : stretched(t.w, at) || stretched(t.w, rest)) {
          continue;
        }
        if (upright) {
          for (let y = t.y; y < t.y + t.h; y++) grout[y * cols + line] = 1;
          return [
            { x: t.x, y: t.y, w: at, h: t.h },
            { x: line + 1, y: t.y, w: rest, h: t.h },
          ];
        }
        for (let x = t.x; x < t.x + t.w; x++) grout[line * cols + x] = 1;
        return [
          { x: t.x, y: t.y, w: t.w, h: at },
          { x: t.x, y: line + 1, w: t.w, h: rest },
        ];
      }
    }
    return null;
  };

  const tiles: Tile[] = [{ x: 0, y: 0, w: cols, h: rows }];
  const target = Math.min(MAX_TILES, Math.max(MIN_TILES, Math.round((cols * rows) / TILE_AREA)));
  const whole = new Set<Tile>();
  while (tiles.length < target) {
    const open = tiles.filter((t) => !whole.has(t));
    if (!open.length) break;
    const odds = open.map((t) => (t.w * t.h) ** SIZE_BIAS);
    let r = rnd() * odds.reduce((a, b) => a + b, 0);
    let i = 0;
    while (i < open.length - 1 && r > odds[i]) r -= odds[i++];
    const halves = cut(open[i]);
    if (halves) tiles.splice(tiles.indexOf(open[i]), 1, ...halves);
    else whole.add(open[i]);
  }
  return tiles;
}

/** whether `a` and `b` face each other across a pixel of grout */
const overlaps = (a0: number, a1: number, b0: number, b1: number) => a0 < b1 && b0 < a1;
function touching(a: Tile, b: Tile) {
  if (a.x + a.w + 1 === b.x || b.x + b.w + 1 === a.x) return overlaps(a.y, a.y + a.h, b.y, b.y + b.h);
  if (a.y + a.h + 1 === b.y || b.y + b.h + 1 === a.y) return overlaps(a.x, a.x + a.w, b.x, b.x + b.w);
  return false;
}

/** the glass's pieces, shaded and given their moves */
function layPieces(cols: number, rows: number, seed: number): Piece[] {
  const rnd = mulberry32(seed);
  const tiles = cutGlass(cols, rows, rnd);

  // a shade unlike its neighbours', landing on the ramp just as one of the
  // name's gold squares does — never on its grey stretch
  const shades: number[] = [];
  tiles.forEach((tile, i) => {
    const avoid = shades.filter((_, j) => touching(tile, tiles[j]));
    let best = rampPosition(rnd, true);
    const clearance = (t: number) => Math.min(1, ...avoid.map((a) => Math.abs(a - t)));
    for (let k = 1; k < SHADE_TRIES && clearance(best) < MIN_STEP; k++) {
      const t = rampPosition(rnd, true);
      if (clearance(t) > clearance(best)) best = t;
    }
    shades[i] = best;
  });

  return tiles.map((tile, i) => ({
    ...tile,
    fill: `color-mix(in srgb, ${rampColour(shades[i])} ${100 - DIM}%, #000)`,
    delay: Math.round(rnd() * STAGGER_MS),
  }));
}

/** where `piece` goes when the glass, `cols`×`rows` pixels, is clicked at
 *  `burst` (in desk units, `cell` to a pixel): straight into the edge it's
 *  closest to — the one it touches, or across the narrowest gap; on a tie,
 *  the shorter way out — and a pixel past it, so it's gone entirely. It
 *  sets off a beat after the pieces nearer the click. */
function retract(piece: Piece, burst: Point, cols: number, rows: number, cell: number): CSSProperties {
  const ways = [
    { gap: piece.x, out: piece.x + piece.w, dx: -1, dy: 0 },
    { gap: cols - piece.x - piece.w, out: cols - piece.x, dx: 1, dy: 0 },
    { gap: piece.y, out: piece.y + piece.h, dx: 0, dy: -1 },
    { gap: rows - piece.y - piece.h, out: rows - piece.y, dx: 0, dy: 1 },
  ];
  const way = ways.reduce((a, b) => (b.gap < a.gap || (b.gap === a.gap && b.out < a.out) ? b : a));
  const dist = Math.hypot((piece.x + piece.w / 2) * cell - burst.x, (piece.y + piece.h / 2) * cell - burst.y);
  return {
    "--fly-x": `${way.dx * (way.out + 1)}px`,
    "--fly-y": `${way.dy * (way.out + 1)}px`,
    "--fly-delay": `${Math.round((dist / Math.hypot(cols * cell, rows * cell)) * RIPPLE_MS)}ms`,
  } as CSSProperties;
}

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
  /** the desk's pixel, in desk units — the mosaic is laid in these */
  cell: number;
}) {
  const cols = Math.round(w / cell);
  const rows = Math.round(h / cell);
  const pieces = useMemo(() => layPieces(cols, rows, seed), [cols, rows, seed]);
  const away = (d: number, size: number) => (Math.abs(d) < size * PART_DEADZONE ? 0 : Math.sign(d));

  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${cols} ${rows}`}
      preserveAspectRatio="none"
      shapeRendering="crispEdges"
      className="mosaic-px pointer-events-none absolute inset-0 h-full w-full"
    >
      {pieces.map((piece) => (
        <rect
          key={`${piece.x},${piece.y}`}
          x={piece.x}
          y={piece.y}
          width={piece.w}
          height={piece.h}
          className="mosaic-tile"
          style={
            {
              fill: piece.fill,
              "--part-x": `${away(piece.x + piece.w / 2 - cols / 2, cols)}px`,
              "--part-y": `${away(piece.y + piece.h / 2 - rows / 2, rows)}px`,
              "--part-r": "0deg",
              "--tile-delay": `${piece.delay}ms`,
              ...(burst && retract(piece, burst, cols, rows, cell)),
            } as CSSProperties
          }
        />
      ))}
    </svg>
  );
}
