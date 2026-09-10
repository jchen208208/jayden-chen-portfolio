/**
 * Shared canvas-blit helpers for the block scenes (piece1 = PixelScene,
 * piece2 = PixelScene2). Each scene owns its own animated frame loop; this
 * module just paints the one-time static layer (sky gradient + warm glows +
 * every terrain block) that both re-blit each frame.
 */

import { TILE, type TexKey, type TexSet } from "./textures";
import type { Cell } from "./scene";

export type StaticScene = {
  cells: (Cell | null)[][];
  skyStops: [number, string][];
  glows: { x: number; y: number; r: number; color: string }[];
};

/* ── faux-3D: every block is a shallow cuboid seen from slightly above-left,
   so an exposed top edge shows a lit top face and an exposed right edge shows
   a shaded side face. Purely a render pass over the 2D grid. */
export const DEPTH_X = 5;
export const DEPTH_Y = 4;

const GREY: [number, number, number] = [126, 126, 124];
const BASE: Partial<Record<TexKey, [number, number, number]>> = {
  stone: GREY,
  cobblestone: GREY,
  stone_bricks: GREY,
  gravel: [128, 122, 116],
  mossy_cobblestone: [108, 122, 88],
  mossy_stone_bricks: [108, 122, 88],
  moss_block: [86, 114, 54],
  grass_block_top: [116, 152, 70],
  grass_block_side: [116, 152, 70],
  podzol_top: [122, 132, 72],
  podzol_side: [120, 92, 58],
  dirt: [116, 86, 58],
  coarse_dirt: [110, 80, 54],
  rooted_dirt: [112, 84, 58],
  oak_log: [124, 98, 58],
  jungle_log: [116, 92, 54],
  oak_log_top: [152, 122, 80],
  oak_leaves: [92, 126, 58],
  jungle_leaves: [92, 126, 58],
  spruce_leaves: [78, 100, 66],
  dark_oak_leaves: [76, 98, 56],
  birch_leaves: [118, 130, 74],
  azalea_leaves: [106, 140, 76],
  flowering_azalea_leaves: [128, 118, 132],
  vine: [88, 122, 52],
  fern: [96, 126, 54],
  large_fern_top: [96, 126, 54],
  large_fern_bottom: [96, 126, 54],
  hanging_roots: [150, 112, 76],
  mangrove_roots_side: [116, 88, 60],
  mangrove_roots_top: [116, 88, 60],
  water_still: [88, 130, 198],
  snow: [232, 238, 246],
  deepslate: [96, 90, 96],
  tuff: [126, 118, 110],
  glow_lichen: [110, 180, 150],
  poppy: [150, 92, 82],
};
const c8 = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
function mix(a: readonly number[], b: readonly number[], t: number) {
  return `rgb(${c8(a[0] + (b[0] - a[0]) * t)},${c8(a[1] + (b[1] - a[1]) * t)},${c8(a[2] + (b[2] - a[2]) * t)})`;
}
/** lit top-face + shaded side-face colours for a block, honouring its shade */
export function faceColors(key: TexKey, dark = 0, warm = 0) {
  const b = BASE[key] ?? GREY;
  const s: readonly number[] = [
    b[0] * (1 - dark) + warm * 60,
    b[1] * (1 - dark) + warm * 34,
    b[2] * (1 - dark) + warm * 6,
  ];
  return { top: mix(s, [255, 234, 200], 0.32), side: mix(s, [16, 24, 34], 0.44) };
}

/** draw the top + right faces for exposed block edges (call before the front
 *  faces so the flat textures always sit on top). Optional bounds clip. */
