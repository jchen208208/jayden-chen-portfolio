import { rampColour, rampPosition } from "@/lib/goldRamp";
import { mulberry32 } from "@/lib/svg";

/**
 * The fill for one of the footer's side gutters — the black either side of
 * its centred content on a wide screen: faint parallel diagonals, the strips
 * between them cut into blocks, and some of the blocks filled with the
 * light's shades. The filled ones crowd the screen's outer edge and thin out
 * toward the content, and `.footer-blocks` (globals.css) fades the lines out
 * before they reach the text.
 *
 * The shades are the gold stretch of the hero name's ramp (`lib/goldRamp`),
 * turned down like the desk screens' mosaic (`ScreenMosaic`, the sibling
 * pattern) — CSS variables, so they follow the theme bar. Each block's fill
 * sits inset from its lines, so a dark gap like grout shows round it.
 *
 * Laid out in a frame turned 45°, where the strips are plain columns: each
 * column is cut into blocks one to three strips long. The pattern is a fixed
 * size, anchored to the screen's edge and clipped by the gutter, so it keeps
 * its scale however wide the gutter is. The right side is the same component
 * mirrored, with its own seed so the two aren't copies.
 */

/** the pattern's size, in px — enough for the gutter on a ~2600px screen */
const PATTERN_W = 720;
const PATTERN_H = 480;
/** a strip's width, and a block's length unit, in px */
const STRIP = 24;
/** the odds of a block being filled, at the screen's edge… */
const P_MAX = 0.42;
/** …falling to none this far in (px) */
const FADE_W = 440;
/** how far a fill sits in from its block's lines, in px */
const INSET = 2;
/** the share of black mixed into every fill, as on the screens' mosaic */
const DIM = 25;
const SEEDS = { left: 7, right: 19 } as const;

const K = Math.SQRT1_2;
const r2 = (v: number) => Math.round(v * 100) / 100;

type Fill = { u: number; v: number; len: number; colour: string };

/** whether a point of the turned frame lands on (or just off) the pattern */
function onPattern(u: number, v: number) {
  const x = (u - v) * K;
  const y = (u + v) * K;
  const pad = STRIP * 3;
  return x > -pad && x < PATTERN_W + pad && y > -pad && y < PATTERN_H + pad;
}

/** the same pattern every render: the lines as one path, and the filled blocks */
function layBlocks(seed: number) {
  const rnd = mulberry32(seed);
  // the turned frame's reach over the pattern (u along the strips' widths,
  // v along their length)
  const uMax = (PATTERN_W + PATTERN_H) * K;
  const vMin = -PATTERN_W * K;
  const vMax = PATTERN_H * K;

  const lines: string[] = [];
  const fills: Fill[] = [];
  for (let u = 0; u <= uMax + STRIP; u += STRIP) {
    // the strip's long edge
    lines.push(`M${r2(u)} ${r2(vMin)}V${r2(vMax)}`);
    for (let v = vMin; v < vMax; ) {
      const pick = rnd();
      const len = STRIP * (pick < 0.4 ? 1 : pick < 0.8 ? 2 : 3);
      const cu = u + STRIP / 2;
      const cv = v + len / 2;
      const edge = Math.max(0, 1 - ((cu - cv) * K) / FADE_W);
      const filled = rnd() < P_MAX * edge ** 1.6;
      const shade = rampPosition(rnd, true);
      if (onPattern(cu, cv)) {
        // the cut across the strip at the block's far end
        lines.push(`M${r2(u)} ${r2(v + len)}h${STRIP}`);
        if (filled) {
          fills.push({
            u: r2(u + INSET),
            v: r2(v + INSET),
            len: r2(len - INSET * 2),
            colour: `color-mix(in srgb, ${rampColour(shade)} ${100 - DIM}%, #000)`,
          });
        }
      }
      v += len;
    }
  }
  return { lines: lines.join(""), fills };
}

const LAYOUTS = { left: layBlocks(SEEDS.left), right: layBlocks(SEEDS.right) };

export default function FooterBlocks({ side }: { side: "left" | "right" }) {
  const { lines, fills } = LAYOUTS[side];
  return (
    <div
      aria-hidden
      className={`footer-blocks pointer-events-none absolute inset-y-0 hidden w-[calc((100%_-_72rem)/2)] overflow-hidden xl:block ${
        side === "left" ? "left-0" : "right-0 -scale-x-100"
      }`}
    >
      <svg width={PATTERN_W} height={PATTERN_H} className="absolute top-0 left-0">
        <g transform="rotate(45)">
          <path d={lines} fill="none" style={{ stroke: "var(--line)" }} strokeWidth={1} />
          {fills.map((b) => (
            <rect
              key={`${b.u}-${b.v}`}
              x={b.u}
              y={b.v}
              width={STRIP - INSET * 2}
              height={b.len}
              style={{ fill: b.colour }}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
