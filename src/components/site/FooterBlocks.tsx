"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { rampColour } from "@/lib/goldRamp";
import { mulberry32 } from "@/lib/svg";

/**
 * The fill for one of the footer's side gutters — the black either side of
 * its centred text on a wide screen, from the footer's top down to the
 * bottom bar: faint parallel diagonals, the strips between them cut into
 * blocks, and some of the blocks filled with the light's shades.
 *
 * The filled blocks spread out from the screen's edge: thickest there, and
 * steadily sparser the farther in they reach, the last few stragglers coming
 * almost up to the text. They also thin out toward the gutter's top and
 * bottom. They're always fully opaque and always whole — none is cut by the
 * gutter's top, bottom or the text's edge — so that needs the gutter's size,
 * which is measured. Only
 * the faint lines fade, toward the text (`.footer-blocks`, globals.css); the
 * screen's own edge just clips.
 *
 * The gutter runs in through the content's side padding to the text's own
 * edge, and the pattern is anchored there, so however wide the screen, the
 * nearest a block can come to the text is the same few px.
 *
 * The shades are the gold stretch of the hero name's ramp (`lib/goldRamp`),
 * spread evenly along it and never too close to a neighbour's, turned down
 * like the desk screens' mosaic (`ScreenMosaic`, the sibling pattern) — CSS
 * variables, so they follow the theme bar. Each block's fill sits inset from
 * its lines, so a dark gap like grout shows round it.
 *
 * Laid out in a frame turned 45°, where the strips are plain columns: each
 * column is cut into blocks one to three strips long. The pattern is a fixed
 * size, so it keeps its scale however wide the gutter is, and each block
 * keeps its own dice roll, so resizing only adds or drops blocks here and
 * there. The right side is the same component mirrored, with its own seed so
 * the two aren't copies.
 */

/** the pattern's size, in px — enough for the gutter on a ~2600px screen */
const PATTERN_W = 720;
const PATTERN_H = 480;
/** a strip's width, and a block's length unit, in px */
const STRIP = 24;
/** the odds of a block being filled at the screen's edge… */
const P_MAX = 0.7;
/** …easing off across the gutter, this sharply (above 1, quicker near the
 *  edge, then a long thin tail)… */
const SPREAD_POW = 1.3;
/** …to this share of that right beside the text… */
const TAIL = 0.18;
/** …and falling to none at the gutter's top and bottom, over this far (px) */
const FADE_H = 44;
/** the room a filled block always leaves to the text and to the gutter's
 *  top and bottom, in px. The nearest a block can sit to the text is 6.5px, so this lets the
 *  closest ones in. */
const CLEAR = 6;
/** a block hanging further than this past the screen's edge isn't filled */
const OVERHANG = 30;
/** how far a fill sits in from its block's lines, in px */
const INSET = 2;
/** the stretch of the ramp the shades come from: bronze to the pale highlight */
const SHADE_MIN = 0.55;
const SHADE_MAX = 1;
/** a block's shade keeps at least this share of that stretch from the block
 *  before it and the one beside it. Measured round a loop (so the stretch's
 *  two ends count as near), which keeps every shade as likely as any other —
 *  measured straight, the middle shades would come up less. */
const MIN_STEP = 0.16;
/** the share of black mixed into every fill, as on the screens' mosaic */
const DIM = 25;
/** searched for so that, across common gutter widths, the two sides match:
 *  about as many blocks, a few right beside the text, mostly short blocks, no
 *  more than three filled in a row down one strip, and shades spread evenly
 *  from dark to pale */
const SEEDS = { left: 883, right: 1186 } as const;

const K = Math.SQRT1_2;
const r2 = (v: number) => Math.round(v * 100) / 100;

/** a block of the pattern: where its fill sits in the turned frame; its
 *  reach on screen — the gap from its nearest corner to the text, how far its
 *  farthest corner is from the text, its top and bottom — and its centre; its
 *  dice roll and colour */
type Block = {
  u: number;
  v: number;
  len: number;
  gap: number;
  reach: number;
  top: number;
  bottom: number;
  fromText: number;
  cy: number;
  roll: number;
  colour: string;
};

/** whether a point of the turned frame lands on (or just off) the pattern */
function onPattern(u: number, v: number) {
  const x = (u - v) * K;
  const y = (u + v) * K;
  const pad = STRIP * 3;
  return x > -pad && x < PATTERN_W + pad && y > -pad && y < PATTERN_H + pad;
}

/** whether two places along the shade stretch (0–1) sit too close, round the loop */
function tooClose(a: number, b: number) {
  const d = Math.abs(a - b);
  return Math.min(d, 1 - d) < MIN_STEP;
}

/** the same pattern every render: the lines as one path, and every block
 *  that could be filled */
