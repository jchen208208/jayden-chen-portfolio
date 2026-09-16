/**
 * Paints one side of the board — soldermask, copper pour, traces, gold pads,
 * vias and silkscreen — onto a canvas that becomes the board mesh's texture.
 *
 * Drawing the copper as a texture rather than as geometry is what keeps this
 * cheap: 78 traces, 86 pads and 1400 pour vertices become two bitmaps and two
 * triangle fans, instead of thousands of extruded slivers.
 *
 * The canvas is painted in KiCad's own (Y-down) millimetres, offset so the
 * board's top-left bound sits at the canvas origin. That matches the texture's
 * own top-left-origin convention, so the UVs the mesh uses are a plain
 * normalised x/y — see `buildBoardMeshes`.
 */

import { BOARD, PCB, type Side } from "./board";

/** Texture resolution. The board is drawn on the desk monitor at roughly
 *  130 x 65 CSS px, so even this is several times what's ever sampled — kept
 *  there as headroom in case the viewer gets a bigger home. It isn't free
 *  though: these two canvases are painted during startup, so pushing it much
 *  higher shows up as the board arriving later. Raise it only alongside a
 *  bigger display. */
const PX_PER_MM = 20;

/**
 * KiCad's "keep upright" rule for footprint text, which is on by default: a
 * designator inherits its footprint's rotation, but is flipped by a half turn
 * rather than ever being plotted upside down. Without this a part placed at
 * 180° prints its reference on its head.
 */
function uprightAngle(deg: number) {
  const a = ((deg % 360) + 360) % 360;
  return a > 90 && a <= 270 ? a - 180 : a;
}

export function paintLayer(side: Side): HTMLCanvasElement {
  const { x1, y1, x2, y2 } = BOARD.bounds;
  const w = x2 - x1;
  const h = y2 - y1;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * PX_PER_MM);
  canvas.height = Math.round(h * PX_PER_MM);
  const ctx = canvas.getContext("2d")!;

  ctx.scale(PX_PER_MM, PX_PER_MM);
  ctx.translate(-x1, -y1);

  const cu = side === "F" ? "F.Cu" : "B.Cu";
  const silkLayer = side === "F" ? "F.SilkS" : "B.SilkS";

  // 1. bare soldermask over the whole board
  ctx.fillStyle = PCB.mask;
  ctx.fillRect(x1, y1, w, h);

  // 2. the ground pour — mask over solid copper is a shade lighter
  ctx.fillStyle = PCB.maskOverCu;
  for (const z of BOARD.zones) {
    if (z.layer !== cu || z.pts.length < 3) continue;
    ctx.beginPath();
    z.pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
    ctx.closePath();
    ctx.fill();
  }

  // 3. signal traces
  ctx.strokeStyle = PCB.maskOverTrace;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const t of BOARD.traces) {
    if (t.layer !== cu) continue;
    ctx.lineWidth = t.w;
    ctx.beginPath();
    ctx.moveTo(t.x1, t.y1);
    ctx.lineTo(t.x2, t.y2);
    ctx.stroke();
  }

  // 4. pads — bare ENIG gold, with a slightly darker edge so they read as
  //    raised metal rather than flat paint
  for (const p of BOARD.pads) {
    if (!p.both && p.layer !== cu) continue;
    ctx.save();
    ctx.translate(p.x, p.y);
    // KiCad angles are counter-clockwise on a Y-down canvas, so negate
    ctx.rotate((-p.rot * Math.PI) / 180);
    ctx.fillStyle = PCB.gold;
    ctx.beginPath();
    if (p.shape === "circle" || p.shape === "oval") {
      ctx.ellipse(0, 0, p.w / 2, p.h / 2, 0, 0, Math.PI * 2);
    } else {
      const r = p.shape === "roundrect" ? Math.min(p.w, p.h) * 0.25 : 0.05;
      ctx.roundRect(-p.w / 2, -p.h / 2, p.w, p.h, r);
    }
    ctx.fill();
    ctx.lineWidth = 0.05;
    ctx.strokeStyle = PCB.goldDark;
    ctx.stroke();
    ctx.restore();
  }

  // 5. vias — plated ring with the drill barrel dark in the middle
  for (const v of BOARD.vias) {
    ctx.fillStyle = PCB.gold;
    ctx.beginPath();
    ctx.arc(v.x, v.y, v.d / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#20160c";
    ctx.beginPath();
    ctx.arc(v.x, v.y, v.drill / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // 6. silkscreen outlines
  ctx.strokeStyle = PCB.silk;
  for (const s of BOARD.silk) {
    if (s.layer !== silkLayer) continue;
    ctx.lineWidth = s.w;
    ctx.beginPath();
    ctx.moveTo(s.x1, s.y1);
    ctx.lineTo(s.x2, s.y2);
    ctx.stroke();
  }

  // 7. reference designators. This whole canvas is painted in top-down board
  //    coordinates, and the back one gets mapped to the board's back face —
  //    which the viewer sees mirrored once the board turns round. Geometry
  //    doesn't care, but lettering does, so back-side glyphs are reflected
  //    here to cancel that out and leave "U2" reading the right way round.
  ctx.fillStyle = PCB.silk;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const t of BOARD.texts) {
    if (t.layer !== silkLayer) continue;
    ctx.save();
    ctx.translate(t.x, t.y);
    if (side === "B") ctx.scale(-1, 1);
    ctx.rotate((-uprightAngle(t.rot) * Math.PI) / 180);
    // KiCad's stroke font is a touch narrower than a system sans at the same
    // nominal size; 0.95 lands closer to a real silkscreen plot.
    ctx.font = `600 ${t.size * 0.95}px ui-monospace, "SFMono-Regular", Menlo, monospace`;
    ctx.fillText(t.s, 0, 0);
    ctx.restore();
  }

  return canvas;
}