export function paintBevels(
  g: CanvasRenderingContext2D,
  cells: (Cell | null)[][],
  bounds?: [number, number, number, number],
) {
  const rows = cells.length;
  const cols = cells[0].length;
  const [r0, c0, r1, c1] = bounds ?? [0, 0, rows, cols];
  for (let r = Math.max(0, r0); r < Math.min(rows, r1); r++)
    for (let c = Math.max(0, c0); c < Math.min(cols, c1); c++) {
      const cell = cells[r][c];
      if (!cell) continue;
      const above = r > 0 ? cells[r - 1][c] : null;
      const right = c < cols - 1 ? cells[r][c + 1] : null;
      if (above && right) continue;
      const x = c * TILE;
      const y = r * TILE;
      const f = faceColors(cell.base, cell.dark ?? 0, cell.warm ?? 0);
      if (!above) {
        g.fillStyle = f.top;
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x + TILE, y);
        g.lineTo(x + TILE + DEPTH_X, y - DEPTH_Y);
        g.lineTo(x + DEPTH_X, y - DEPTH_Y);
        g.closePath();
        g.fill();
      }
      if (!right) {
        g.fillStyle = f.side;
        g.beginPath();
        g.moveTo(x + TILE, y);
        g.lineTo(x + TILE + DEPTH_X, y - DEPTH_Y);
        g.lineTo(x + TILE + DEPTH_X, y + TILE - DEPTH_Y);
        g.lineTo(x + TILE, y + TILE);
        g.closePath();
        g.fill();
      }
    }
}

/* a 16x16 scratch buffer so per-cell dark/warm/bright tints clip to the
   block texture's own alpha (leaves + vines are full of holes — filling the
   whole cell rect would paint solid squares over the sky) */
let _scratch: HTMLCanvasElement | null = null;
let _sg: CanvasRenderingContext2D | null = null;
function scratch() {
  if (!_scratch) {
    _scratch = document.createElement("canvas");
    _scratch.width = TILE;
    _scratch.height = TILE;
    _sg = _scratch.getContext("2d")!;
    _sg.imageSmoothingEnabled = false;
  }
  return { canvas: _scratch, g: _sg! };
}

export function drawCell(
  g: CanvasRenderingContext2D,
  cells: (Cell | null)[][],
  tex: TexSet,
  r: number,
  c: number,
) {
  const cell = cells[r]?.[c];
  if (!cell) return;
  const x = c * TILE;
  const y = r * TILE;

  if (!cell.overlay && !cell.dark && !cell.warm && !cell.bright) {
    g.drawImage(tex[cell.base], 0, 0, TILE, TILE, x, y, TILE, TILE);
    return;
  }

  const s = scratch();
  s.g.clearRect(0, 0, TILE, TILE);
  s.g.globalCompositeOperation = "source-over";
  s.g.drawImage(tex[cell.base], 0, 0, TILE, TILE, 0, 0, TILE, TILE);
  if (cell.overlay) s.g.drawImage(tex[cell.overlay], 0, 0, TILE, TILE, 0, 0, TILE, TILE);
  s.g.globalCompositeOperation = "source-atop"; // clip tints to the block's alpha
  if (cell.dark) {
    s.g.fillStyle = `rgba(4,6,16,${cell.dark})`;
    s.g.fillRect(0, 0, TILE, TILE);
  }
  if (cell.warm) {
    s.g.fillStyle = `rgba(255,176,108,${cell.warm})`;
    s.g.fillRect(0, 0, TILE, TILE);
  }
  if (cell.bright) {
    s.g.fillStyle = `rgba(255,252,240,${cell.bright})`;
    s.g.fillRect(0, 0, TILE, TILE);
  }
  s.g.globalCompositeOperation = "source-over";
  g.drawImage(s.canvas, x, y);
}

export function paintStatic(
  g: CanvasRenderingContext2D,
  scene: StaticScene,
  tex: TexSet,
) {
  const rows = scene.cells.length;
  const cols = scene.cells[0].length;
  const W = cols * TILE;
  const H = rows * TILE;
  g.imageSmoothingEnabled = false;

  const grad = g.createLinearGradient(0, 0, 0, H);
  for (const [o, c] of scene.skyStops) grad.addColorStop(o, c);
  g.fillStyle = grad;
  g.fillRect(0, 0, W, H);

  for (const gl of scene.glows) {
    const rg = g.createRadialGradient(gl.x, gl.y, 0, gl.x, gl.y, gl.r);
    rg.addColorStop(0, gl.color);
    rg.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = rg;
    g.fillRect(gl.x - gl.r, gl.y - gl.r, gl.r * 2, gl.r * 2);
  }

  paintBevels(g, scene.cells);
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) drawCell(g, scene.cells, tex, r, c);
}
