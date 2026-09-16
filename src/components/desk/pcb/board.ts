/**
 * The ESP32-S3 USB dongle, as geometry.
 *
 * `pcb-board.json` is generated from the real KiCad project by
 * `scripts/extract-pcb.mjs` — regenerate it after editing the board:
 *
 *   node scripts/extract-pcb.mjs <path>/ESP32_USB.kicad_pcb > src/lib/pcb-board.json
 *
 * Everything here is in KiCad's own millimetres, where +Y points DOWN the
 * board. The viewer works in a Y-up space centred on the board, so every
 * consumer goes through `toX`/`toY` rather than touching raw coordinates.
 */

import raw from "@/lib/pcb-board.json";

export type CuLayer = "F.Cu" | "B.Cu";
export type Side = "F" | "B";

export type Trace = { x1: number; y1: number; x2: number; y2: number; w: number; layer: string };
export type Via = { x: number; y: number; d: number; drill: number };
export type Zone = { layer: string; pts: [number, number][] };
export type Pad = {
  ref: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rot: number;
  shape: string;
  both: boolean;
  layer: string;
};
export type Silk = { x1: number; y1: number; x2: number; y2: number; w: number; layer: string };
export type SilkText = { s: string; x: number; y: number; rot: number; size: number; layer: string };
export type Part = {
  ref: string;
  value: string;
  lib: string;
  x: number;
  y: number;
  rot: number;
  side: Side;
  box: { w: number; h: number; cx: number; cy: number } | null;
};

export type Board = {
  bounds: { x1: number; y1: number; x2: number; y2: number };
  outline: [number, number][];
  traces: Trace[];
  vias: Via[];
  zones: Zone[];
  pads: Pad[];
  silk: Silk[];
  texts: SilkText[];
  parts: Part[];
};

export const BOARD = raw as Board;

/** FR-4 thickness, the industry default KiCad assumes */
export const BOARD_T = 1.6;

const { x1, y1, x2, y2 } = BOARD.bounds;
export const BOARD_W = x2 - x1;
export const BOARD_H = y2 - y1;
const CX = (x1 + x2) / 2;
const CY = (y1 + y2) / 2;

/** KiCad mm → viewer mm, centred, Y flipped so +Y is up */
export const toX = (x: number) => x - CX;
export const toY = (y: number) => CY - y;

export const rad = (deg: number) => (deg * Math.PI) / 180;

/**
 * A part's pads, expressed in that part's own un-rotated frame with the
 * viewer's Y-up convention — i.e. the space its 3D body is modelled in.
 * Used to work out which end of a module is pads and which is antenna,
 * rather than hard-coding it per footprint.
 */
export function partLocalPadBounds(part: Part) {
  const a = rad(-part.rot);
  let lo = Infinity;
  let hi = -Infinity;
  for (const p of BOARD.pads) {
    if (p.ref !== part.ref) continue;
    const dx = p.x - part.x;
    const dy = toY(p.y) - toY(part.y);
    // undo the group's rotation.z to get back to body-local coordinates
    const ly = dx * Math.sin(a) + dy * Math.cos(a);
    lo = Math.min(lo, ly);
    hi = Math.max(hi, ly);
  }
  return Number.isFinite(lo) ? { lo, hi } : null;
}

/** the palette the board is painted and lit in */
export const PCB = {
  mask: "#12513c",
  /** Soldermask sitting over copper reads a little brighter than over bare
   *  laminate — but only a little. The board's whole back is ground pour, so
   *  any real gap between these two turns that side into a pale mint slab
   *  while the front stays deep green. */
  maskOverCu: "#14563f",
  maskOverTrace: "#279274",
  gold: "#d8a85a",
  goldDark: "#9a7436",
  silk: "#e8ece9",
  /** the LED, and the warm rim light — the site's own Projects accent */
  accent: "#e6a15c",
} as const;
