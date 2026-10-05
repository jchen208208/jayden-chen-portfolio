import type { CSSProperties } from "react";

/**
 * A section title drawn as copper on a circuit board: each letter is a gold
 * trace on the black page, its corners cut at 45° the way a real trace is
 * routed, and every loose end finished in a round through-hole pad. The
 * traces route themselves in once when the title appears (`.pcb-title` in
 * globals.css), letter after letter, and each end pad lands as its trace
 * reaches it. Then it holds still.
 *
 * A few strokes carry a surface-mount part, drawn the way KiCad's PCB editor
 * shows its footprint: two rounded-rectangle copper pads with the trace
 * running into each, and the silkscreen around them in white — a resistor or
 * capacitor's two short body marks, an LED's outline wrapped round its
 * cathode end. No reference designators: they read as labels, not as board.
 * The parts vary in size and direction so the board doesn't look stamped out.
 *
 * Gold here is the hero name's: a deep bronze-gold for the copper and the
 * site's amber light (`--glow`) for the pads.
 *
 * A couple of corners carry a via too.
 *
 * Letters are drawn on a 100-unit-tall grid, `C` units per chamfer.
 */

const C = 14;
const LETTER_GAP = 34;
const TRACE_W = 9;
const PAD_R = 9.5;
const HOLE_R = 3.5;
/** a via: the small plated hole that carries a trace between layers —
 *  a thinner ring and a smaller drill than a through-hole pad */
const VIA_R = 6;
const VIA_HOLE_R = 2.4;
/** room around the outermost pads */
const MARGIN = PAD_R + 4;
/** each letter starts this long after the one before it */
const STAGGER_MS = 110;
const ROUTE_MS = 700;
/** a beat before the first trace, so it starts on a title already in view */
const START_MS = 250;

/** two real chip sizes: pad size across and along the stroke, and how far
 *  each pad's centre sits from the part's centre */
const FOOTPRINTS = {
  "0805": { across: 22, along: 15, offset: 14, radius: 3.75 },
  "0603": { across: 17, along: 12, offset: 11, radius: 3 },
};
/** the silkscreen: line weight, how far out from the pads it sits, and how
 *  long a resistor's / capacitor's body marks are */
const SILK = { width: 2, out: 4, half: 4.5 };

type Pt = [number, number];
/** one trace, as its corner points; `ends` says which ends get a pad — a
 *  trace that runs into another one (a bowl meeting its stem) or into a
 *  part's pad has none there */
type Trace = { pts: Pt[]; ends: "both" | "start" | "none" };
/** a two-pad part centred at (x, y), turned `angle` degrees from upright
 *  (0 runs down a vertical stroke, 90 along a horizontal one, -45 down a ↘
 *  diagonal). `ref` is only its identity in the drawing — it isn't printed. */
type Part = {
  ref: string;
  x: number;
  y: number;
  angle: number;
  size: keyof typeof FOOTPRINTS;
  silk: "body" | "led";
};
/** `vias` sit on the trace, at a corner's chamfer */
type Glyph = { w: number; traces: Trace[]; parts?: Part[]; vias?: Pt[] };

/** the point `dist` along a part's axis from its centre — where a trace
 *  split by the part stops at its pad */
function alongPart(p: Pick<Part, "x" | "y" | "angle">, dist: number): Pt {
  const a = (p.angle * Math.PI) / 180;
  const r = (n: number) => Math.round(n * 100) / 100;
  return [r(p.x - Math.sin(a) * dist), r(p.y + Math.cos(a) * dist)];
}

/** P's and R's shared stem and bowl: up from a pad at the foot, round the
 *  bowl and back into the stem */
const BOWL_W = 60;
const BOWL: Trace = {
  pts: [
    [0, 100],
    [0, C],
    [C, 0],
    [BOWL_W - C, 0],
    [BOWL_W, C],
    [BOWL_W, 50 - C],
    [BOWL_W - C, 50],
    [0, 50],
  ],
  ends: "start",
};

/** P, with a via on its top-right corner */
const P: Glyph = { w: BOWL_W, traces: [BOWL], vias: [[BOWL_W - C / 2, C / 2]] };

