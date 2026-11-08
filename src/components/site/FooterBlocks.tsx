"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { rampColour } from "@/lib/goldRamp";
import { mulberry32 } from "@/lib/svg";

/**
 * The footer's background of blocks: faint parallel diagonals, the strips
 * between them cut into blocks, and some of the blocks filled with the
 * light's shades. Two parts:
 *
 * - `FooterBlocks` fills one side gutter — the black either side of the
 *   centred text on a wide screen, from the footer's top down to the bottom
 *   bar. Its filled blocks spread out from the screen's edge: thickest there,
 *   and steadily sparser the farther in they reach, the last few stragglers
 *   coming almost up to the text. The gutter runs in through the content's
 *   side padding to the text's own edge, and the pattern is anchored there,
 *   so however wide the screen, the nearest a block can come to the text is
 *   the same few px. Only its faint lines fade, toward the text
 *   (`.footer-blocks`, globals.css); the screen's own edge just clips.
 * - `FooterScatter` sprinkles a few behind the text itself — blocks only, no
 *   lines — carrying the gutters' thinning on in, so they're sparsest at the
 *   footer's middle; kept a strip's width apart so no two sit side by side,
 *   and only a few of them long — none in the middle half, behind Explore
 *   and Elsewhere, which keeps to single squares. Each half slants like its
 *   own gutter, so the footer mirrors down the middle. They may sit right
 *   under the words (a trial: the pale shades drop the grey text to under
 *   3:1 contrast, so watch for legibility).
 *
 * As the footer scrolls in, every block drifts into place, each lagging the
 * scroll by its own amount — most near the screen's edges, least at the
 * middle — and all landing as the page bottoms out (`FooterDrift`).
 *
 * Every filled block is fully opaque and whole — none is cut by the edge of
 * its area — and they thin out toward the area's top and bottom. That needs
 * each area's size, so it's measured.
 *
 * The shades are the gold stretch of the hero name's ramp (`lib/goldRamp`),
 * spread evenly along it and never too close to a neighbour's, turned down
 * like the desk screens' mosaic (`ScreenMosaic`, the sibling pattern) — CSS
 * variables, so they follow the theme bar. Each block's fill sits inset from
 * its lines, so a dark gap like grout shows round it.
 *
 * Laid out in a frame turned 45°, where the strips are plain columns: each
 * column is cut into blocks one to three strips long. Each pattern is a fixed
 * size, so it keeps its scale however wide its area is, and each block keeps
 * its own dice roll, so resizing only adds or drops blocks here and there.
 * The right gutter is the left one's component mirrored, with its own seed so
 * the two aren't copies.
 */

/** a gutter's pattern width, in px — enough for the gutter on a ~2600px screen */
const GUTTER_W = 720;
/** the text's width (`max-w-6xl` less its `px-6` padding: 72rem − 3rem), in
 *  px, and the middle pattern's — a touch wider, to cover it */
const TEXT_W = 1104;
const MIDDLE_W = 1120;
/** every pattern's height, in px */
const PATTERN_H = 480;
/** a strip's width, and a block's length unit, in px */
const STRIP = 24;
/** in the gutters, the odds of a block being filled at the screen's edge… */
const P_MAX = 0.7;
/** …easing off across the gutter, this sharply (above 1, quicker near the
 *  edge, then a long thin tail)… */
const SPREAD_POW = 1.3;
/** …to this share of that right beside the text */
const TAIL = 0.18;
/** behind the text, the odds of a block being filled at the text's edges,
 *  carrying on from the gutters… */
const P_MIDDLE = 0.18;
/** …thinning toward the footer's middle, this sharply… */
const MIDDLE_POW = 1.5;
/** …to this share of that at the very middle… */
const MIDDLE_FLOOR = 0.1;
/** …so long as it keeps at least this far (px) from every block already
 *  filled there — tried lowest roll first — so none sit side by side… */
const SPACING = 24;
/** …and no more than this many of the longest (three-strip) blocks… */
const MAX_LONG = 3;
/** …and only single squares in the middle stretch of the text: where a
 *  block's distance from the footer's middle is under this share of the way
 *  to the text's edge (0.5 = the middle half — behind Explore and Elsewhere) */
const SINGLES_ONLY = 0.5;
/** everywhere, the odds fall to none at the area's top and bottom, over
 *  this far (px) */
const FADE_H = 44;
/** the room a filled block always leaves to its area's edges, in px. The nearest a gutter's block can sit to the text is 6.5px,
 *  so this lets the closest ones in. */
const CLEAR = 6;
/** a gutter's block hanging further than this past the screen's edge isn't
 *  filled */
