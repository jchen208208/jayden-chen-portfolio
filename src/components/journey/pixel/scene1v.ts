/**
 * piece1 as a 3D voxel scene: a sunset gorge diorama. Two cliff WALLS with
 * grassy tops and mossy fronts, a willow on the left clifftop and an oak on the
 * right, a bright waterfall set back in the notch between them falling to a
 * plunge pool, two rock outcrops jutting toward the camera, blocky clouds
 * drifting behind. Built block-by-block; the renderer (voxel.ts) draws each
 * block's front + top + right faces, painter-sorted so near blocks overlap far
 * ones — real layered depth.
 */

import type { Cell } from "./scene";
import type { TexKey } from "./textures";
import { DX, DY, F_FRONT, F_RIGHT, F_TOP, T, type Vox } from "./voxel";

export type Cloud = {
  blocks: { x: number; y: number; z: number }[];
  color: string;
  drift: number;
};

export type Piece1Voxels = {
  voxels: Vox[];
  water: Vox[];
  spray: { x: number; y: number; s: number; phase: number; rate: number }[];
  clouds: Cloud[];
  skyStops: [number, string][];
  glows: { x: number; y: number; r: number; color: string }[];
  proj: { mx: number; my: number; wy: number };
  canvasW: number;
  canvasH: number;
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

/* ── world dims ──────────────────────────────────────────────────────────── */
const WY = 48;
const ZB = 10; // cliff depth
const POOL_TOP = 2;
const GAP_L = 8; // left cliff gorge edge (inclusive)
const GAP_R = 13; // right cliff gorge edge (inclusive)
const TOP_L = 30;
const TOP_R = 32;
const RIGHT_X = 19;

/** thin/holey blocks that shouldn't cull the face of a solid block behind */
const SEE_THRU = new Set<TexKey>([
  "vine",
  "fern",
  "large_fern_top",
  "large_fern_bottom",
  "hanging_roots",
  "glow_lichen",
  "poppy",
]);

const ROCK: [TexKey, number][] = [
  ["stone", 0.44],
  ["cobblestone", 0.26],
  ["mossy_cobblestone", 0.17],
  ["gravel", 0.07],
  ["mossy_stone_bricks", 0.06],
];

export function buildPiece1Voxels(seed = 0x1cef): Piece1Voxels {
  const rng = mulberry32(seed);
  const world = new Map<string, Cell>();
  const isWater = new Set<string>();
  const K = (x: number, y: number, z: number) => `${x},${y},${z}`;
  const put = (x: number, y: number, z: number, cell: Cell) => world.set(K(x, y, z), cell);
  const has = (x: number, y: number, z: number) => world.has(K(x, y, z));
  /** does a solid (face-culling) block sit here? */
  const occ = (x: number, y: number, z: number) => {
    const c = world.get(K(x, y, z));
    return !!c && !SEE_THRU.has(c.base);
  };
  const pick = (): TexKey => {
    let r = rng();
    for (const [k, w] of ROCK) if ((r -= w) <= 0) return k;
    return "stone";
  };

  /* ── cliff walls ──────────────────────────────────────────────────────── */
  const cliff = (x0: number, x1: number, topAt: (x: number, z: number) => number) => {
    for (let z = 0; z <= ZB; z++)
      for (let x = x0; x <= x1; x++) {
        const top = topAt(x, z);
        for (let y = 0; y <= top; y++) {
          let base: TexKey;
          if (y === top) base = "grass_block_side";
          else if (y >= top - 2) base = "dirt";
          else base = pick();
          put(x, y, z, { base });
        }
      }
  };
  cliff(0, GAP_L, (x) => {
    const lip = x >= GAP_L - 1 ? 3 : x === GAP_L - 2 ? 1 : 0;
    return clamp(TOP_L - lip + (rng() < 0.12 ? 1 : 0), 5, TOP_L);
  });
  cliff(GAP_R, RIGHT_X, (x) => {
    const lip = x <= GAP_R + 1 ? 3 : x === GAP_R + 2 ? 1 : 0;
    return clamp(TOP_R - lip + (rng() < 0.12 ? 1 : 0), 5, TOP_R);
  });

  /* moss clusters on the exposed faces */
  const faces: [number, number, number][] = [];
  for (const [k] of world) {
    const [x, y, z] = k.split(",").map(Number);
    if (!has(x, y, z - 1) || !has(x + 1, y, z)) faces.push([x, y, z]);
  }
  for (let n = 0; n < 20; n++) {
    const [x, y, z] = faces[Math.floor(rng() * faces.length)];
    const rad = 1 + Math.floor(rng() * 2);
    for (let dx = -rad; dx <= rad; dx++)
      for (let dy = -rad; dy <= rad; dy++)
        for (let dz = -rad; dz <= rad; dz++) {
          const c = world.get(K(x + dx, y + dy, z + dz));
          if (c && (c.base === "stone" || c.base === "cobblestone") && rng() < 0.55)
            c.base = rng() < 0.35 ? "moss_block" : "mossy_cobblestone";
        }
  }

  /* hanging vines — as an overlay on the cliff front face (flush to the wall),
     dropping into open air past the bottom of the cliff */
  for (let n = 0; n < 11; n++) {
    const left = rng() < 0.5;
    const x = left
      ? 1 + Math.floor(rng() * (GAP_L - 1))
      : GAP_R + 1 + Math.floor(rng() * (RIGHT_X - GAP_R));
    let y = (left ? TOP_L : TOP_R) - 1;
    while (y > 4 && !has(x, y, 0)) y--;
    const len = 4 + Math.floor(rng() * 6);
    for (let k = 0; k < len; k++) {
      const c = world.get(K(x, y - k, 0));
      if (c) c.overlay = "vine";
      else put(x, y - k, 0, { base: "vine" });
    }
  }

  /* ── notch lip — a little rock V between the grass and the falls ──────── */
  for (let z = 0; z <= 5; z++) {
    for (let y = TOP_L - 3; y <= TOP_L - 1; y++) put(GAP_L, y, z, { base: pick(), dark: 0.12 });
    for (let y = TOP_R - 3; y <= TOP_R - 1; y++) put(GAP_R, y, z, { base: pick(), dark: 0.12 });
  }

  /* ── waterfall ────────────────────────────────────────────────────────── */
  const water: Vox[] = [];
  const [WL, WR, WZ0, WZ1, WTOP] = [9, 12, 4, 7, TOP_L - 4];
  for (let z = WZ0; z <= WZ1; z++)
    for (let x = WL; x <= WR; x++)
      for (let y = POOL_TOP; y <= WTOP; y++) {
        put(x, y, z, {
          base: "water_still",
          bright: y > WTOP - 3 ? 0.32 : x === 10 || x === 11 ? 0.16 : 0,
        });
        isWater.add(K(x, y, z));
      }
  // foam crest where the water rolls over the lip
  for (let z = WZ0; z <= WZ1; z++)
    for (let x = WL; x <= WR; x++)
      if (rng() < 0.7) put(x, WTOP + 1, z, { base: "snow", bright: 0.1 });

  /* ── plunge pool ──────────────────────────────────────────────────────── */
  for (let z = 0; z <= ZB; z++)
    for (let x = 1; x <= RIGHT_X + 1; x++)
      for (let y = 0; y <= POOL_TOP; y++) {
        put(x, y, z, { base: "water_still" });
        isWater.add(K(x, y, z));
      }

  /* ── trees ────────────────────────────────────────────────────────────── */
  const trunk = (bx: number, bz: number, topY: number, h: number) => {
    for (let y = topY; y < topY + h; y++)
      for (let dx = 0; dx <= 1; dx++)
        for (let dz = 0; dz <= 1; dz++)
          put(bx + dx, y, bz + dz, { base: "oak_log", dark: dx + dz > 1 ? 0.12 : 0 });
  };
  const crown = (
    cx: number,
    cy: number,
    cz: number,
    rx: number,
    ry: number,
    rz: number,
    leaf: TexKey,
    accent: TexKey,
    accentP: number,
  ) => {
    for (let dx = -rx; dx <= rx; dx++)
      for (let dy = -ry; dy <= ry; dy++)
        for (let dz = -rz; dz <= rz; dz++) {
          const d = (dx / rx) ** 2 + (dy / ry) ** 2 + (dz / rz) ** 2;
          if (d > 1 + (rng() - 0.4) * 0.35) continue;
          put(cx + dx, cy + dy, cz + dz, {
            base: rng() < accentP ? accent : leaf,
            warm: dy > 0 ? 0 : 0.14,
            dark: dy < -ry * 0.3 ? 0.2 : 0,
          });
        }
  };
  // willow (left)
  trunk(3, 5, TOP_L, 5);
  crown(4, TOP_L + 6, 5, 3, 3, 3, "azalea_leaves", "flowering_azalea_leaves", 0.14);
  for (let n = 0; n < 14; n++) {
    const x = 1 + Math.floor(rng() * 7);
    const z = 3 + Math.floor(rng() * 5);
    let y = TOP_L + 5;
    while (y > TOP_L - 4 && !has(x, y, z)) y--; // find the crown/ground underside
    for (let k = 1; k <= 3 + Math.floor(rng() * 5); k++)
      if (!has(x, y - k, z)) put(x, y - k, z, { base: "vine" });
  }
  // oak (right)
  trunk(15, 4, TOP_R, 6);
  put(14, TOP_R + 4, 4, { base: "oak_log" });
  put(17, TOP_R + 4, 6, { base: "oak_log" });
  crown(16, TOP_R + 8, 5, 4, 4, 4, "oak_leaves", "azalea_leaves", 0.1);

  /* ── outcrops jutting toward the camera (z < 0) ───────────────────────── */
  const outcrop = (x0: number, x1: number, y0: number, thick: number, zTip: number) => {
    const span = Math.max(1, x1 - x0);
    for (let x = x0; x <= x1; x++) {
      const t = (x - x0) / span;
      const reach = Math.round(zTip * (1 - Math.abs(t - 0.5) * 2));
      for (let z = 0; z >= reach; z--)
        for (let y = y0; y < y0 + thick; y++)
          put(x, y, z, {
            base:
              y === y0 + thick - 1
                ? rng() < 0.5
                  ? "moss_block"
                  : "mossy_cobblestone"
                : rng() < 0.5
                  ? "cobblestone"
                  : "stone",
            dark: y === y0 + thick - 1 ? 0.14 : 0.34,
          });
    }
  };
  outcrop(3, 9, 13, 3, -4);
  outcrop(11, 17, 18, 3, -3);

  /* ── collect + face-cull + sort ──────────────────────────────────────── */
  const voxels: Vox[] = [];
  const collect = (target: Vox[], keys: Iterable<string>) => {
    for (const k of keys) {
      const [x, y, z] = k.split(",").map(Number);
      let f = 0;
      if (!occ(x, y, z - 1)) f |= F_FRONT;
      if (!occ(x, y + 1, z)) f |= F_TOP;
      if (!occ(x + 1, y, z)) f |= F_RIGHT;
      if (f) target.push({ x, y, z, cell: world.get(k)!, f });
    }
  };
  const solidKeys: string[] = [];
  for (const [k] of world) if (!isWater.has(k)) solidKeys.push(k);
  collect(voxels, solidKeys);
  collect(water, isWater);
  const cmp = (a: Vox, b: Vox) => b.z - a.z || a.y - b.y || a.x - b.x;
  voxels.sort(cmp);
  water.sort(cmp);

  /* ── clouds ──────────────────────────────────────────────────────────── */
  const clouds: Cloud[] = [];
  for (let b = 0; b < 6; b++) {
    const cx = -2 + Math.floor(rng() * 24);
    const cy = 30 + Math.floor(rng() * 7);
    const cz = 4 + Math.floor(rng() * 6);
    const w = 3 + Math.floor(rng() * 3);
    const h = rng() < 0.5 ? 1 : 0;
    const dep = 2 + Math.floor(rng() * 2);
    const blocks: { x: number; y: number; z: number }[] = [];
    for (let dx = 0; dx < w; dx++)
      for (let dy = 0; dy <= h; dy++)
        for (let dz = 0; dz < dep; dz++)
          if (rng() < 0.82) blocks.push({ x: cx + dx, y: cy + dy, z: cz + dz });
    const warmth = clamp(1 - cx / 22, 0, 1);
    clouds.push({
      blocks,
      color: `rgb(${Math.round(lerp(214, 250, warmth))},${Math.round(lerp(196, 208, warmth))},${Math.round(lerp(214, 182, warmth))})`,
      drift: 0.0012 + rng() * 0.002,
    });
  }

  /* ── screen bounds → canvas ──────────────────────────────────────────── */
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const scan = (x: number, y: number, z: number) => {
    const px = x * T + z * DX;
    const py = (WY - y) * T - z * DY;
    minX = Math.min(minX, px);
    maxX = Math.max(maxX, px);
    minY = Math.min(minY, py);
    maxY = Math.max(maxY, py);
  };
  for (const v of [...voxels, ...water]) {
    scan(v.x, v.y, v.z);
    scan(v.x + 1, v.y + 1, v.z + 1);
  }
  for (const cl of clouds)
    for (const b of cl.blocks) {
      scan(b.x, b.y, b.z);
      scan(b.x + 1, b.y + 1, b.z + 1);
    }
  const M = 8;
  const mx = -minX + M;
  const my = -minY + M;
  const canvasW = Math.ceil(maxX - minX + 2 * M);
  const canvasH = Math.ceil(maxY - minY + 2 * M);

  /* ── spray ───────────────────────────────────────────────────────────── */
  const spray: Piece1Voxels["spray"] = [];
  for (let n = 0; n < 44; n++)
    spray.push({
      x: mx + lerp(WL - 1, WR + 2, rng()) * T + WZ0 * DX + (rng() - 0.5) * 22,
      y: my + (WY - lerp(POOL_TOP, POOL_TOP + 5, rng())) * T - WZ0 * DY,
      s: 2 + Math.floor(rng() * 3) * 2,
      phase: rng() * Math.PI * 2,
      rate: 0.6 + rng() * 1.5,
    });

  /* ── sky ─────────────────────────────────────────────────────────────── */
  const skyStops: [number, string][] = [
    [0.0, "#463a6f"],
    [0.24, "#63488f"],
    [0.44, "#8f5391"],
    [0.62, "#c06d84"],
    [0.78, "#e08a67"],
    [0.9, "#f4c079"],
    [1.0, "#f7d99e"],
  ];
  const glows = [
    { x: mx + 5 * T, y: my + (WY - TOP_L + 2) * T, r: 26 * T, color: "rgba(255,206,142,0.5)" },
    { x: mx + 17 * T, y: my + (WY - TOP_R - 3) * T, r: 15 * T, color: "rgba(255,150,120,0.22)" },
  ];

  return { voxels, water, spray, clouds, skyStops, glows, proj: { mx, my, wy: WY }, canvasW, canvasH };
}
