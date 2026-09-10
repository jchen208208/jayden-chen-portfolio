/**
 * piece4, rebuilt as Minecraft blocks: the end of the descent. Warm hazy light
 * and the feet of the jungle trunks up top (continuing piece3), a bright mossy
 * shrub band with little flowers curving like a bowl, then the ground opens in
 * cross-section — two big moss-topped root systems flare from the trunks and
 * plunge down past a dark earthy pit into progressively deeper, darker soil
 * threaded with fine roots and embedded stones, down to a near-black floor.
 *
 * Pure + deterministic. 21 columns (matches the scenes above). Grid [row][col];
 * null = haze/background behind.
 */

import type { TexKey } from "./textures";
import type { Cell } from "./scene";

export const COLS = 21;
export const ROWS = 38;

export type GodRay = { x: number; w: number; alpha: number; phase: number };
export type Mote = { x: number; y: number; r: number; phase: number; drift: number; rise: number };
export type FallLeaf = { x: number; y: number; sway: number; fall: number; phase: number; color: string };

export type Scene4 = {
  cells: (Cell | null)[][];
  skyStops: [number, string][];
  glows: { x: number; y: number; r: number; color: string }[];
  godrays: GodRay[];
  motes: Mote[];
  leaves: FallLeaf[];
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

export function buildScene4(seed = 0x40075): Scene4 {
  const rng = mulberry32(seed);
  const cells: (Cell | null)[][] = Array.from({ length: ROWS }, () =>
    Array<Cell | null>(COLS).fill(null),
  );
  const set = (r: number, c: number, cell: Cell) => {
    if (r >= 0 && r < ROWS && c >= 0 && c < COLS) cells[r][c] = cell;
  };
  const at = (r: number, c: number) =>
    r >= 0 && r < ROWS && c >= 0 && c < COLS ? cells[r][c] : null;

  // ground surface: a shallow bowl — higher at the edges, dipping centre
  const bowl = (c: number) => 8 + Math.round(4.5 * (1 - ((c - 10) / 10) ** 2));
  const S: number[] = [];
  for (let c = 0; c < COLS; c++) S[c] = bowl(c) + (c % 5 === 2 ? 1 : 0);

  /* ── trunk feet (continue piece3) ─────────────────────────────────────── */
  for (const [x, w, log] of [
    [0, 2, "jungle_log"],
    [7, 2, "jungle_log"],
    [13, 2, "oak_log"],
    [18, 2, "jungle_log"],
  ] as const) {
    const foot = S[Math.min(COLS - 1, x + 1)] - 2;
    for (let c = x; c < x + w; c++)
      for (let r = 0; r < foot; r++) {
        const t = r / Math.max(1, foot);
        set(r, c, {
          base: log,
          dark: clamp(0.04 + t * 0.14 + rng() * 0.03, 0, 0.28),
          warm: clamp(0.28 - t * 0.22, 0, 0.3),
          bright: r < 3 ? 0.14 : 0,
        });
      }
  }

  /* ── solid earth below the surface ───────────────────────────────────── */
  const DIRT_TOP: TexKey[] = ["podzol_side", "rooted_dirt", "coarse_dirt", "dirt"];
  const DIRT_MID: TexKey[] = ["dirt", "coarse_dirt", "dirt", "rooted_dirt"];
  for (let c = 0; c < COLS; c++)
    for (let r = S[c] + 1; r < ROWS; r++) {
      const depth = r - S[c];
      const pit = Math.max(0, 1 - Math.abs(c - 10) / 7) * clamp((r - 15) / 10, 0, 1);
      const base: TexKey =
        depth <= 2
          ? choose(rng, DIRT_TOP)
          : r > 27
            ? rng() < 0.55
              ? "deepslate"
              : "dirt"
            : choose(rng, DIRT_MID);
      set(r, c, {
        base,
        dark: clamp(0.16 + depth * 0.05 + pit * 0.4 + rng() * 0.04, 0, 0.8),
        warm: depth <= 1 ? 0.08 : 0,
      });
    }
  // embedded pebbles
  for (let i = 0; i < 13; i++) {
    const r = Math.floor(lerp(18, ROWS - 3, rng()));
    const c = Math.floor(rng() * COLS);
    const cell = at(r, c);
    if (cell) cell.base = choose(rng, ["stone", "cobblestone", "gravel", "tuff"]);
  }
  // the near-black floor at the very bottom
  for (let r = ROWS - 3; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      set(r, c, { base: "deepslate", dark: clamp(0.55 + (r - (ROWS - 3)) * 0.08, 0, 0.8) });

  /* ── grass surface + moss (a single sunlit lip) ──────────────────────── */
  for (let c = 0; c < COLS; c++) {
    set(S[c], c, {
      base: rng() < 0.4 ? "moss_block" : rng() < 0.5 ? "grass_block_top" : "podzol_top",
      warm: 0.16,
      bright: 0.08,
    });
  }

  /* ── shrub band — foliage + little flowers, sitting on the surface ────── */
  const SHRUB: TexKey[] = ["oak_leaves", "jungle_leaves", "azalea_leaves"];
  for (let c = 0; c < COLS; c++) {
    const h = 3 + Math.floor(rng() * 3);
    for (let d = 1; d <= h; d++) {
      const r = S[c] - d;
      if (rng() < 0.16) continue; // ragged
      const crest = d === h;
      set(r, c, {
        base: rng() < 0.14 ? "flowering_azalea_leaves" : choose(rng, SHRUB),
        warm: crest ? 0.22 : 0.06,
        bright: crest ? 0.12 : 0,
        dark: clamp((h - d) * 0.06 + rng() * 0.03, 0, 0.32),
      });
    }
  }
  // poppies + sprouts dotted along the sunlit floor
  for (let i = 0; i < 10; i++) {
    const c = Math.floor(lerp(3, COLS - 3, rng()));
    set(S[c] - 1, c, { base: rng() < 0.5 ? "poppy" : "fern", warm: 0.16 });
  }
  // a big fern spray, lower left (as in the painting)
  for (let dc = -2; dc <= 3; dc++)
    for (let dr = -4; dr <= 1; dr++) {
      if (Math.hypot(dc / 3, dr / 3.5) > 1 + rng() * 0.2) continue;
      set(S[2] - 3 + dr, 3 + dc, {
        base: dr < -1 ? "large_fern_top" : rng() < 0.6 ? "fern" : "large_fern_bottom",
        warm: 0.14,
      });
    }

  /* ── root systems flaring from the trunks ────────────────────────────── */
  const bez = (
    p0: [number, number],
    p1: [number, number],
    p2: [number, number],
    t: number,
  ): [number, number] => [
    (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0],
    (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1],
  ];
  const root = (
    p0: [number, number],
    p1: [number, number],
    p2: [number, number],
    thick: number,
    moss: boolean,
  ) => {
    const N = 44;
    for (let i = 0; i <= N; i++) {
      const [x, y] = bez(p0, p1, p2, i / N);
      const cx = Math.round(x);
      const cy = Math.round(y);
      const rad = Math.max(0, thick * (1 - (i / N) * 0.6) - 0.4);
      for (let dc = -Math.ceil(rad); dc <= Math.ceil(rad); dc++)
        for (let dr = -Math.ceil(rad); dr <= Math.ceil(rad); dr++) {
          const dd = Math.hypot(dc, dr);
          if (dd > rad + 0.35) continue;
          const rim = dd > rad - 1;
          set(cy + dr, cx + dc, {
            base: rim && rng() < 0.18 ? "mangrove_roots_side" : "oak_log",
            dark: clamp(0.12 + Math.max(0, dr) * 0.08 + rng() * 0.03, 0, 0.52),
            warm: dr < 0 ? 0.14 : 0,
            bright: dr < 0 && rng() < 0.35 ? 0.1 : 0,
          });
        }
      if (moss && rad >= 1 && rng() < 0.6)
        set(cy - Math.ceil(rad) - 1, cx, { base: "moss_block", warm: 0.16, bright: 0.08 });
      // fine tendrils trailing off, deeper down
      if (i > N * 0.4 && rng() < 0.22) {
        const len = 2 + Math.floor(rng() * 5);
        for (let r = cy + 1; r < cy + 1 + len && r < ROWS; r++) {
          const cell = at(r, cx);
          if (cell && cell.base !== "oak_log" && cell.base !== "mangrove_roots_side")
            cell.overlay = "hanging_roots";
        }
      }
    }
  };
  // left system — one bold flare curving to the pit + one plunging the edge
  root([2, 9], [3, 16], [10, 21], 3.2, true);
  root([1, 11], [0, 21], [4, 32], 2, true);
  // right system (mirror)
  root([18, 9], [17, 16], [10, 21], 3.2, true);
  root([19, 11], [20, 21], [16, 32], 2, true);

  /* ── background, glows, rays, motes, leaves ──────────────────────────── */
  const skyStops: [number, string][] = [
    [0.0, "#f1cda2"],
    [0.16, "#e7bd9c"],
    [0.32, "#c69784"],
    [0.48, "#9a6c66"],
    [0.64, "#66474a"],
    [0.82, "#3c2e32"],
    [1.0, "#281f24"],
  ];
  const glows = [
    { x: 10 * TILE, y: 2 * TILE, r: 14 * TILE, color: "rgba(255,232,190,0.45)" },
    { x: 10 * TILE, y: 11 * TILE, r: 13 * TILE, color: "rgba(255,214,160,0.22)" },
  ];
  const godrays: GodRay[] = [
    { x: 8, w: 3, alpha: 0.11, phase: 0 },
    { x: 12, w: 4, alpha: 0.14, phase: 1.7 },
    { x: 16, w: 2.6, alpha: 0.09, phase: 3.3 },
  ];

  const motes: Mote[] = [];
  for (let i = 0; i < 15; i++) {
    const y = lerp(1, 15, rng());
    motes.push({
      x: lerp(1, COLS - 1, rng()) * TILE,
      y: y * TILE,
      r: (1.6 + rng() * 3) * (TILE / 6),
      phase: rng() * Math.PI * 2,
      drift: (rng() - 0.5) * 6,
      rise: 3 + rng() * 6,
    });
  }

  const leaves: FallLeaf[] = [];
  for (let i = 0; i < 3; i++)
    leaves.push({
      x: lerp(4, COLS - 4, rng()) * TILE,
      y: lerp(2, 12, rng()) * TILE,
      sway: 6 + rng() * 7,
      fall: 4 + rng() * 5,
      phase: rng() * Math.PI * 2,
      color: rng() < 0.5 ? "rgba(150,150,86,0.85)" : "rgba(198,120,96,0.85)",
    });

  return { cells, skyStops, glows, godrays, motes, leaves };
}
