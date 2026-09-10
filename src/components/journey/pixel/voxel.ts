/**
 * A tiny voxel renderer for the block scenes. Blocks live in a 3D grid
 * (x right, y up, z into the screen) and are drawn in an oblique / "cabinet"
 * projection: the front face stays an undistorted 16px square (so textures blit
 * 1:1), and receding depth shifts up-and-right, so every exposed block also
 * shows a lit TOP face and a shaded RIGHT face. Painter-sorted back-to-front so
 * near blocks overlap the ones behind — real layered depth.
 */

import { faceColors } from "./render";
import { TILE, type TexKey, type TexSet } from "./textures";
import type { Cell } from "./scene";

export const T = TILE; // 16 — front-face size on screen
// near-frontal view: a thin right-face shear + a gentle downward tilt
export const DX = 4; // screen px right per unit of depth z
export const DY = 6; // screen px up per unit of depth z

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

/* which texture a block shows on its TOP face (side/front = the base key) */
const TOP_TEX: Partial<Record<TexKey, TexKey>> = {
  grass_block_side: "grass_block_top",
  oak_log: "oak_log_top",
  oak_log_top: "oak_log_top",
  jungle_log: "jungle_log",
  podzol_side: "podzol_top",
};
/* holey blocks — skip the solid seam-filling backing so their gaps stay clear */
const HOLEY = new Set<TexKey>([
  "oak_leaves",
  "azalea_leaves",
  "flowering_azalea_leaves",
  "jungle_leaves",
  "spruce_leaves",
  "dark_oak_leaves",
  "birch_leaves",
  "vine",
  "fern",
  "large_fern_top",
  "large_fern_bottom",
  "hanging_roots",
  "glow_lichen",
  "poppy",
]);

/** paint `texCanvas` (16px) into a parallelogram via the affine `m`, with the
 *  cell's dark/warm/bright plus a per-face shade, clipped to the texture alpha */
function drawSkew(
  g: CanvasRenderingContext2D,
  texCanvas: CanvasImageSource,
  cell: Cell,
  m: [number, number, number, number, number, number],
  faceDark: number,
  faceWarm: number,
) {
  const s = scr();
  s.g.clearRect(0, 0, T, T);
  s.g.globalCompositeOperation = "source-over";
  s.g.drawImage(texCanvas, 0, 0, T, T, 0, 0, T, T);
  const dk = Math.min(0.85, (cell.dark ?? 0) + faceDark);
  const wm = Math.min(0.8, (cell.warm ?? 0) + faceWarm);
  const br = cell.bright ?? 0;
  if (dk || wm || br) {
    s.g.globalCompositeOperation = "source-atop";
    if (dk) {
      s.g.fillStyle = `rgba(6,8,18,${dk})`;
      s.g.fillRect(0, 0, T, T);
    }
    if (wm) {
      s.g.fillStyle = `rgba(255,176,108,${wm})`;
      s.g.fillRect(0, 0, T, T);
    }
    if (br) {
      s.g.fillStyle = `rgba(255,252,240,${br})`;
      s.g.fillRect(0, 0, T, T);
    }
    s.g.globalCompositeOperation = "source-over";
  }
  g.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);
  g.drawImage(s.c, 0, 0);
  g.setTransform(1, 0, 0, 1, 0, 0);
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
  const base = v.cell.base;
  const solid = !HOLEY.has(base);
  const fc = solid
    ? faceColors(base, v.cell.dark ?? 0, v.cell.warm ?? 0)
    : null;

  if (v.f & F_RIGHT) {
    if (fc) {
      g.fillStyle = fc.side; // solid backing closes the seam
      quad(g, X + T, Y - T, X + T + DX, Y - T - DY, X + T + DX, Y - DY, X + T, Y);
    }
    drawSkew(
      g,
      tex[base],
      v.cell,
      [DX / T, -DY / T, 0, 1, X + T, Y - T],
      0.34,
      0,
    );
  }
  if (v.f & F_TOP) {
    if (fc) {
      g.fillStyle = fc.top;
      quad(g, X, Y - T, X + T, Y - T, X + T + DX, Y - T - DY, X + DX, Y - T - DY);
    }
    drawSkew(
      g,
      tex[TOP_TEX[base] ?? base],
      v.cell,
      [1, 0, DX / T, -DY / T, X, Y - T],
      0,
      0.05,
    );
  }
  if (v.f & F_FRONT) {
    drawFront(g, tex, v.cell, X, Y - T);
  }
}
