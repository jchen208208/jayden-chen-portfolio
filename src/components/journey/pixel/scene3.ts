/**
 * piece3, rebuilt as Minecraft blocks: the warm jungle interior. A dark canopy
 * underside up top (continuing piece2), then tall log trunks receding into a
 * bright amber haze, a couple of thick moss-laden branches crossing the frame
 * (the central one is the "Experience sign-branch" spot) hung with vines,
 * hanging roots and fern sprays, diagonal god-rays from the upper right and a
 * dense drift of golden spirit-motes.
 *
 * Pure + deterministic. 21 columns (matches piece1/piece2 so trunks/seam line
 * up). Grid [row][col]; null = haze behind.
 */

import type { TexKey } from "./textures";
import type { Cell } from "./scene";

export const COLS = 21;
export const ROWS = 38;

export type GodRay = { x: number; w: number; alpha: number; phase: number };
export type Mote = {
  x: number;
  y: number;
  r: number;
  phase: number;
  drift: number;
  rise: number;
};
export type FallLeaf = { x: number; y: number; sway: number; fall: number; phase: number; color: string };

export type Scene3 = {
  cells: (Cell | null)[][];
  skyStops: [number, string][];
  glows: { x: number; y: number; r: number; color: string }[];
  godrays: GodRay[];
  motes: Mote[];
  leaves: FallLeaf[];
  /** [topRow, botRow] of the warm haze wash that dissolves the trunk feet */
  hazeBand: [number, number];
};

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
function choose<T>(rng: () => number, a: T[]): T {
  return a[Math.floor(rng() * a.length)];
}

const TILE = 16;