const OVERHANG = 30;
/** how far a fill sits in from its block's lines, in px */
const INSET = 2;
/** as the footer scrolls in, how far (px) a block at the screen's edge
 *  starts above its place (`FooterDrift`). It all plays out over the
 *  footer's ~300px of scroll, so it has to be this big to read — 60 went
 *  unnoticed… */
const DRIFT_MAX = 100;
/** …a block beside the text, this share of that (and less toward the
 *  footer's middle)… */
const DRIFT_TEXT = 0.4;
/** …each varied by up to this share, so neighbours drift apart */
const DRIFT_JITTER = 0.4;
/** how long (s) a block takes to catch up with the scroll — between these,
 *  block to block — so it keeps gliding after a fast scroll stops */
const DRIFT_SETTLE = [0.6, 1.2] as const;
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
/** searched for so that, across common widths, the two gutters match —
 *  about as many blocks, a few right beside the text, mostly short blocks, no
 *  more than three filled in a row down one strip, and shades spread evenly
 *  from dark to pale — and the middle's blocks split evenly between its two
 *  sides, mostly single, in every shade */
const SEEDS = { left: 883, right: 1186, middle: 846 } as const;

const K = Math.SQRT1_2;
const r2 = (v: number) => Math.round(v * 100) / 100;

/** a block of a pattern: how many strips long it is and where its fill sits
 *  in the turned frame; its box and centre on screen, x running from the
 *  pattern's left edge; its dice roll and colour */
type Block = {
  strips: number;
  u: number;
  v: number;
  len: number;
  x0: number;
  x1: number;
  top: number;
  bottom: number;
  cx: number;
  cy: number;
  roll: number;
  colour: string;
};

/** whether two places along the shade stretch (0–1) sit too close, round the loop */
function tooClose(a: number, b: number) {
  const d = Math.abs(a - b);
  return Math.min(d, 1 - d) < MIN_STEP;
}

/** the same pattern every render, `width` × `PATTERN_H`: the lines as one
 *  path, and every block that could be filled */