/** R: the bowl plus a long 45° leg down from it, a part sitting on the leg */
const R_PART: Part = { ref: "C1", x: 35, y: 75, angle: -45, size: "0603", silk: "body" };
const R: Glyph = {
  w: BOWL_W,
  traces: [
    BOWL,
    { pts: [[BOWL_W, 100], alongPart(R_PART, FOOTPRINTS["0603"].offset)], ends: "start" },
    { pts: [alongPart(R_PART, -FOOTPRINTS["0603"].offset), [10, 50]], ends: "none" },
  ],
  parts: [R_PART],
};

/** O: one closed loop, with a via on its bottom-right corner */
const O_W = 60;
const O: Glyph = {
  w: O_W,
  traces: [
    {
      pts: [
        [C, 0],
        [O_W - C, 0],
        [O_W, C],
        [O_W, 100 - C],
        [O_W - C, 100],
        [C, 100],
        [0, 100 - C],
        [0, C],
        [C, 0],
      ],
      ends: "none",
    },
  ],
  vias: [[O_W - C / 2, 100 - C / 2]],
};

const J: Glyph = {
  w: 50,
  traces: [
    {
      pts: [
        [50, 0],
        [50, 100 - C],
        [50 - C, 100],
        [C, 100],
        [0, 100 - C],
        [0, 64],
      ],
      ends: "both",
    },
  ],
};

/** the open side of E and C: top bar, back, bottom bar */
const bracket = (w: number): Pt[] => [
  [w, 0],
  [C, 0],
  [0, C],
  [0, 100 - C],
  [C, 100],
  [w, 100],
];

/** E, a resistor in the top half of its back — the smaller 0603, as that
 *  half is short. Its middle bar runs into the lower part of the back. */
const E_W = 56;
const E_PART: Part = { ref: "R1", x: 0, y: 31, angle: 0, size: "0603", silk: "body" };
const E: Glyph = {
  w: E_W,
  traces: [
    { pts: [...bracket(E_W).slice(0, 3), alongPart(E_PART, -FOOTPRINTS["0603"].offset)], ends: "start" },
    {
      pts: [...bracket(E_W).slice(3).reverse(), alongPart(E_PART, FOOTPRINTS["0603"].offset)],
      ends: "start",
    },
    { pts: [[46, 50], [0, 50]], ends: "start" },
  ],
  parts: [E_PART],
};

const CL: Glyph = { w: 56, traces: [{ pts: bracket(56), ends: "both" }] };

/** T, an LED partway down its stem; the stem's top half runs into the bar */
const T_W = 60;
const T_PART: Part = { ref: "D1", x: T_W / 2, y: 55, angle: 0, size: "0603", silk: "led" };
const T: Glyph = {
  w: T_W,
  traces: [
    { pts: [[0, 0], [T_W, 0]], ends: "both" },
    { pts: [[T_W / 2, 100], alongPart(T_PART, FOOTPRINTS["0603"].offset)], ends: "start" },
    { pts: [alongPart(T_PART, -FOOTPRINTS["0603"].offset), [T_W / 2, 0]], ends: "none" },
  ],
  parts: [T_PART],
};

const SW = 64;
const S: Glyph = {
  w: SW,
  traces: [
    {
      pts: [
        [SW, 0],
        [C, 0],
        [0, C],
        [0, 50 - C],
        [C, 50],
        [SW - C, 50],
        [SW, 50 + C],
        [SW, 100 - C],
        [SW - C, 100],
        [0, 100],
      ],
      ends: "both",
    },
  ],
};

/** "PROJECTS": a part on R's diagonal leg, a resistor up E's back and an LED
 *  down T's stem; vias on a corner of P and of O */
export const PROJECTS_BOARD: Glyph[] = [P, R, O, J, E, CL, T, S];

/** the letters, each with its x offset, and the total width */
function layout(glyphs: Glyph[]) {
  let x = 0;
  const placed = glyphs.map((g) => {
    const at = x;
    x += g.w + LETTER_GAP;
    return { g, at };
  });
  return { placed, width: x - LETTER_GAP };
}

const d = (pts: Pt[]) => pts.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ");