export function buildScene3(seed = 0x3caf): Scene3 {
  const rng = mulberry32(seed);
  const cells: (Cell | null)[][] = Array.from({ length: ROWS }, () =>
    Array<Cell | null>(COLS).fill(null),
  );
  const set = (r: number, c: number, cell: Cell) => {
    if (r >= 0 && r < ROWS && c >= 0 && c < COLS) cells[r][c] = cell;
  };
  const at = (r: number, c: number) =>
    r >= 0 && r < ROWS && c >= 0 && c < COLS ? cells[r][c] : null;

  /* ── canopy underside (continues piece2's bottom canopy) ───────────────── */
  const CANOPY: TexKey[] = ["jungle_leaves", "dark_oak_leaves", "oak_leaves"];
  for (let c = 0; c < COLS; c++) {
    const edge = 3 + Math.round(1.6 * Math.sin(c * 0.8) + (rng() - 0.5) * 1.6);
    for (let r = 0; r < edge; r++)
      set(r, c, {
        base: choose(rng, CANOPY),
        dark: clamp(0.42 - r * 0.05 + rng() * 0.04, 0.16, 0.44),
        warm: r === edge - 1 ? 0.08 : 0,
      });
  }
  // a couple of branch stubs poking down out of the canopy
  for (const [c, len] of [
    [3, 3],
    [16, 2],
  ] as const)
    for (let r = 0; r < len + 3; r++) set(r, c, { base: "jungle_log", dark: 0.24 });

  /* ── trunks receding into the haze — few, well-spaced, far ones dissolved ─ */
  // [x, width, top, log, near] — near 1 = sharp/dark, near 0 = lost in haze
  const TRUNKS: [number, number, number, TexKey, number][] = [
    [2, 2, 5, "jungle_log", 0.3],
    [7, 2, 4, "jungle_log", 0.95],
    [13, 3, 4, "jungle_log", 1],
    [18, 2, 5, "oak_log", 0.32],
  ];
  for (const [x, w, top, log, near] of TRUNKS) {
    for (let c = x; c < x + w && c < COLS; c++)
      for (let r = top; r < ROWS; r++) {
        // feet dissolve into the bright haze toward the bottom
        const foot = clamp((r - 22) / 13, 0, 1);
        const rim = c === x || c === x + w - 1;
        // nibble the odd block off a rim so the trunk isn't a perfect rectangle
        if (rim && rng() < 0.12) continue;
        set(r, c, {
          base: log,
          dark: clamp((rim ? 0.05 : 0.14) * near * (1 - foot) + rng() * 0.03, 0, 0.3),
          warm: clamp(0.05 + foot * 0.55 + (1 - near) * 0.2 + (rim ? 0.16 : 0), 0, 0.7),
          bright: (foot > 0.35 ? foot * 0.45 : 0) + (rim ? 0.1 : 0),
        });
      }
  }

  /* ── mossy branches (the hero) ────────────────────────────────────────── */
  const branch = (
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    thick: number,
    moss: number,
    ferny: number,
    drape: number,
  ) => {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 3;
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const cx = Math.round(lerp(x0, x1, t));
      const cy = Math.round(lerp(y0, y1, t));
      for (let d = 0; d < thick; d++)
        set(cy + d, cx, {
          base: "jungle_log",
          dark: clamp(d * 0.12 + rng() * 0.03, 0, 0.42),
          warm: d === 0 ? 0.12 : 0,
        });
      if (rng() < moss)
        set(cy - 1, cx, { base: "moss_block", warm: 0.18, bright: 0.08 });
      if (rng() < ferny) {
        set(cy - 1, cx, { base: rng() < 0.5 ? "fern" : "large_fern_bottom", warm: 0.1 });
        if (rng() < 0.55) set(cy - 2, cx, { base: "large_fern_top", warm: 0.1 });
      } else if (rng() < 0.14) {
        set(cy - 1, cx, {
          base: rng() < 0.5 ? "azalea_leaves" : "flowering_azalea_leaves",
        });
      }
      if (rng() < drape) {
        const len = 3 + Math.floor(rng() * 6);
        const kind: TexKey = rng() < 0.5 ? "vine" : "hanging_roots";
        for (let r = cy + thick; r < cy + thick + len && r < ROWS; r++) {
          const cell = at(r, cx);
          if (cell && cell.base !== "vine" && cell.base !== "hanging_roots")
            cell.overlay = kind;
          else set(r, cx, { base: kind, warm: r < cy + thick + 3 ? 0.1 : 0 });
        }
      }
    }
  };
  branch(-1, 9, 15, 6, 2, 0.55, 0.35, 0.18); // upper bough
  branch(1, 20, 20, 14, 3, 0.85, 0.55, 0.24); // central "sign branch" — the hero

  /* ── faint mid-ground foliage so the haze gaps aren't hard rectangles ─── */
  for (let i = 0; i < 34; i++) {
    const r = Math.floor(lerp(5, 26, rng()));
    const c = Math.floor(rng() * COLS);
    if (at(r, c)) continue;
    const near = clamp((r - 5) / 21, 0, 1);
    set(r, c, {
      base: choose(rng, ["jungle_leaves", "fern", "large_fern_bottom", "oak_leaves"]),
      warm: 0.16 + near * 0.24,
      dark: 0.02,
      bright: 0.06,
    });
  }

  /* ── prominent fern spray, lower left (as in the painting) ────────────── */
  for (let dc = -3; dc <= 3; dc++)
    for (let dr = -3; dr <= 2; dr++) {
      if (Math.hypot(dc / 3, dr / 3) > 1 + rng() * 0.2) continue;
      set(18 + dr, 3 + dc, {
        base:
          dr < -1
            ? "large_fern_top"
            : rng() < 0.6
              ? "fern"
              : "large_fern_bottom",
        warm: 0.12,
        dark: dr > 0 ? 0.14 : 0,
      });
    }

  /* ── warm background + glows ──────────────────────────────────────────── */
  const skyStops: [number, string][] = [
    [0.0, "#7c6f66"],
    [0.12, "#a98873"],
    [0.28, "#d7a884"],
    [0.46, "#f0c79a"],
    [0.62, "#f4cfa2"],
    [0.8, "#f0cda4"],
    [1.0, "#ecccaa"],
  ];
  const glows = [
    { x: 17 * TILE, y: 7 * TILE, r: 15 * TILE, color: "rgba(255,232,186,0.5)" },
    { x: 10 * TILE, y: 18 * TILE, r: 16 * TILE, color: "rgba(255,214,158,0.3)" },
    { x: 10 * TILE, y: 34 * TILE, r: 20 * TILE, color: "rgba(255,224,180,0.34)" },
  ];

  /* ── god-rays from the upper right ───────────────────────────────────── */
  const godrays: GodRay[] = [
    { x: 9, w: 2.2, alpha: 0.09, phase: 0.6 },
    { x: 13, w: 3, alpha: 0.14, phase: 0 },
    { x: 16, w: 4, alpha: 0.18, phase: 1.3 },
    { x: 20, w: 2.8, alpha: 0.12, phase: 2.6 },
    { x: 24, w: 4.4, alpha: 0.16, phase: 4.1 },
  ];

  /* ── spirit-motes — dense, biased toward the ray path ────────────────── */
  const motes: Mote[] = [];
  for (let i = 0; i < 26; i++) {
    const alongRay = rng() < 0.6;
    const y = lerp(4, ROWS - 3, rng());
    const x = alongRay
      ? clamp(lerp(15, 22, rng()) - y * 0.42 + (rng() - 0.5) * 3, 0.5, COLS - 0.5)
      : lerp(1, COLS - 1, rng());
    motes.push({
      x: x * TILE,
      y: y * TILE,
      r: (1.6 + rng() * 3.6) * (TILE / 6),
      phase: rng() * Math.PI * 2,
      drift: (rng() - 0.5) * 7,
      rise: 3 + rng() * 7,
    });
  }

  /* ── a few drifting leaves ───────────────────────────────────────────── */
  const leaves: FallLeaf[] = [];
  for (let i = 0; i < 4; i++)
    leaves.push({
      x: lerp(3, COLS - 3, rng()) * TILE,
      y: lerp(8, 26, rng()) * TILE,
      sway: 6 + rng() * 8,
      fall: 5 + rng() * 6,
      phase: rng() * Math.PI * 2,
      color: rng() < 0.5 ? "rgba(150,150,86,0.85)" : "rgba(196,150,96,0.85)",
    });

  return {
    cells,
    skyStops,
    glows,
    godrays,
    motes,
    leaves,
    hazeBand: [24, 38],
  };
}
