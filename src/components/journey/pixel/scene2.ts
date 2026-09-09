/**
 * piece2, rebuilt as Minecraft blocks: the waterfall from piece1 plunges into a
 * misty pool between dark gorge walls, then the view opens onto a forest canopy
 * seen from just above — layered rounded crowns, warm sunset rim-light on top,
 * teal shade beneath, a big forked focal tree dead centre, weeping trees draping
 * the sides, heavy drifting mist and a scatter of spirit-light motes.
 *
 * Pure + deterministic. Grid [row][col]; null = sky/haze behind. Same 21-column
 * width as piece1 so the falls line up across the seam.
 */

import type { TexKey } from "./textures";
import type { Cell } from "./scene";

export const COLS = 21;
export const ROWS = 38;

export type WaterCell = { c: number; r: number; bright: number };
export type MistBlob = { blocks: { x: number; y: number }[]; color: string; drift: number };
export type Mote = {
  x: number;
  y: number;
  r: number;
  phase: number;
  drift: number;
  rise: number;
};

export type Scene2 = {
  cells: (Cell | null)[][];
  water: WaterCell[];
  mist: MistBlob[];
  motes: Mote[];
  skyStops: [number, string][];
  glows: { x: number; y: number; r: number; color: string }[];
  /** [topRow, peakRow, botRow] of the static haze band over the pool */
  mistBand: [number, number, number];
};

/* ── helpers ─────────────────────────────────────────────────────────────── */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
function choose<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

const TILE = 16;
const FALLS_L = 8;
const FALLS_R = 11;
const POOL_TOP_ROW = 4;
const POOL_BOT_ROW = 8;

const DARK_ROCK: [TexKey, number][] = [
  ["stone", 0.4],
  ["cobblestone", 0.28],
  ["mossy_cobblestone", 0.16],
  ["mossy_stone_bricks", 0.1],
  ["gravel", 0.06],
];
function pickRock(rng: () => number): TexKey {
  let x = rng();
  for (const [v, w] of DARK_ROCK) if ((x -= w) <= 0) return v;
  return "stone";
}