function Via({ p, delay }: { p: Pt; delay: number }) {
  return (
    <g className="pcb-pad" style={{ animationDelay: `${delay}ms` }}>
      <circle cx={p[0]} cy={p[1]} r={VIA_R} fill="var(--glow, #ffbe5c)" />
      <circle cx={p[0]} cy={p[1]} r={VIA_HOLE_R} fill="var(--paper, #000)" />
    </g>
  );
}

function ThroughPad({ p, delay }: { p: Pt; delay: number }) {
  return (
    <g className="pcb-pad" style={{ animationDelay: `${delay}ms` }}>
      <circle cx={p[0]} cy={p[1]} r={PAD_R} fill="var(--glow, #ffbe5c)" />
      <circle cx={p[0]} cy={p[1]} r={HOLE_R} fill="var(--paper, #000)" />
    </g>
  );
}

/** drawn upright about (x, y), then turned to the part's angle */
function SmdPart({ part, delay }: { part: Part; delay: number }) {
  const { x, y } = part;
  const fp = FOOTPRINTS[part.size];
  const side = fp.across / 2 + SILK.out;
  // the LED's outline: up both sides from just past the middle, and across
  // above the cathode pad
  const top = y - fp.offset - fp.along / 2 - SILK.out;
  const silk =
    part.silk === "led" ? (
      <polyline
        points={`${x - side},${y + 3} ${x - side},${top} ${x + side},${top} ${x + side},${y + 3}`}
      />
    ) : (
      [-1, 1].map((s) => (
        <line key={s} x1={x + s * side} y1={y - SILK.half} x2={x + s * side} y2={y + SILK.half} />
      ))
    );
  return (
    <g transform={part.angle ? `rotate(${part.angle} ${x} ${y})` : undefined}>
      {[-1, 1].map((s) => (
        <rect
          key={s}
          className="pcb-pad"
          style={{ animationDelay: `${delay}ms` }}
          x={x - fp.across / 2}
          y={y + s * fp.offset - fp.along / 2}
          width={fp.across}
          height={fp.along}
          rx={fp.radius}
          fill="var(--glow, #ffbe5c)"
        />
      ))}
      <g
        className="pcb-silk"
        style={{ animationDelay: `${delay + 120}ms` }}
        stroke="var(--ink, #f4f6f8)"
        strokeWidth={SILK.width}
      >
        {silk}
      </g>
    </g>
  );
}

export default function PcbTitle({
  glyphs,
  label,
  className,
  style,
}: {
  glyphs: Glyph[];
  /** what the title says, for screen readers */
  label: string;
  className?: string;
  style?: CSSProperties;
}) {
  const { placed, width } = layout(glyphs);

  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`${-MARGIN} ${-MARGIN} ${width + 2 * MARGIN} ${100 + 2 * MARGIN}`}
      className={`pcb-title ${className ?? ""}`}
      style={style}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {placed.map(({ g, at }, i) => {
        const start = START_MS + i * STAGGER_MS;
        return (
          <g key={i} transform={`translate(${at} 0)`}>
            {g.traces.map((t, j) => (
              <path
                key={j}
                className="pcb-trace"
                d={d(t.pts)}
                pathLength={100}
                stroke="#c18a2e"
                strokeWidth={TRACE_W}
                style={{ animationDelay: `${start}ms`, animationDuration: `${ROUTE_MS}ms` }}
              />
            ))}
            {/* pads drawn over the traces, so each trace runs into its pad */}
            {g.traces.flatMap((t, j) => [
              ...(t.ends !== "none" ? [<ThroughPad key={`${j}s`} p={t.pts[0]} delay={start} />] : []),
              ...(t.ends === "both"
                ? [<ThroughPad key={`${j}e`} p={t.pts[t.pts.length - 1]} delay={start + ROUTE_MS * 0.85} />]
                : []),
            ])}
            {g.vias?.map((v) => (
              <Via key={v.join()} p={v} delay={start + ROUTE_MS * 0.5} />
            ))}
            {/* parts land as the traces reach them */}
            {g.parts?.map((p) => (
              <SmdPart key={p.ref} part={p} delay={start + ROUTE_MS * 0.6} />
            ))}
          </g>
        );
      })}
    </svg>
  );
}
