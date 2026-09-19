/**
 * The real KiCad boards the viewer can show, as geometry.
 *
 * Each JSON is generated from the KiCad project by `scripts/extract-pcb.mjs`
 * — regenerate it after editing the board:
 *
 *   node scripts/extract-pcb.mjs <path>/ESP32_USB.kicad_pcb    > src/lib/pcb-board.json
 *   node scripts/extract-pcb.mjs <path>/sparc_pcb_v2.kicad_pcb > src/lib/pcb-sparc.json
 *
 * Everything in the JSON is in KiCad's own millimetres, where +Y points DOWN
 * the board. The viewer works in a Y-up space centred on each board, so every
 * consumer goes through that board's `toX`/`toY` rather than touching raw
 * coordinates.
 */

import esp32Raw from "@/lib/pcb-board.json";
import sparcRaw from "@/lib/pcb-sparc.json";

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

/** FR-4 thickness, the industry default KiCad assumes */
export const BOARD_T = 1.6;

export const rad = (deg: number) => (deg * Math.PI) / 180;

export type BoardId = "esp32" | "sparc";

/** one board, with its size and its own KiCad → viewer coordinate mapping */
export type BoardModel = {
  id: BoardId;
  data: Board;
  /** outline bounds, mm */
  w: number;
  h: number;
  /** KiCad mm → viewer mm, centred on this board, Y flipped so +Y is up */
  toX: (x: number) => number;
  toY: (y: number) => number;
};

function model(id: BoardId, data: Board): BoardModel {
  const { x1, y1, x2, y2 } = data.bounds;
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2;
  return {
    id,
    data,
    w: x2 - x1,
    h: y2 - y1,
    toX: (x) => x - cx,
    toY: (y) => cy - y,
  };
}

export const BOARDS: Record<BoardId, BoardModel> = {
  /** ESP32-S3-WROOM-1 USB-A dongle, 20.2 × 35 mm */
  esp32: model("esp32", esp32Raw as Board),
  /** SPARC — Spotify Proximity And Remote Control — ESP32-WROOM-32, 36.5 mm square */
  sparc: model("sparc", sparcRaw as Board),
};

/**
 * A part's pads, expressed in that part's own un-rotated frame with the
 * viewer's Y-up convention — i.e. the space its 3D body is modelled in.
 * Used to work out which end of a module is pads and which is antenna, and
 * how long a connector's housing is, rather than hard-coding it per
 * footprint.
 */
export function partLocalPads(board: BoardModel, part: Part) {
  const a = rad(-part.rot);
  const out: { x: number; y: number }[] = [];
  for (const p of board.data.pads) {
    if (p.ref !== part.ref) continue;
    const dx = p.x - part.x;
    const dy = board.toY(p.y) - board.toY(part.y);
    // undo the group's rotation.z to get back to body-local coordinates
    out.push({
      x: dx * Math.cos(a) - dy * Math.sin(a),
      y: dx * Math.sin(a) + dy * Math.cos(a),
    });
  }
  return out;
}

/** the board's real colours — flip `PALETTE` back to this to see them */
export const PCB_COLOUR = {
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

/**
 * Ink on black, like everything else on the desk: the laminate is a deep grey
 * (the board has to read as an object, not a hole), copper traces sit a few
 * steps above it, and pads, vias and silkscreen are the page ink. The LED and
 * rim light are plain white.
 */
export const PCB_MONO = {
  mask: "#15181d",
  maskOverCu: "#1b1f25",
  maskOverTrace: "#8a8f96",
  gold: "#f4f6f8",
  goldDark: "#9aa3ad",
  silk: "#f4f6f8",
  accent: "#f4f6f8",
} as const;

/** the palette the board is painted and lit in */
export const PALETTE: { [K in keyof typeof PCB_MONO]: string } = PCB_MONO;
