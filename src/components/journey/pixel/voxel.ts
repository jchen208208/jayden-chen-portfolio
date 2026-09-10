/**
 * A tiny voxel renderer for the block scenes. Blocks live in a 3D grid
 * (x right, y up, z into the screen) and are drawn in an oblique / "cabinet"
 * projection: the front face stays an undistorted 16px square (so textures blit
 * 1:1), and receding depth shifts up-and-right, so every exposed block also
 * shows a lit TOP face and a shaded RIGHT face. Painter-sorted back-to-front so
 * near blocks overlap the ones behind — real layered depth.
 */

import { faceColors } from "./render";
import { TILE, type TexSet } from "./textures";
import type { Cell } from "./scene";

export const T = TILE; // 16 — front-face size on screen
export const DX = 8; // screen px right per unit of depth z
export const DY = 9; // screen px up per unit of depth z (downward tilt)

export const F_FRONT = 1;
export const F_TOP = 2;
export const F_RIGHT = 4;

export type Vox = { x: number; y: number; z: number; cell: Cell; f: number };

/** screen coords of the world corner (x, y, z) — y is up in world, down on screen */
export function sx(mx: number, x: number, z: number) {
  return mx + x * T + z * DX;
}
export function sy(my: number, wy: number, y: number, z: number) {
  return my + (wy - y) * T - z * DY;
}

/** back-to-front: far z first; within a z-slice lower + left first so nearer
 *  fronts cover the parallelogram spill of the blocks behind them */
export function voxOrder(a: Vox, b: Vox) {
  return b.z - a.z || a.y - b.y || a.x - b.x;
}

export type VoxProj = { mx: number; my: number; wy: number };

export function quad(
  g: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
) {
  g.beginPath();
  g.moveTo(x0, y0);
  g.lineTo(x1, y1);
  g.lineTo(x2, y2);
  g.lineTo(x3, y3);
  g.closePath();
  g.fill();
  // hairline stroke in the same colour closes the seams between angled faces
  g.strokeStyle = g.fillStyle as string;
  g.lineWidth = 1;
  g.stroke();
}

/* a 16x16 scratch so front-face tints clip to the block's own alpha */
let _sc: HTMLCanvasElement | null = null;
let _scg: CanvasRenderingContext2D | null = null;
function scr() {
  if (!_sc) {
    _sc = document.createElement("canvas");
    _sc.width = T;
    _sc.height = T;
    _scg = _sc.getContext("2d")!;
    _scg.imageSmoothingEnabled = false;
  }
  return { c: _sc, g: _scg! };
}

/** front face: the block texture (+ overlay + dark/warm/bright), 1:1 */
export function drawFront(
  g: CanvasRenderingContext2D,
  tex: TexSet,
  cell: Cell,
  x: number,
  y: number,
) {
  if (!cell.overlay && !cell.dark && !cell.warm && !cell.bright) {
    g.drawImage(tex[cell.base], 0, 0, T, T, x, y, T, T);
    return;
  }
  const s = scr();
  s.g.clearRect(0, 0, T, T);
  s.g.globalCompositeOperation = "source-over";
  s.g.drawImage(tex[cell.base], 0, 0, T, T, 0, 0, T, T);
  if (cell.overlay) s.g.drawImage(tex[cell.overlay], 0, 0, T, T, 0, 0, T, T);
  s.g.globalCompositeOperation = "source-atop";
  if (cell.dark) {
    s.g.fillStyle = `rgba(4,6,16,${cell.dark})`;
    s.g.fillRect(0, 0, T, T);
  }
  if (cell.warm) {
    s.g.fillStyle = `rgba(255,176,108,${cell.warm})`;
    s.g.fillRect(0, 0, T, T);
  }
  if (cell.bright) {
    s.g.fillStyle = `rgba(255,252,240,${cell.bright})`;
    s.g.fillRect(0, 0, T, T);
  }
  s.g.globalCompositeOperation = "source-over";
  g.drawImage(s.c, x, y);
}

/** draw one voxel's visible faces. `p` gives the screen origin + world height. */
export function drawVox(
  g: CanvasRenderingContext2D,
  tex: TexSet,
  p: VoxProj,
  v: Vox,
) {
  const X = sx(p.mx, v.x, v.z);
  const Y = sy(p.my, p.wy, v.y, v.z); // front-bottom-left corner
  const fc = faceColors(v.cell.base, v.cell.dark ?? 0, v.cell.warm ?? 0);

  if (v.f & F_RIGHT) {
    g.fillStyle = fc.side;
    quad(g, X + T, Y - T, X + T + DX, Y - T - DY, X + T + DX, Y - DY, X + T, Y);
  }
  if (v.f & F_TOP) {
    g.fillStyle = fc.top;
    quad(g, X, Y - T, X + T, Y - T, X + T + DX, Y - T - DY, X + DX, Y - T - DY);
  }
  if (v.f & F_FRONT) {
    drawFront(g, tex, v.cell, X, Y - T);
  }
}