export function buildScene2(seed = 0x2ca0): Scene2 {
  const rng = mulberry32(seed);
  const cells: (Cell | null)[][] = Array.from({ length: ROWS }, () =>
    Array<Cell | null>(COLS).fill(null),
  );
  const set = (r: number, c: number, cell: Cell) => {
    if (r >= 0 && r < ROWS && c >= 0 && c < COLS) cells[r][c] = cell;
  };
  const at = (r: number, c: number) =>
    r >= 0 && r < ROWS && c >= 0 && c < COLS ? cells[r][c] : null;

  /* ── gorge walls + the falls landing ──────────────────────────────────── */
  const jag = Array.from({ length: 9 }, () => (rng() < 0.6 ? 0 : 1));
  for (let r = 0; r < POOL_BOT_ROW + 2; r++) {
    const lw = clamp(4 + jag[r % jag.length] - (r < 3 ? 1 : 0), 2, 6);
    const rw = clamp(16 - jag[(r + 2) % jag.length] + (r < 3 ? 1 : 0), 14, 18);
    for (let c = 0; c <= lw; c++)
      set(r, c, { base: pickRock(rng), dark: clamp(0.34 - c * 0.03, 0.1, 0.34) });
    for (let c = rw; c < COLS; c++)
      set(r, c, { base: pickRock(rng), dark: clamp(0.34 - (COLS - 1 - c) * 0.03, 0.1, 0.34) });
  }
  // a small mossy outcrop jutting from the right wall, as in the painting
  for (let c = 12; c <= 15; c++) {
    const h = c === 15 ? 3 : c === 14 ? 2 : 1;
    for (let r = 3; r < 3 + h; r++)
      set(r, c, { base: r === 3 ? "moss_block" : pickRock(rng), dark: 0.18 });
  }
  set(3, 12, { base: "vine" });
  set(4, 12, { base: "vine" });

  /* ── the falls + plunge pool ──────────────────────────────────────────── */
  const water: WaterCell[] = [];
  for (let r = 0; r <= POOL_TOP_ROW + 1; r++)
    for (let c = FALLS_L; c <= FALLS_R; c++) {
      cells[r][c] = null;
      const mid = c === 9 || c === 10;
      water.push({ c, r, bright: Math.min(0.6, (mid ? 0.22 : 0.08) + rng() * 0.1) });
    }
  // ragged pool: surface row + depth vary per column, narrower at the sides
  for (let c = 3; c <= 17; c++) {
    const edge = Math.min(c - 3, 17 - c) / 6; // 0 at rim → 1 mid
    if (rng() > 0.25 + edge * 0.9) continue;
    const top = POOL_TOP_ROW + (rng() < 0.5 ? 0 : 1);
    const depth = 1 + Math.round(edge * 2 + rng());
    for (let r = top; r < top + depth; r++) {
      cells[r][c] = null;
      const impact = Math.abs(c - 9.5) < 3 && r <= POOL_TOP_ROW + 1 ? 0.5 : 0;
      water.push({ c, r, bright: Math.min(0.75, impact + 0.05 + rng() * 0.12) });
    }
  }

  /* ── canopy ───────────────────────────────────────────────────────────────
     Built as one SOLID mass with an undulating, warm-lit top edge (a heightmap
     of overlapping rounded bumps) rather than separate floating crowns — that's
     what stops the gaps between stamps reading as rectangular holes. Depth comes
     from the shading: a thin warm rim on the crest, a belly shade deepening
     downward, the flanks in shade and the backlit centre kept light. The forked
     focal tree pokes up through the surface; weeping trees drape the sides. */
  const FRONT_LEAVES: TexKey[] = ["jungle_leaves", "oak_leaves"];
  const leafAt = (c: number): TexKey =>
    c <= 6
      ? rng() < 0.75
        ? "jungle_leaves"
        : "oak_leaves"
      : c >= 14
        ? rng() < 0.7
          ? "oak_leaves"
          : "jungle_leaves"
        : choose(rng, FRONT_LEAVES);

  // undulating canopy surface: sum of a few rounded bumps, focal crown highest
  const bump = (c: number, at0: number, w: number, h: number) =>
    h * Math.max(0, 1 - ((c - at0) / w) ** 2);
  const canopyTop: number[] = [];
  for (let c = 0; c < COLS; c++) {
    const h =
      16.5 -
      bump(c, 4, 4.5, 3.5) -
      bump(c, 11, 4, 5) - // focal crown
      bump(c, 17, 4.5, 3.5) -
      bump(c, 9, 8, 1.5) +
      (rng() - 0.5) * 1.2;
    canopyTop[c] = Math.max(9, Math.round(h));
  }

  for (let c = 0; c < COLS; c++) {
    const t = canopyTop[c];
    const flank = Math.max(0, 1 - Math.min(c, COLS - 1 - c) / 6); // 1 at edges
    for (let r = t; r < ROWS; r++) {
      if (at(r, c)) continue;
      const depth = r - t;
      const belly = clamp(depth * 0.05, 0, 0.34);
      const back = r > 19 && r < 31 && c > 3 && c < 17 ? -0.12 : 0; // backlit centre
      set(r, c, {
        base: leafAt(c),
        warm: depth === 0 ? 0.2 : depth === 1 ? 0.08 : 0,
        bright: depth === 0 ? 0.14 : 0,
        dark: clamp(belly + flank * 0.14 + back + rng() * 0.03, 0, 0.5),
      });
    }
  }

  // internal crown lobes — break the flat fill into rounded masses: lit +
  // slightly raised in the light, shaded in the hollows between them
  const lobe = (cc: number, cr: number, rad: number, dWarm: number, dDark: number) => {
    for (let dr = -rad; dr <= rad; dr++)
      for (let dc = -rad - 1; dc <= rad + 1; dc++) {
        const d = Math.hypot(dc / (rad + 0.6), dr / rad);
        if (d > 1) continue;
        const cell = at(cr + dr, cc + dc);
        if (!cell || cell.base === "jungle_log" || cell.base === "vine") continue;
        const f = 1 - d;
        if (dWarm) {
          cell.warm = clamp((cell.warm ?? 0) + dWarm * f, 0, 0.3);
          cell.bright = clamp((cell.bright ?? 0) + 0.06 * f, 0, 0.2);
          cell.dark = Math.max(0, (cell.dark ?? 0) - 0.1 * f);
        }
        if (dDark) cell.dark = clamp((cell.dark ?? 0) + dDark * f, 0, 0.55);
      }
  };
  for (const [cc, cr, rad] of [
    [4, 19, 3],
    [16, 18, 3],
    [9, 24, 3],
    [19, 25, 2],
    [2, 28, 3],
    [13, 30, 3],
  ] as const)
    lobe(cc, cr, rad, 0.16, 0);
  for (const [cc, cr, rad] of [
    [8, 22, 2],
    [12, 20, 2],
    [17, 24, 2],
    [5, 27, 2],
    [10, 31, 2],
  ] as const)
    lobe(cc, cr, rad, 0, 0.16);

  // a few faint distant treetops lost in the mist above the surface
  for (const [cc, cr] of [
    [4, 7],
    [16, 6],
  ] as const)
    for (let dc = -2; dc <= 2; dc++)
      for (let dr = -1; dr <= 1; dr++) {
        if (Math.hypot(dc / 2.4, dr / 1.4) > 1 + rng() * 0.2) continue;
        set(cr + dr, cc + dc, {
          base: rng() < 0.5 ? "spruce_leaves" : "dark_oak_leaves",
          dark: 0.22 + rng() * 0.06,
        });
      }

  /* ── central focal tree — forked jungle-log trunk breaking the surface ── */
  {
    const tc = 10;
    for (let r = 31; r >= 12; r--) {
      set(r, tc, { base: "jungle_log" });
      set(r, tc + 1, { base: "jungle_log", dark: 0.16 });
    }
    // branches forking up and out from the crown
    for (const [dc, dr] of [
      [-1, -1],
      [-2, -2],
      [-3, -3],
      [-4, -4],
      [2, -1],
      [3, -2],
      [4, -3],
      [5, -4],
      [0, -3],
      [1, -4],
    ] as const)
      set(12 + dr, tc + dc, { base: "jungle_log", dark: dr < -3 ? 0.1 : 0 });
  }

  /* ── weeping trees on the flanks (long draping vine strands) ──────────── */
  const weeper = (tc: number, lean: number) => {
    const baseR = 19;
    for (let r = baseR; r >= baseR - 6; r--)
      set(r, tc + Math.round((baseR - r) * lean * 0.16), {
        base: "jungle_log",
        dark: 0.14,
      });
    for (let c = tc - 3; c <= tc + 3; c++) {
      if (rng() < 0.28) continue;
      const r0 = baseR - 7 + Math.floor(rng() * 3);
      const len = 9 + Math.floor(rng() * 10);
      for (let r = r0; r < r0 + len && r < ROWS; r++) {
        const cell = at(r, c);
        if (cell && cell.base !== "vine") cell.overlay = "vine";
        else set(r, c, { base: "vine", warm: r < r0 + 3 ? 0.16 : 0 });
      }
    }
  };
  weeper(2, 1);
  weeper(COLS - 3, -1);

  /* ── mist ─────────────────────────────────────────────────────────────── */
  const mist: MistBlob[] = [];
  const mistBlob = (x0: number, y0: number, w: number, drift: number, alpha: number) => {
    const blocks: { x: number; y: number }[] = [];
    const h = 2 + Math.floor(rng() * 3);
    for (let ry = 0; ry < h; ry++)
      for (let rx = 0; rx < w; rx++)
        if (rng() < 0.85) blocks.push({ x: x0 + rx, y: y0 + ry });
    mist.push({ blocks, color: `rgba(224,231,237,${alpha})`, drift });
  };
  for (let i = 0; i < 5; i++)
    mistBlob(Math.floor(rng() * COLS), 3 + Math.floor(rng() * 6), 5 + Math.floor(rng() * 6), 0.004 + rng() * 0.006, 0.12 + rng() * 0.1);
  for (let i = 0; i < 4; i++)
    mistBlob(Math.floor(rng() * COLS), 9 + Math.floor(rng() * 5), 6 + Math.floor(rng() * 6), 0.0025 + rng() * 0.004, 0.08 + rng() * 0.06);

  /* ── spirit-light motes ───────────────────────────────────────────────── */
  const motes: Mote[] = [];
  for (let i = 0; i < 9; i++)
    motes.push({
      x: lerp(1, COLS - 1, rng()) * TILE,
      y: lerp(7, 30, rng()) * TILE,
      r: (2 + rng() * 4) * (TILE / 6),
      phase: rng() * Math.PI * 2,
      drift: (rng() - 0.5) * 6,
      rise: 4 + rng() * 8,
    });

  /* ── sky / haze + glows ───────────────────────────────────────────────── */
  const skyStops: [number, string][] = [
    [0.0, "#2b333b"],
    [0.16, "#39434a"],
    [0.34, "#565c5b"],
    [0.52, "#7b756a"],
    [0.72, "#9a8b76"],
    [1.0, "#b09a80"],
  ];
  const glows = [
    { x: 10 * TILE, y: 6 * TILE, r: 10 * TILE, color: "rgba(224,236,244,0.34)" },
    { x: 10 * TILE, y: 23 * TILE, r: 15 * TILE, color: "rgba(255,197,142,0.4)" },
    { x: 10 * TILE, y: 30 * TILE, r: 20 * TILE, color: "rgba(255,186,132,0.2)" },
  ];

  return { cells, water, mist, motes, skyStops, glows, mistBand: [2, 8, 17] };
}
