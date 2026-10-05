"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { mulberry32 } from "@/lib/svg";
import { playPeel, playSlap } from "@/lib/stickerSound";
import { SKILLS_BOX_ITEMS, SKILLS_BOX_TITLES, type SkillItem } from "../skillItems";
import type { CardLayout, CardOptions, SectionCard } from "./shared";

/**
 * Skills is a cutting mat with stickers on it (after events.ycombinator.com/
 * waterloo-2026). Under the header, a dark self-healing mat — grid, ruler
 * numbers round the edge, 30°/45°/60° guides — and on it the three groups,
 * each a label with its skills stuck around it as die-cut stickers:
 *
 *   ┌──────────────────────────────────────────────────────┐
 *   │                    ◉    ◉                             │
 *   │                 ◉  LANGUAGES  ◉                       │
 *   │                    ◉    ◉                             │
 *   │      ◉   ◉                               ◉            │
 *   │   ◉ FRAMEWORKS & TOOLS ◉        HARDWARE & DESIGN     │
 *   │      ◉   ◉                          ◉        ◉        │
 *   └──────────────────────────────────────────────────────┘
 *
 * Every sticker can be peeled off and dropped anywhere on the screen, with a
 * peel and a slap (`stickerSound`). Where they've been moved isn't kept, so a
 * reload puts everything back.
 *
 * Stickers keep to the colour rule (top of globals.css): the logo is printed
 * in black on a white die-cut sticker — the white border is an SVG filter
 * (`StickerCut`) that grows a rounded outline from the logo's own shape.
 *
 * Layout is in a fixed design space scaled to the mat (`--s`, from container
 * query units), so it holds at any size with no measuring: each group sits at
 * a fixed share of the mat, its stickers on an ellipse round the label. The
 * stacked page (phones, deep links) stacks the three groups down a tall mat.
 */

/** design space the overlay's layout is drawn in — scaled down to fit the mat */
const ROW_DESIGN = { w: 1400, h: 560 };
/** the stacked mat's design width, and its height in the same units */
const STACK_DESIGN = { w: 560, h: 1100 };
const STICKER = 78;
/** how far the icon sits in from the sticker's edge, as a share of it */
const DEFAULT_INSET = 0.1;
/** extra tilt while a sticker is held */
const LIFT_TILT = 4;
/** a dragged sticker stays this far inside the screen edge (px) */
const EDGE = 4;

/** where each group sits on the mat: `cx`/`cy` as % of the mat, `dx` a
 *  nudge in design units — and the ellipse its stickers ring round on */
type Spot = { cx: number; cy: number; dx: number };
const LAYOUTS: Record<CardLayout, { spots: Spot[]; rx: number; ry: number }> = {
  // Languages top centre, the other two in the bottom corners
  row: {
    spots: [
      { cx: 50, cy: 30, dx: 0 },
      { cx: 20, cy: 70, dx: 0 },
      { cx: 80, cy: 70, dx: 0 },
    ],
    rx: 240,
    ry: 108,
  },
  // one under another, each knocked a little off centre
  stack: {
    spots: [
      { cx: 50, cy: 17.5, dx: -40 },
      { cx: 50, cy: 50, dx: 40 },
      { cx: 50, cy: 82.5, dx: -20 },
    ],
    rx: 175,
    ry: 130,
  },
};

const GROUPS = SKILLS_BOX_TITLES.map((title, g) => ({ title, items: SKILLS_BOX_ITEMS[g] }));

/** each sticker's place on its group's ellipse — evenly round from the top,
 *  each knocked a little off its spot and tilted, from a fixed seed so the
 *  server and the browser agree */
const SCATTER = GROUPS.map((group, g) => {
  const rnd = mulberry32(101 + g * 17);
  const jitter = () => rnd() * 2 - 1;
  return group.items.map((_, i) => ({
    angle: ((-90 + (360 / group.items.length) * i + jitter() * 8) * Math.PI) / 180,
    reach: 1 + jitter() * 0.06,
    tilt: Math.round(jitter() * 11 * 10) / 10,
  }));
});