function layBlocks(seed: number) {
  const rnd = mulberry32(seed);
  // the turned frame's reach over the pattern (u along the strips' widths,
  // v along their length)
  const uMax = (PATTERN_W + PATTERN_H) * K;
  const vMin = -PATTERN_W * K;
  const vMax = PATTERN_H * K;

  const lines: string[] = [];
  const blocks: Block[] = [];
  // each strip's blocks' extents and shades, for steering clear of a neighbour's
  let prevColumn: { v0: number; v1: number; t: number }[] = [];
  for (let u = 0; u <= uMax + STRIP; u += STRIP) {
    // the strip's long edge
    lines.push(`M${r2(u)} ${r2(vMin)}V${r2(vMax)}`);
    const column: typeof prevColumn = [];
    for (let v = vMin; v < vMax; ) {
      const pick = rnd();
      const len = STRIP * (pick < 0.4 ? 1 : pick < 0.8 ? 2 : 3);
      const roll = rnd();
      const cu = u + STRIP / 2;
      const cv = v + len / 2;
      // a shade unlike the block before's and the one beside's
      const above = column.at(-1)?.t;
      const beside = prevColumn.find((b) => cv >= b.v0 && cv < b.v1)?.t;
      let t: number;
      do t = rnd();
      while (
        (above !== undefined && tooClose(t, above)) ||
        (beside !== undefined && tooClose(t, beside))
      );
      column.push({ v0: v, v1: v + len, t });
      if (onPattern(cu, cv)) {
        // the cut across the strip at the block's far end
        lines.push(`M${r2(u)} ${r2(v + len)}h${STRIP}`);
        // the fill's corners, turned onto the screen; x runs out from the
        // screen's edge, and the text sits at the pattern's far side
        const u0 = u + INSET;
        const u1 = u + STRIP - INSET;
        const v0 = v + INSET;
        const v1 = v + len - INSET;
        const shade = SHADE_MIN + (SHADE_MAX - SHADE_MIN) * t;
        blocks.push({
          u: r2(u0),
          v: r2(v0),
          len: r2(len - INSET * 2),
          gap: PATTERN_W - (u1 - v0) * K,
          reach: PATTERN_W - (u0 - v1) * K,
          top: (u0 + v0) * K,
          bottom: (u1 + v1) * K,
          fromText: PATTERN_W - (cu - cv) * K,
          cy: (cu + cv) * K,
          roll,
          colour: `color-mix(in srgb, ${rampColour(shade)} ${100 - DIM}%, #000)`,
        });
      }
      v += len;
    }
    prevColumn = column;
  }
  return { lines: lines.join(""), blocks };
}

const LAYOUTS = { left: layBlocks(SEEDS.left), right: layBlocks(SEEDS.right) };

/** eases 0 → 1 with a slow start and finish */
function smooth(t: number) {
  const k = Math.min(1, Math.max(0, t));
  return k * k * (3 - 2 * k);
}

/** whether a block is filled in a `w` × `h` gutter: whole inside it (or
 *  only just over the screen's edge), and its roll under the odds where it
 *  sits — falling off from the screen's edge to the text, and toward the
 *  gutter's top and bottom */
function isFilled(b: Block, w: number, h: number) {
  if (b.gap < CLEAR || b.top < CLEAR || b.bottom > h - CLEAR) return false;
  if (b.reach > w + OVERHANG) return false;
  // 1 at the screen's edge, 0 at the text
  const out = Math.min(1, Math.max(0, b.fromText / w));
  const across = TAIL + (1 - TAIL) * out ** SPREAD_POW;
  const down = smooth(Math.min(b.cy, h - b.cy) / FADE_H);
  return b.roll < P_MAX * across * down;
}

export default function FooterBlocks({ side }: { side: "left" | "right" }) {
  const { lines, blocks } = LAYOUTS[side];
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = Math.round(entry.contentRect.width);
      const h = Math.round(entry.contentRect.height);
      setSize((s) => (s && s.w === w && s.h === h ? s : { w, h }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const fills = useMemo(
    () => (size ? blocks.filter((b) => isFilled(b, size.w, size.h)) : []),
    [blocks, size],
  );

  // the gutter reaches 1.5rem past the content's box: through its side
  // padding (`SiteFooter`'s `sm:px-6`) to the text's edge
  return (
    <div
      ref={ref}
      aria-hidden
      className={`pointer-events-none absolute inset-y-0 hidden w-[calc((100%_-_72rem)/2_+_1.5rem)] overflow-hidden xl:block ${
        side === "left" ? "left-0" : "right-0 -scale-x-100"
      }`}
    >
      <div className="footer-blocks absolute inset-0">
        <svg width={PATTERN_W} height={PATTERN_H} className="absolute top-0 right-0">
          <path
            d={lines}
            transform="rotate(45)"
            fill="none"
            style={{ stroke: "var(--line)" }}
            strokeWidth={1}
          />
        </svg>
      </div>
      <svg width={PATTERN_W} height={PATTERN_H} className="absolute top-0 right-0">
        <g transform="rotate(45)">
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
