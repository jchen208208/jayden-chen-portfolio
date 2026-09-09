/**
 * piece1, rebuilt as a hand-placed Minecraft-block scene: sunset sky with
 * blocky clouds, two clifftop trees (drooping "willow" of azalea + vines on the
 * left, a broad oak on the right), a centre waterfall between mossy cliff walls,
 * two jutting scenery ledges, and a plunge pool with drifting spray.
 *
 * This module is pure + deterministic (seeded PRNG) — it returns a grid the
 * <canvas> renderer in PixelScene.tsx blits. Grid is [row][col]; a null cell
 * shows the sky/void behind.
 *
 * The grid is deliberately coarse (21 x 40) so each block reads large on screen.
 */

import type { TexKey } from "./textures";

export const COLS = 21;
export const ROWS = 40;

export type Cell = {
  base: TexKey;
  /** drawn on top of `base` (vines on rock) */
  overlay?: TexKey;
  /** 0..1 — darken (recessed rock channel, under-ledge shadow) */
  dark?: number;
  /** 0..1 — lighten (waterfall highlight seam) */
  bright?: number;
  /** 0..1 — warm sunset rim wash (lit canopy tops) */
  warm?: number;
};

export type WaterCell = { c: number; r: number; bright: number };
export type Spray = { x: number; y: number; s: number; phase: number; rate: number };
export type CloudBlock = { x: number; y: number };
export type Cloud = { blocks: CloudBlock[]; color: string; drift: number };

export type Scene = {
  cells: (Cell | null)[][];
  water: WaterCell[];
  spray: Spray[];
  clouds: Cloud[];
  /** vertical sunset gradient: [offset 0..1, css color] */
  skyStops: [number, string][];
  glows: { x: number; y: number; r: number; color: string }[];
  /** [col, row, widthCols, heightRows] crown bounds — re-blitted over clouds */
  treeBoxes: [number, number, number, number][];
  /** px y — clouds are clipped above this (never over terrain) */
  cloudFloorPx: number;
};

