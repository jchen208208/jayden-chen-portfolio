"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
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
 *   halo   — the light spilling off the tube, a blurred stroke in `--glow`
 *   core   — the tube lit, warm white (`--neon-core`) with a thin rim of
 *            `--glow`
 *
 * The tubes are on their way out: every so often (`useFaults`) one sign
 * stutters — its light cuts out and back a few times — and a couple of sparks
 * jump off the lettering and fall away (globals.css, `.neon-flicker` and
 * `.neon-spark`). Never with reduced motion.
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
const NEON = "var(--glow, #ffbe5c)";
const NEON_CORE = "var(--neon-core, #fff4e2)";
const NEON_FONT = "var(--font-neon), ui-rounded, system-ui, sans-serif";
const HALO_ID = "desk-neon-halo";
/** the acrylic's thickness, seen as an inner line along its edge */
const BOARD_EDGE = 2.6;
const BOARD_R = 6;

/** the pin the strings hang from, seen head-on: a plain white head */
const PIN_R = 3.6;

/** how long the signs hold steady between two faults, in ms — a fresh
 *  random wait each time, so they never fall into a rhythm */
const FAULT_GAP = [6000, 14000] as const;
/** sparks leave from the top of the capitals, this far above the line's
 *  centre */
const SPARK_LIFT = 9;

/** one spark, in desk units and ms: how far it drifts sideways, how high it
 *  jumps before it falls, where it ends up below where it started, how long
 *  it lives, how long after the first cut it leaves, and its size */
type Spark = { dx: number; rise: number; fall: number; ms: number; delay: number; r: number };

/** one fault: which sign, where on its lettering the sparks leave from, and
 *  the sparks. `n` counts faults, so the same sign failing twice in a row
 *  still replays. */
type Fault = { id: SectionId; n: number; x: number; y: number; sparks: Spark[] };

const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);

function makeSpark(): Spark {
  return {
    dx: rand(-30, 30),
    rise: rand(6, 16),
    fall: rand(40, 60),
    ms: rand(650, 1000),
    // the flicker's first cut lands at ~50ms (see `neon-flicker`)
    delay: rand(50, 200),
    r: rand(1.8, 2.6),
  };
}

/** the latest fault, a new one after each random `FAULT_GAP` — `null`
 *  before the first, and always with reduced motion */
function useFaults(): Fault | null {
  const reduced = usePrefersReducedMotion();
  const [fault, setFault] = useState<Fault | null>(null);

  useEffect(() => {
    if (reduced) return;
    let n = 0;
    let timer: number;
    const schedule = () => {
      timer = window.setTimeout(() => {
        const { id, sign } = SCREENS[Math.floor(Math.random() * SCREENS.length)];
        setFault({
          id,
          n: ++n,
          x: sign.cx + sign.w * rand(-0.4, 0.4),
          y: sign.cy - SPARK_LIFT,
          sparks: Array.from({ length: Math.random() < 0.5 ? 2 : 3 }, makeSpark),
        });
        schedule();
      }, rand(...FAULT_GAP));
    };
    schedule();
    return () => window.clearTimeout(timer);
  }, [reduced]);

  return reduced ? null : fault;
}

/** a fault's sparks: each a hot dot in a faint glow, thrown off the tube.
 *  The outer group drifts it sideways, the inner one throws it up and lets
 *  it fall, and the dot fades out — split so each axis gets its own easing. */
function Sparks({ x, y, sparks }: Fault) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {sparks.map((s, i) => (
        <g
          key={i}
          className="neon-spark"
          style={
            {
              "--spark-dx": `${s.dx}px`,
              "--spark-rise": `${-s.rise}px`,
              "--spark-fall": `${s.fall}px`,
              "--spark-ms": `${s.ms}ms`,
              "--spark-delay": `${s.delay}ms`,
            } as CSSProperties
          }
        >
          <g>
            <g>
              <circle r={s.r * 2.4} fill={NEON} fillOpacity={0.45} stroke="none" />
              <circle r={s.r} fill={NEON_CORE} stroke="none" />
            </g>
          </g>
        </g>
      ))}
    </g>
  );
}

/** a small screw eye on the board's top edge at (`x`, `y`): just its ring,
 *  sitting on the edge */
function ScrewEye({ x, y }: { x: number; y: number }) {
  return <circle cx={x} cy={y - 3.2} r={2.3} fill={PAPER} stroke={INK} strokeWidth={1.1} />;
}

function NeonSign({ id, fault, ...sign }: NeonSignSpec & { id: SectionId; fault: Fault | null }) {
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
      {/* the sparks sit inside the light, so a sign that's switched off
          throws none */}
      <g className="neon-lit">
        {/* keyed by the fault, so each one remounts it and the flicker
            plays from the start */}
        <g key={`light-${fault?.n}`} className={fault ? "neon-flicker" : undefined}>
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
        {fault && <Sparks key={`sparks-${fault.n}`} {...fault} />}
      </g>
    </g>
  );
}

export default function NeonSigns() {
  const fault = useFaults();
  return (
    <g>
      <defs>
        {/* generous region: the blur spills well past the text's own box */}
        <filter id={HALO_ID} x="-20%" y="-60%" width="140%" height="220%">
          <feGaussianBlur stdDeviation={3} />
        </filter>
      </defs>
      {SCREENS.map((s) => (
        <NeonSign key={s.id} id={s.id} fault={fault?.id === s.id ? fault : null} {...s.sign} />
      ))}
    </g>
  );
}
