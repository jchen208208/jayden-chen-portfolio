import { NEON_SIZE, SCREENS, neonBoard, neonHang, type NeonSignSpec } from "@/lib/desk";
import type { SectionId } from "@/lib/site";

/**
 * The four section names, as LED neon signs on the wall — one centred just
 * above each screen. Like the real thing, each is tubing on a clear acrylic
 * backboard, hung picture-style: a string from a screw eye on each end of the
 * board's top edge, up to one pin in the wall.
 *
 *                ●              ← pin: a plain white head
 *             ╱    ╲            ← strings, at the same angle on every sign
 *      ┌────o────────o────┐     ← screw eyes in the top edge
 *      │╔════════════════╗│     ← acrylic: outer edge, and its thickness
 *      │║   PROJECTS     ║│        (the inner line catches the neon's light)
 *      │╚════════════════╝│
 *      └──────────────────┘
 *
 * The board, strings, eyes and pin are objects, so they're ink and never dim
 * — except the board's inner edge, which is lit by the tubing like real
 * edge-lit acrylic, and switches off with it.
 *
 * Neon is light, so by the colour rule (top of globals.css) it's the one
 * thing on the wall allowed colour. Each sign is three layers of the same
 * lettering, in a monoline face drawn for neon (Tilt Neon), so filled glyphs
 * read as bent tubes:
 *
 *   unlit  — the glass tube itself, faint ink. Always there; it's what's left
 *            when the sign is switched off.
 *   halo   — the light spilling off the tube, a blurred stroke in `--neon`
 *   core   — the tube lit, a pale tint of `--neon` with a thin rim of it
 *
 * Hovering a screen switches the other three signs off (globals.css, next to
 * the screen spotlight it mirrors), so the one you're on is the only sign
 * still lit.
 *
 * Every attribute is explicit because this sits inside `DeskSvg`'s
 * outer `<g stroke={INK} strokeWidth={2.4}>`.
 */

const INK = "var(--ink, #f4f6f8)";
const PAPER = "var(--paper, #000)";
const NEON = "var(--neon, #ff4f8b)";
const NEON_CORE = "var(--neon-core, #ffe4ee)";
const NEON_FONT = "var(--font-neon), ui-rounded, system-ui, sans-serif";
const HALO_ID = "desk-neon-halo";
/** the acrylic's thickness, seen as an inner line along its edge */
const BOARD_EDGE = 2.6;
const BOARD_R = 6;

/** the pin the strings hang from, seen head-on: a plain white head */
const PIN_R = 3.6;

/** a small screw eye on the board's top edge at (`x`, `y`): just its ring,
 *  sitting on the edge */
function ScrewEye({ x, y }: { x: number; y: number }) {
  return <circle cx={x} cy={y - 3.2} r={2.3} fill={PAPER} stroke={INK} strokeWidth={1.1} />;
}

function NeonSign({ id, ...sign }: NeonSignSpec & { id: SectionId }) {
  const { text, cx, cy } = sign;
  const board = neonBoard(sign);
  const { left, right, pin } = neonHang(sign);
  // the strings tie through each eye's ring, a little above the edge
  const eyeY = board.y - 3.2;
  const inner = {
    x: board.x + BOARD_EDGE,
    y: board.y + BOARD_EDGE,
    width: board.w - BOARD_EDGE * 2,
    height: board.h - BOARD_EDGE * 2,
    rx: BOARD_R - BOARD_EDGE,
  };
  // two short glare streaks across the bottom-left corner, clear of the text
  const gx = board.x;
  const gy = board.y + board.h;
  const lettering = {
    x: cx,
    y: cy,
    textAnchor: "middle" as const,
    dominantBaseline: "central" as const,
  };
  return (
    <g data-neon={id} fontFamily={NEON_FONT} fontSize={NEON_SIZE} letterSpacing={NEON_SIZE * 0.06}>
      {/* strings, from eye to pin to eye — drawn first so the eyes and the
          pin sit over their ends */}
      <path
        d={`M${left.x} ${eyeY} L${pin.x} ${pin.y} L${right.x} ${eyeY}`}
        fill="none"
        stroke={INK}
        strokeWidth={1.1}
        strokeLinejoin="round"
      />

      {/* the acrylic board: its outer edge, a faint body, its thickness */}
      <rect
        x={board.x}
        y={board.y}
        width={board.w}
        height={board.h}
        rx={BOARD_R}
        fill={INK}
        fillOpacity={0.04}
        stroke={INK}
        strokeOpacity={0.9}
        strokeWidth={1.6}
      />
      <rect {...inner} fill="none" stroke={INK} strokeOpacity={0.25} strokeWidth={0.8} />
      <path
        d={`M${gx + 4.5} ${gy - 14} L${gx + 11} ${gy - 7.5} M${gx + 4.5} ${gy - 8.5} L${gx + 6.5} ${gy - 6.5}`}
        fill="none"
        stroke={INK}
        strokeOpacity={0.4}
        strokeWidth={1}
        strokeLinecap="round"
      />

      <ScrewEye x={left.x} y={board.y} />
      <ScrewEye x={right.x} y={board.y} />
      <circle cx={pin.x} cy={pin.y} r={PIN_R} fill={INK} stroke="none" />

      <text {...lettering} fill={INK} fillOpacity={0.28} stroke="none">
        {text}
      </text>
      <g className="neon-lit">
        {/* the acrylic's edge, catching the tubing's light */}
        <rect {...inner} fill="none" stroke={NEON} strokeOpacity={0.5} strokeWidth={0.9} />
        <text
          {...lettering}
          fill="none"
          stroke={NEON}
          strokeWidth={5}
          strokeOpacity={0.55}
          strokeLinejoin="round"
          filter={`url(#${HALO_ID})`}
        >
          {text}
        </text>
        <text {...lettering} fill={NEON_CORE} stroke={NEON} strokeWidth={0.9}>
          {text}
        </text>
      </g>
    </g>
  );
}

export default function NeonSigns() {
  return (
    <g>
      <defs>
        {/* generous region: the blur spills well past the text's own box */}
        <filter id={HALO_ID} x="-20%" y="-60%" width="140%" height="220%">
          <feGaussianBlur stdDeviation={3} />
        </filter>
      </defs>
      {SCREENS.map((s) => (
        <NeonSign key={s.id} id={s.id} {...s.sign} />
      ))}
    </g>
  );
}