/* ── seeded PRNG (mulberry32) ─────────────────────────────────────────────── */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, table: [T, number][]): T {
  let x = rng() * table.reduce((s, [, w]) => s + w, 0);
  for (const [v, w] of table) if ((x -= w) <= 0) return v;
  return table[table.length - 1][0];
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/* ── layout constants (grid units) ───────────────────────────────────────── */
const TILE = 16;
const LEFT_SURF = 14; // left plateau grass row
const RIGHT_SURF = 13; // right plateau grass row (a touch higher, as in piece1)
const LGE = 7; // left grass edge col (notch opens right of here)
const RGE = 13; // right grass edge col
const WATER_L = 8;
const WATER_R = 11;
const WATER_TOP = 14;
export const POOL_TOP = 37;

/** rightmost solid col of the LEFT cliff at row r (irregular, V-flared lip) */
function leftWallX(r: number, jag: number[]): number {
  const flare = r < RIGHT_SURF + 3 ? Math.round(lerp(1.6, 0, (r - RIGHT_SURF) / 3)) : 0;
  return clamp(WATER_L - 1 - flare + jag[r % jag.length], 4, WATER_L - 1);
}
/** leftmost solid col of the RIGHT cliff at row r */
function rightWallX(r: number, jag: number[]): number {
  const flare = r < RIGHT_SURF + 3 ? Math.round(lerp(1.6, 0, (r - RIGHT_SURF) / 3)) : 0;
  return clamp(WATER_R + 1 + flare - jag[(r + 3) % jag.length], WATER_R + 1, 16);
}

const CLIFF_BLOCKS: [TexKey, number][] = [
  ["stone", 0.5],
  ["cobblestone", 0.22],
  ["mossy_cobblestone", 0.11],
  ["gravel", 0.06],
  ["stone_bricks", 0.05],
  ["mossy_stone_bricks", 0.06],
];

export function buildScene(seed = 0xba5e1): Scene {
  const rng = mulberry32(seed);
  const cells: (Cell | null)[][] = Array.from({ length: ROWS }, () =>
    Array<Cell | null>(COLS).fill(null),
  );
  const set = (r: number, c: number, cell: Cell) => {
    if (r >= 0 && r < ROWS && c >= 0 && c < COLS) cells[r][c] = cell;
  };
  const at = (r: number, c: number) =>
    r >= 0 && r < ROWS && c >= 0 && c < COLS ? cells[r][c] : null;

  // small per-row jag pattern for the cliff walls
  const jag = Array.from({ length: 11 }, () => (rng() < 0.62 ? 0 : 1));

  /* ── clifftops: grass shelf + dirt ─────────────────────────────────────── */
  const surfaceAt = (c: number) =>
    c <= LGE ? LEFT_SURF : c >= RGE ? RIGHT_SURF : -1;

  for (let c = 0; c < COLS; c++) {
    const s = surfaceAt(c);
    if (s < 0) continue;
    set(s, c, { base: "grass_block_top", bright: 0.06 });
    set(s + 1, c, { base: "grass_block_side" });
    set(s + 2, c, { base: "dirt" });
    set(s + 3, c, { base: rng() < 0.45 ? "dirt" : "stone" });
  }

  /* ── notch lip: the V walls between grass edge and the falls ───────────── */
  for (let r = RIGHT_SURF; r < WATER_TOP + 2; r++) {
    const lw = leftWallX(r, jag);
    const rw = rightWallX(r, jag);
    for (let c = LGE + 1; c <= lw; c++)
      set(r, c, { base: pick(rng, CLIFF_BLOCKS), dark: c > lw - 1 ? 0.16 : 0 });
    for (let c = rw; c < RGE; c++)
      set(r, c, { base: pick(rng, CLIFF_BLOCKS), dark: c < rw + 1 ? 0.16 : 0 });
  }
  // mossy caps on the lip edges
  for (let c = LGE - 1; c <= LGE + 1; c++) set(LEFT_SURF, c, { base: "mossy_cobblestone" });
  for (let c = RGE - 1; c <= RGE; c++) set(RIGHT_SURF, c, { base: "mossy_cobblestone" });

  /* ── cliff faces ──────────────────────────────────────────────────────── */
  for (let r = RIGHT_SURF + 2; r < POOL_TOP; r++) {
    const lw = leftWallX(r, jag);
    const rw = rightWallX(r, jag);
    for (let c = 0; c < COLS; c++) {
      const inLeft = c <= lw;
      const inRight = c >= rw;
      if (!inLeft && !inRight) continue;
      if (at(r, c)) continue; // keep the grass shelf
      const edge = (inLeft && c >= lw) || (inRight && c <= rw);
      set(r, c, { base: pick(rng, CLIFF_BLOCKS), dark: edge ? 0.22 : 0 });
    }
  }

  /* moss clusters — a few seeds bleeding into neighbours */
  for (let n = 0; n < 6; n++) {
    const left = rng() < 0.5;
    const cr = Math.floor(lerp(RIGHT_SURF + 3, POOL_TOP - 3, rng()));
    const cc = left
      ? Math.floor(lerp(0, WATER_L - 2, rng()))
      : Math.floor(lerp(WATER_R + 2, COLS - 1, rng()));
    const rad = 1 + Math.floor(rng() * 2);
    for (let dr = -rad; dr <= rad; dr++)
      for (let dc = -rad; dc <= rad; dc++) {
        const d = Math.hypot(dr, dc);
        if (d > rad + 0.5) continue;
        const cell = at(cr + dr, cc + dc);
        if (!cell || cell.base === "grass_block_top" || cell.base === "grass_block_side")
          continue;
        if (rng() < 1 - d / (rad + 1))
          cell.base = d < 1.1 && rng() < 0.55 ? "moss_block" : "mossy_cobblestone";
      }
  }

  /* vertical fracture lines — subtle darkening */
  for (let n = 0; n < 6; n++) {
    const left = rng() < 0.5;
    const c = left
      ? Math.floor(lerp(1, WATER_L - 2, rng()))
      : Math.floor(lerp(WATER_R + 2, COLS - 2, rng()));
    const r0 = Math.floor(lerp(RIGHT_SURF + 3, POOL_TOP - 5, rng()));
    const len = 2 + Math.floor(rng() * 5);
    for (let r = r0; r < r0 + len; r++) {
      const cell = at(r, c);
      if (cell) cell.dark = Math.max(cell.dark ?? 0, 0.14);
    }
  }

  /* hanging vines on the faces */
  const vineRun = (c: number, r0: number, len: number, throughAir = false) => {
    for (let r = r0; r < r0 + len; r++) {
      const cell = at(r, c);
      if (cell) {
        if (cell.base === "vine") break;
        cell.overlay = "vine";
      } else if (throughAir || r === r0) {
        set(r, c, { base: "vine" }); // vine dangling in open air
      } else break;
    }
  };
  for (let n = 0; n < 11; n++) {
    const left = rng() < 0.5;
    const c = left
      ? Math.floor(lerp(1, WATER_L - 1, rng()))
      : Math.floor(lerp(WATER_R + 1, COLS - 1, rng()));
    const r0 = Math.floor(lerp(RIGHT_SURF + 2, POOL_TOP - 4, rng()));
    vineRun(c, r0, 1 + Math.floor(rng() * 3));
  }

  /* ── scenery ledges (jut inward from each wall; stop short of the water) ── */
  const ledge = (
    x0: number,
    x1: number,
    top: number,
    thick: number,
    tipLeft: boolean,
  ) => {
    const span = x1 - x0;
    for (let c = x0; c <= x1; c++) {
      const t = (tipLeft ? c - x0 : x1 - c) / span; // 0 at tip → 1 at root
      const h = Math.max(1, Math.round(1 + (thick - 1) * t));
      for (let r = top; r < top + h; r++)
        set(r, c, {
          base:
            r === top ? "mossy_cobblestone" : rng() < 0.5 ? "cobblestone" : "stone",
          bright: r === top ? 0.16 : 0.05,
        });
      for (let s = 0; s < 2; s++) {
        const sh = at(top + h + s, c);
        if (sh) sh.dark = Math.max(sh.dark ?? 0, 0.34 - s * 0.15);
      }
    }
    const tipC = tipLeft ? x0 : x1;
    for (let r = top; r < top + 3; r++) {
      const sh = at(r, tipC + (tipLeft ? -1 : 1));
      if (sh) sh.dark = Math.max(sh.dark ?? 0, 0.22);
    }
    for (let k = 0; k < 2; k++) {
      const c = Math.floor(lerp(x0 + span * 0.15, x0 + span * 0.75, rng()));
      const tt = (tipLeft ? c - x0 : x1 - c) / span;
      vineRun(c, top + Math.max(1, Math.round(1 + (thick - 1) * tt)), 1 + Math.floor(rng() * 2));
    }
  };
  ledge(2, 7, 22, 3, false); // left: root at col 2, tip at col 7
  ledge(13, 18, 18, 3, true); // right: tip at col 13, root at col 18

  /* ── waterfall ────────────────────────────────────────────────────────── */
  const water: WaterCell[] = [];
  for (let r = WATER_TOP; r < POOL_TOP + 2; r++) {
    for (let c = WATER_L; c <= WATER_R; c++) {
      cells[r][c] = null; // water is drawn as its own animated layer
      const mid = c === 9 || c === 10;
      const crestFoam = r < WATER_TOP + 2 ? 0.28 : 0;
      const streak = mid ? 0.2 : 0.06;
      water.push({
        c,
        r,
        bright: Math.min(0.5, streak * (0.7 + 0.6 * rng()) + crestFoam),
      });
    }
  }

  /* ── plunge pool ──────────────────────────────────────────────────────── */
  for (let r = POOL_TOP; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      cells[r][c] = null;
      water.push({ c, r, bright: 0 });
    }

  /* ── spray (drifting particles at the pool) ───────────────────────────── */
  const spray: Spray[] = [];
  for (let n = 0; n < 44; n++) {
    const cx = lerp(WATER_L - 2, WATER_R + 2, rng()) * TILE;
    spray.push({
      x: cx + (rng() - 0.5) * 22,
      y: lerp(POOL_TOP - 3, ROWS - 1, rng()) * TILE,
      s: 2 + Math.floor(rng() * 3) * 2,
      phase: rng() * Math.PI * 2,
      rate: 0.6 + rng() * 1.6,
    });
  }

  /* ── trees ────────────────────────────────────────────────────────────── */
  /** stamp an elliptical leaf crown with sun-side highlight + shaded belly */
  const crown = (
    cc: number,
    cr: number,
    rx: number,
    ry: number,
    leaf: TexKey,
    accent: TexKey,
    accentP: number,
  ) => {
    for (let dr = -ry - 1; dr <= ry + 1; dr++)
      for (let dc = -rx - 1; dc <= rx + 1; dc++) {
        const d = Math.hypot(dc / rx, dr / ry);
        if (d > 1 + rng() * 0.22) continue;
        const lower = dr / ry; // -1 top → +1 bottom
        set(cr + dr, cc + dc, {
          base: rng() < accentP ? accent : leaf,
          dark: lower > 0.1 ? clamp((lower - 0.1) * 0.42 + rng() * 0.08, 0, 0.38) : 0,
          bright: lower < -0.1 && dc < 1 && rng() < 0.45 ? 0.1 : 0,
        });
      }
  };
  const treeBoxes: [number, number, number, number][] = [];

  // LEFT — drooping "willow": azalea crown, trunk, trailing vine strands
  {
    const baseR = LEFT_SURF;
    const tc = 3;
    for (let r = baseR; r >= baseR - 5; r--) set(r, tc, { base: "oak_log" });
    // roots gripping the lip
    set(baseR, tc - 1, { base: "oak_log", dark: 0.16 });
    set(baseR, tc + 1, { base: "oak_log", dark: 0.16 });
    set(baseR + 1, tc + 2, { base: "oak_log", dark: 0.3 });
    const cc = tc;
    const cr = baseR - 8;
    crown(cc, cr, 3, 2, "azalea_leaves", "flowering_azalea_leaves", 0.18);
    // trailing willow strands — from the crown belly, draping over the lip
    for (let c = cc - 3; c <= cc + 4; c++) {
      if (rng() < 0.4) continue;
      vineRun(c, cr + 2 + Math.floor(rng() * 2), 3 + Math.floor(rng() * 4), true);
    }
    treeBoxes.push([cc - 4, cr - 3, 9, 15]);
  }
  // RIGHT — broad oak
  {
    const baseR = RIGHT_SURF;
    const tc = 16;
    for (let r = baseR; r >= baseR - 5; r--) {
      set(r, tc, { base: "oak_log" });
      set(r, tc + 1, { base: "oak_log", dark: 0.12 });
    }
    set(baseR - 5, tc - 1, { base: "oak_log" });
    set(baseR - 5, tc + 2, { base: "oak_log" });
    // roots over the lip
    set(baseR, tc - 1, { base: "oak_log", dark: 0.16 });
    set(baseR, tc + 2, { base: "oak_log", dark: 0.16 });
    set(baseR + 1, tc - 2, { base: "oak_log", dark: 0.3 });
    const cc = tc;
    const cr = baseR - 7;
    crown(cc, cr, 4, 3, "oak_leaves", "azalea_leaves", 0.12);
    for (let k = 0; k < 2; k++)
      vineRun(cc - 3 + Math.floor(rng() * 6), cr + 2 + Math.floor(rng() * 2), 1 + Math.floor(rng() * 2));
    treeBoxes.push([cc - 5, cr - 4, 11, 13]);
  }

  /* ── sky ──────────────────────────────────────────────────────────────── */
  const skyStops: [number, string][] = [
    [0.0, "#4a3d7a"],
    [0.18, "#63488f"],
    [0.34, "#8f5391"],
    [0.5, "#c06d84"],
    [0.64, "#e08a67"],
    [0.78, "#f2b06e"],
    [0.9, "#f8cd84"],
    [1.0, "#f9dca0"],
  ];
  const glows = [
    { x: 3 * TILE, y: 13 * TILE, r: 11 * TILE, color: "rgba(255,208,142,0.62)" },
    { x: 10 * TILE, y: 13 * TILE, r: 5 * TILE, color: "rgba(255,150,120,0.24)" },
    { x: 17 * TILE, y: 10 * TILE, r: 6 * TILE, color: "rgba(210,150,188,0.26)" },
  ];

  /* ── blocky clouds — few, puffy, kept above the tree line ──────────────── */
  const clouds: Cloud[] = [];
  // a compact stack of stepped rows — puffy, not a flat shelf
  const puff = (x0: number, y0: number, w: number): CloudBlock[] => {
    const blocks: CloudBlock[] = [];
    const h = 2 + (rng() < 0.5 ? 1 : 0);
    const mid = (h - 1) / 2;
    for (let ry = 0; ry < h; ry++) {
      const t = 1 - Math.abs(ry - mid) / (mid + 0.6);
      const wide = Math.max(2, Math.round(w * (0.5 + 0.5 * t)));
      const off = Math.floor((w - wide) / 2) + (rng() < 0.4 ? 1 : 0);
      for (let rx = 0; rx < wide; rx++) blocks.push({ x: x0 + off + rx, y: y0 + ry });
    }
    if (rng() < 0.55)
      blocks.push({ x: x0 + Math.floor(rng() * Math.max(1, w - 1)), y: y0 - 1 });
    return blocks;
  };
  const bands = [
    { y: 1, speed: 0.005 },
    { y: 4, speed: 0.0085 },
    { y: 7, speed: 0.013 },
  ];
  for (let b = 0; b < bands.length; b++) {
    const count = b === 2 ? 1 : 2;
    for (let i = 0; i < count; i++) {
      const x0 = Math.floor(rng() * COLS);
      const y0 = bands[b].y + Math.floor(rng() * 2);
      const w = 3 + Math.floor(rng() * 3);
      const warmth = clamp(1 - (x0 / COLS) * 0.7 - b * 0.14, 0, 1);
      const color = `rgb(${Math.round(lerp(214, 250, warmth))},${Math.round(
        lerp(196, 208, warmth),
      )},${Math.round(lerp(214, 182, warmth))})`;
      clouds.push({ blocks: puff(x0, y0, w), color, drift: bands[b].speed });
    }
  }

  return {
    cells,
    water,
    spray,
    clouds,
    skyStops,
    glows,
    treeBoxes,
    cloudFloorPx: 6 * TILE,
  };
}