const r2 = (n: number) => Math.round(n * 100) / 100;
/** a length in design units, scaled to the mat */
const ds = (n: number) => `calc(${r2(n)} * var(--s))`;

/* ── the mat ─────────────────────────────────────────────────────────────── */

const GRID_MINOR = "rgba(255,255,255,0.05)";
const GRID_MAJOR = "rgba(255,255,255,0.1)";
const RULE = "rgba(255,255,255,0.3)";
const GUIDE = "rgba(255,255,255,0.12)";
const NUMERAL = "var(--ink-faint, rgba(255,255,255,0.4))";
const MONO = "var(--font-mono), ui-monospace, monospace";

/** A self-healing cutting mat, drawn to the board's measured size: a ruled
 *  area inset from the edge, a 1-unit grid with half-unit lines, ticks every
 *  tenth of a unit round the ruled area (longer at halves and wholes), whole
 *  units numbered along every edge, and angle guides rising from the
 *  bottom-left corner. */
function Mat({ w, h, unit, band }: { w: number; h: number; unit: number; band: number }) {
  const patternId = `mat-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const clipId = `${patternId}-clip`;
  const x0 = band;
  const y0 = band;
  const x1 = w - band;
  const y1 = h - band;
  if (x1 - x0 < unit || y1 - y0 < unit) return null;

  const tick = unit / 10;
  const tickLen = (i: number) => (i % 10 === 0 ? 9 : i % 5 === 0 ? 6 : 3.5);
  let ticks = "";
  for (let i = 0; x0 + i * tick <= x1 + 0.01; i++) {
    const x = r2(x0 + i * tick);
    ticks += `M${x} ${y0}v${-tickLen(i)}M${x} ${y1}v${tickLen(i)}`;
  }
  for (let i = 0; y1 - i * tick >= y0 - 0.01; i++) {
    const y = r2(y1 - i * tick);
    ticks += `M${x0} ${y}h${-tickLen(i)}M${x1} ${y}h${tickLen(i)}`;
  }
  const cols = Math.floor((x1 - x0) / unit + 0.01);
  const rows = Math.floor((y1 - y0) / unit + 0.01);
  const numeral = { fill: NUMERAL, fontFamily: MONO, fontSize: 10 } as const;
  const reach = w + h;

  return (
    <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" width={w} height={h}>
      <defs>
        <pattern id={patternId} patternUnits="userSpaceOnUse" x={x0} y={y0} width={unit} height={unit}>
          <path d={`M${unit / 2} 0V${unit}M0 ${unit / 2}H${unit}`} stroke={GRID_MINOR} strokeWidth={1} />
          <path d={`M0.5 0V${unit}M0 0.5H${unit}`} stroke={GRID_MAJOR} strokeWidth={1} />
        </pattern>
        <clipPath id={clipId}>
          <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} />
        </clipPath>
      </defs>
      <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill={`url(#${patternId})`} />
      <g clipPath={`url(#${clipId})`} stroke={GUIDE} strokeWidth={1}>
        {[30, 45, 60].map((deg) => {
          const a = (deg * Math.PI) / 180;
          return <path key={deg} d={`M${x0} ${y1}L${r2(x0 + Math.cos(a) * reach)} ${r2(y1 - Math.sin(a) * reach)}`} />;
        })}
      </g>
      {[30, 45, 60].map((deg) => {
        // labelled just under the top rule, where there's room
        const a = (deg * Math.PI) / 180;
        const y = y0 + unit * 1.3;
        const x = x0 + (y1 - y) / Math.tan(a);
        return x < x1 - 40 ? (
          <text key={deg} x={r2(x + 8)} y={r2(y)} {...numeral}>
            {deg}°
          </text>
        ) : null;
      })}
      <rect x={x0 + 0.5} y={y0 + 0.5} width={x1 - x0 - 1} height={y1 - y0 - 1} fill="none" stroke={RULE} />
      <path d={ticks} stroke={RULE} strokeWidth={1} />
      <g {...numeral} textAnchor="middle">
        {Array.from({ length: cols + 1 }, (_, k) => (
          <g key={k}>
            <text x={r2(x0 + k * unit)} y={y0 - 13}>
              {k}
            </text>
            <text x={r2(x0 + k * unit)} y={y1 + 21}>
              {k}
            </text>
          </g>
        ))}
        {Array.from({ length: rows }, (_, k) => (
          <g key={k} dominantBaseline="central">
            <text x={x0 - 18} y={r2(y1 - (k + 1) * unit)}>
              {k + 1}
            </text>
            <text x={x1 + 18} y={r2(y1 - (k + 1) * unit)}>
              {k + 1}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}

/* ── stickers ────────────────────────────────────────────────────────────── */

/** The die-cut: the logo's own shape, closed up (holes and notches smaller
 *  than `close` filled), softened and re-cut a few px outside itself —
 *  that's the white sticker — with the logo printed on top. Rounded corners
 *  come from cutting a blur rather than growing the shape square. */
function StickerCut({ id, close, blur }: { id: string; close: number; blur: number }) {
  return (
    <svg aria-hidden width="0" height="0" className="absolute">
      <filter id={id} x="-30%" y="-30%" width="160%" height="160%" colorInterpolationFilters="sRGB">
        <feMorphology in="SourceAlpha" operator="dilate" radius={close} result="grown" />
        <feMorphology in="grown" operator="erode" radius={close} result="closed" />
        <feGaussianBlur in="closed" stdDeviation={blur} result="soft" />
        <feComponentTransfer in="soft" result="cut">
          <feFuncA type="linear" slope="22" intercept="-0.6" />
        </feComponentTransfer>
        <feFlood floodColor="#ffffff" />
        <feComposite in2="cut" operator="in" result="paper" />
        <feMerge>
          <feMergeNode in="paper" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </svg>
  );
}

type Drag = { id: number; sx: number; sy: number; ox: number; oy: number; minX: number; maxX: number; minY: number; maxY: number };

const clampTo = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), hi);

/** One sticker. It's moved with `translate` straight on the element while
 *  dragging (no re-render per pointer move); React only hears about the pick
 *  up and the drop. */
function Sticker({
  item,
  left,
  top,
  tilt,
  delay,
  cutId,
  raise,
}: {
  item: SkillItem;
  left: string;
  top: string;
  tilt: number;
  delay: number;
  cutId: string;
  raise: () => number;
}) {
  const drag = useRef<Drag | null>(null);
  const offset = useRef({ x: 0, y: 0 });
  const [lifted, setLifted] = useState(false);
  const [drops, setDrops] = useState(0);
  const { Icon } = item;

  const pickUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || drag.current) return;
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    // how far it can travel before any edge leaves the screen
    const r = el.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    const { x, y } = offset.current;
    drag.current = {
      id: e.pointerId,
      sx: e.clientX,
      sy: e.clientY,
      ox: x,
      oy: y,
      minX: Math.min(x, x - r.left + EDGE),
      maxX: Math.max(x, x + vw - r.right - EDGE),
      minY: Math.min(y, y - r.top + EDGE),
      maxY: Math.max(y, y + vh - r.bottom - EDGE),
    };
    el.style.zIndex = String(raise());
    setLifted(true);
    playPeel();
  };

  const move = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.id) return;
    const x = clampTo(d.ox + e.clientX - d.sx, d.minX, d.maxX);
    const y = clampTo(d.oy + e.clientY - d.sy, d.minY, d.maxY);
    offset.current = { x, y };
    e.currentTarget.style.translate = `${x}px ${y}px`;
  };

  const drop = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.id) return;
    drag.current = null;
    setLifted(false);
    setDrops((n) => n + 1);
    playSlap();
  };

  const inset = item.iconInset ?? DEFAULT_INSET;
  return (
    <div
      role="img"
      aria-label={item.name}
      data-lifted={lifted}
      onPointerDown={pickUp}
      onPointerMove={move}
      onPointerUp={drop}
      onPointerCancel={drop}
      onLostPointerCapture={drop}
      className={`sticker absolute touch-none select-none ${lifted ? "cursor-grabbing" : "cursor-grab"}`}
      style={{
        left,
        top,
        width: ds(STICKER),
        height: ds(STICKER),
        marginLeft: ds(-STICKER / 2),
        marginTop: ds(-STICKER / 2),
        rotate: `${tilt + (lifted ? LIFT_TILT : 0)}deg`,
      }}
    >
      <div className="sticker-in h-full w-full" style={{ animationDelay: `${delay}ms` }}>
        <div className={`sticker-body h-full w-full ${drops > 0 ? `sticker-slap-${drops % 2}` : ""}`}>
          <div
            className="h-full w-full"
            style={
              {
                filter: `url(#${cutId})`,
                color: "#111113",
                // the soldering station's own fills are "paper" — white here
                "--paper": "#ffffff",
                padding: `${inset * 100}%`,
              } as CSSProperties
            }
          >
            <Icon aria-hidden className="block h-full w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── the board ───────────────────────────────────────────────────────────── */

/** the mat's measured size, for drawing its rulers */
function useSize() {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ w: Math.round(width), h: Math.round(height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, size };
}

function StickerBoard({ layout }: { layout: CardLayout }) {
  const wide = layout === "row";
  const design = wide ? ROW_DESIGN : STACK_DESIGN;
  const { spots, rx, ry } = LAYOUTS[layout];
  const { ref, size } = useSize();
  const cutId = `cut-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  // the last sticker picked up goes on top, and stays there
  const z = useRef(10);
  const raise = useCallback(() => ++z.current, []);
  // the scale the CSS uses (`--s`), worked out again for the mat's rulers
  const scale = size ? Math.min(1, size.w / design.w, wide ? size.h / design.h : 1) : 1;
  // in the overlay the stickers wait for the card to be revealed; on the
  // stacked page, for the header to be mostly typed
  const start = wide ? 0 : 900;

  return (
    <div
      className={`relative w-full select-none ${wide ? "min-h-0 flex-1 [container-type:size]" : "[container-type:inline-size]"}`}
      style={
        {
          "--s": wide
            ? `min(1px, calc(100cqw / ${design.w}), calc(100cqh / ${design.h}))`
            : `min(1px, calc(100cqw / ${design.w}))`,
        } as CSSProperties
      }
    >
      <div
        ref={ref}
        className={`relative rounded-[20px] border border-white/10 bg-[#121214] ${wide ? "reveal-gate h-full" : ""}`}
        style={wide ? undefined : { height: ds(design.h) }}
      >
        {size && <Mat w={size.w} h={size.h} unit={Math.max(36, 64 * scale)} band={30} />}
        <StickerCut id={cutId} close={wide ? 16 : 12} blur={wide ? 3.5 : 3} />
        {GROUPS.map((group, g) => {
          const spot = spots[g];
          const at = start + g * 320;
          return (
            <div key={group.title} role="group" aria-label={group.title}>
              <h3
                className="label-in absolute whitespace-nowrap font-title uppercase leading-none tracking-wide text-ink"
                style={{
                  // centred with `transform` — the fade-in animates `translate`
                  transform: "translate(-50%, -50%)",
                  left: `calc(${spot.cx}% + ${ds(spot.dx)})`,
                  top: `${spot.cy}%`,
                  fontSize: `max(0.8rem, ${ds(26)})`,
                  animationDelay: `${at}ms`,
                }}
              >
                {group.title}
              </h3>
              {group.items.map((item, i) => {
                const { angle, reach, tilt } = SCATTER[g][i];
                return (
                  <Sticker
                    key={item.name}
                    item={item}
                    left={`calc(${spot.cx}% + ${ds(spot.dx + Math.cos(angle) * rx * reach)})`}
                    top={`calc(${spot.cy}% + ${ds(Math.sin(angle) * ry * reach)})`}
                    tilt={tilt}
                    delay={at + 150 + i * 90}
                    cutId={cutId}
                    raise={raise}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function skillsCards({ layout }: CardOptions): SectionCard[] {
  return [
    {
      key: "stickers",
      title: "",
      body: <StickerBoard layout={layout} />,
      bare: true,
      ownEntrance: true,
    },
  ];
}