function layBlocks(seed: number, width: number) {
  const rnd = mulberry32(seed);
  // the turned frame's reach over the pattern (u along the strips' widths,
  // v along their length)
  const uMax = (width + PATTERN_H) * K;
  const vMin = -width * K;
  const vMax = PATTERN_H * K;
  /** whether a point of the turned frame lands on (or just off) the pattern */
  const onPattern = (u: number, v: number) => {
    const x = (u - v) * K;
    const y = (u + v) * K;
    const pad = STRIP * 3;
    return x > -pad && x < width + pad && y > -pad && y < PATTERN_H + pad;
  };

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
        // the fill's corners, turned onto the screen
        const u0 = u + INSET;
        const u1 = u + STRIP - INSET;
        const v0 = v + INSET;
        const v1 = v + len - INSET;
        const shade = SHADE_MIN + (SHADE_MAX - SHADE_MIN) * t;
        blocks.push({
          strips: len / STRIP,
          u: r2(u0),
          v: r2(v0),
          len: r2(len - INSET * 2),
          x0: (u0 - v1) * K,
          x1: (u1 - v0) * K,
          top: (u0 + v0) * K,
          bottom: (u1 + v1) * K,
          cx: (cu - cv) * K,
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

const LAYOUTS = {
  left: layBlocks(SEEDS.left, GUTTER_W),
  right: layBlocks(SEEDS.right, GUTTER_W),
  middle: layBlocks(SEEDS.middle, MIDDLE_W),
};
/** the middle's blocks in the order they're tried for filling, lowest roll first */
const MIDDLE_ORDER = [...LAYOUTS.middle.blocks].sort((a, b) => a.roll - b.roll);

/** eases 0 → 1 with a slow start and finish */
function smooth(t: number) {
  const k = Math.min(1, Math.max(0, t));
  return k * k * (3 - 2 * k);
}

/** how the odds fall off toward an area's top and bottom (1 → 0) */
const downFrom = (b: Block, h: number) => smooth(Math.min(b.cy, h - b.cy) / FADE_H);

/** whether a gutter's block is filled in a `w` × `h` gutter: whole inside it
 *  (or only just over the screen's edge), and its roll under the odds where
 *  it sits — falling off from the screen's edge to the text, and toward the
 *  gutter's top and bottom. The pattern's right edge is the text's. */
function isFilledGutter(b: Block, w: number, h: number) {
  const gap = GUTTER_W - b.x1;
  if (gap < CLEAR || b.top < CLEAR || b.bottom > h - CLEAR) return false;
  if (GUTTER_W - b.x0 > w + OVERHANG) return false;
  // 1 at the screen's edge, 0 at the text
  const out = Math.min(1, Math.max(0, (GUTTER_W - b.cx) / w));
  const across = TAIL + (1 - TAIL) * out ** SPREAD_POW;
  return b.roll < P_MAX * across * downFrom(b, h);
}

/** the middle's filled blocks in a `w` × `h` area: tried lowest roll first,
 *  each filled if it's whole inside the area, its roll is under the odds
 *  where it sits — thinning from the text's edges toward the footer's middle,
 *  and toward the top and bottom — it keeps `SPACING` from every block
 *  already filled, it isn't one long block too many, and it's a single
 *  square if it's in the middle stretch */
function fillMiddle(w: number, h: number) {
  const fills: Block[] = [];
  let long = 0;
  const tooNear = (b: Block, f: Block) =>
    b.x1 + SPACING > f.x0 && b.x0 - SPACING < f.x1 && b.bottom + SPACING > f.top && b.top - SPACING < f.bottom;
  for (const b of MIDDLE_ORDER) {
    if (b.x0 < CLEAR || b.x1 > w - CLEAR || b.top < CLEAR || b.bottom > h - CLEAR) continue;
    // 1 at the text's edges, 0 at the footer's middle
    const edge = Math.abs(b.cx - w / 2) / (w / 2);
    const across = MIDDLE_FLOOR + (1 - MIDDLE_FLOOR) * edge ** MIDDLE_POW;
    if (b.roll >= P_MIDDLE * across * downFrom(b, h)) continue;
    if (b.strips === 3 && long >= MAX_LONG) continue;
    if (b.strips > 1 && edge < SINGLES_ONLY) continue;
    if (fills.some((f) => tooNear(b, f))) continue;
    fills.push(b);
    if (b.strips === 3) long++;
  }
  return fills;
}

/** the size of `ref`'s element, kept up to date as it resizes */
function useSize(ref: RefObject<HTMLDivElement | null>) {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      const w = Math.round(r.width);
      const h = Math.round(r.height);
      setSize((s) => (s && s.w === w && s.h === h ? s : { w, h }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

/** a steady 0–1 for a block, from where it sits — so each drifts by its own
 *  amount without drawing on (and so reshuffling) the seeded dice */
function jitterOf(b: Block) {
  const x = Math.sin(b.u * 12.9898 + b.v * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/** how far (px) a block starts above its place: `reach` (0–1, its share of
 *  the full drift), varied a little block to block */
const driftOf = (b: Block, reach: number) =>
  r2(DRIFT_MAX * reach * (1 - DRIFT_JITTER + DRIFT_JITTER * jitterOf(b)));

/** a block's drift as a style — it reads the footer's `--drift` (1 → 0 as
 *  the footer scrolls in; set by `FooterDrift`), so one variable moves them
 *  all, each by its own amount. Each also eases after it over its own
 *  `DRIFT_SETTLE` time, so a fast scroll doesn't snap them into place: they
 *  keep floating there, one after another, after the page has stopped. */
const driftStyle = (px: number, b: Block) => {
  const [lo, hi] = DRIFT_SETTLE;
  const settle = r2(lo + (hi - lo) * jitterOf(b));
  return {
    transform: `translateY(calc(var(--drift, 0) * ${-px}px))`,
    transition: `transform ${settle}s cubic-bezier(0.22, 1, 0.36, 1)`,
  };
};

/** the filled blocks as SVG, in a `width`-wide pattern, each in its own
 *  group so it drifts up and down the screen (the group isn't turned). The
 *  SVG is only as tall as its area (`h-full`) — taller, its empty bottom
 *  hung past the page's end and let it scroll on below the footer — and
 *  doesn't clip, so a block drifting in from above still shows. */
function Fills({
  width,
  fills,
  driftPx,
  className,
}: {
  width: number;
  fills: Block[];
  driftPx: (b: Block) => number;
  className: string;
}) {
  return (
    <svg width={width} overflow="visible" className={`h-full ${className}`}>
      {fills.map((b) => (
        <g key={`${b.u}-${b.v}`} style={driftStyle(driftPx(b), b)}>
          <rect
            transform="rotate(45)"
            x={b.u}
            y={b.v}
            width={STRIP - INSET * 2}
            height={b.len}
            style={{ fill: b.colour }}
          />
        </g>
      ))}
    </svg>
  );
}

export default function FooterBlocks({ side }: { side: "left" | "right" }) {
  const { lines, blocks } = LAYOUTS[side];
  const ref = useRef<HTMLDivElement>(null);
  const size = useSize(ref);

  const fills = useMemo(
    () => (size ? blocks.filter((b) => isFilledGutter(b, size.w, size.h)) : []),
    [blocks, size],
  );
  // more near the screen's edge, down to `DRIFT_TEXT` of that beside the text
  const driftPx = (b: Block) => {
    const out = size ? Math.min(1, Math.max(0, (GUTTER_W - b.cx) / size.w)) : 0;
    return driftOf(b, DRIFT_TEXT + (1 - DRIFT_TEXT) * out);
  };

  // the gutter reaches 1.5rem past the content's box: through its side
  // padding (`SiteFooter`'s `sm:px-6`) to the text's edge, where the pattern
  // is anchored (`right-0`, mirrored on the right). It clips only sideways,
  // so a block drifting in from above isn't cut at the footer's top; the
  // faint lines are clipped to it all round.
  return (
    <div
      ref={ref}
      aria-hidden
      className={`pointer-events-none absolute inset-y-0 hidden w-[calc((100%_-_72rem)/2_+_1.5rem)] overflow-x-clip xl:block ${
        side === "left" ? "left-0" : "right-0 -scale-x-100"
      }`}
    >
      <div className="footer-blocks absolute inset-0 overflow-hidden">
        <svg width={GUTTER_W} height={PATTERN_H} className="absolute top-0 right-0">
          <path
            d={lines}
            transform="rotate(45)"
            fill="none"
            style={{ stroke: "var(--line)" }}
            strokeWidth={1}
          />
        </svg>
      </div>
      <Fills width={GUTTER_W} fills={fills} driftPx={driftPx} className="absolute top-0 right-0" />
    </div>
  );
}

/** a sparse scatter of blocks behind the footer's text — placed before the
 *  text in the page, so the text paints over it.
 *
 *  The footer reads as two mirrored halves: the left gutter's blocks slant
 *  one way and the right's, mirrored, the other. So each block here is drawn
 *  about its own centre, turned to match its half's gutter — the pattern's
 *  own way left of the middle, flipped right of it. A block flipped in place
 *  keeps its footprint, so it stays whole and spaced. */
export function FooterScatter() {
  const ref = useRef<HTMLDivElement>(null);
  const size = useSize(ref);

  const fills = useMemo(() => (size ? fillMiddle(size.w, size.h) : []), [size]);

  // the text's own width, centred, so the pattern's left edge is the text's.
  // Clipped only sideways, like the gutters, so drifting blocks aren't cut.
  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-y-0 inset-x-0 mx-auto hidden overflow-x-clip xl:block"
      style={{ width: TEXT_W }}
    >
      <svg width={MIDDLE_W} overflow="visible" className="absolute top-0 left-0 h-full">
        {size &&
          fills.map((b) => {
            // carrying on from the gutters' drift beside the text, and
            // stillest at the footer's middle
            const edge = Math.abs(b.cx - size.w / 2) / (size.w / 2);
            return (
              <g key={`${b.u}-${b.v}`} style={driftStyle(driftOf(b, DRIFT_TEXT * edge), b)}>
                <rect
                  x={-(STRIP / 2 - INSET)}
                  y={-b.len / 2}
                  width={STRIP - INSET * 2}
                  height={b.len}
                  transform={`translate(${r2(b.cx)} ${r2(b.cy)}) rotate(${b.cx > size.w / 2 ? -45 : 45})`}
                  style={{ fill: b.colour }}
                />
              </g>
            );
          })}
      </svg>
    </div>
  );
}

/**
 * Drives the blocks' drift. As the footer scrolls into view — from its top
 * entering at the bottom of the screen to the page's end — it writes how far
 * the footer still has to come (1 → 0, eased out: falling fastest as the
 * footer appears, settling gently at the end) to `--drift` on the footer.
 * Each block starts that share of its own drift above its place, so the
 * blocks lag behind the scroll — hardest just as they come into view — each
 * at its own speed, and the footer catches them up until all of them land
 * together as the page bottoms out. Lenis (`SmoothScroll`) smooths the
 * scroll it reads, and each block eases after it (`DRIFT_SETTLE`), so the
 * drift glides even after a fast flick. Held still under
 * `prefers-reduced-motion`.
 */
export function FooterDrift() {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const footer = ref.current?.closest("footer");
    if (!footer) return;
    if (reduced) {
      footer.style.setProperty("--drift", "0");
      return;
    }
    let raf = 0;
    const apply = () => {
      raf = 0;
      const r = footer.getBoundingClientRect();
      const come = Math.min(1, Math.max(0, (window.innerHeight - r.top) / r.height));
      footer.style.setProperty("--drift", ((1 - come) ** 2).toFixed(4));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };
    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [reduced]);

  return <span ref={ref} hidden />;
}
