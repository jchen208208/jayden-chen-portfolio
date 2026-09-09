/**
 * Shared canvas-blit helpers for the block scenes (piece1 = PixelScene,
 * piece2 = PixelScene2). Each scene owns its own animated frame loop; this
 * module just paints the one-time static layer (sky gradient + warm glows +
 * every terrain block) that both re-blit each frame.
 */

import { TILE, type TexSet } from "./textures";
import type { Cell } from "./scene";

export type StaticScene = {
  cells: (Cell | null)[][];
  skyStops: [number, string][];
  glows: { x: number; y: number; r: number; color: string }[];
};

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

  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) drawCell(g, scene.cells, tex, r, c);
}
