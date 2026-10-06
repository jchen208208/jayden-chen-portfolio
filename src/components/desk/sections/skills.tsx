"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { mulberry32 } from "@/lib/svg";
import { playPeel, playSlap } from "@/lib/stickerSound";
import { SKILLS_BOX_ITEMS, SKILLS_BOX_TITLES, type SkillItem, type StickerArt } from "../skillItems";
import type { CardLayout, CardOptions, SectionCard } from "./shared";

/**
 * Skills is a cutting mat with stickers on it (after events.ycombinator.com/
 * waterloo-2026). The mat (`SkillsMat`) lies under the whole view — header
 * and all — as the section's backdrop (`SectionBackdrop`): a double-ruled
 * frame with ticks and numbers round every edge, a whole- and half-unit grid,
 * and 30°/45°/60° guides running across it from the bottom-left corner.
 *
 * Below the header sit the three groups, each label the centre of its skills,
 * stuck round it as die-cut stickers — logos in their own colours, photos
 * for the hardware:
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
 * Hovering a sticker turns its white border amber and shows its name just
 * under it. Every sticker can be peeled off and dropped anywhere on the
 * screen, with a peel and a slap (`stickerSound`). Where they've been moved
 * isn't kept, so a reload puts everything back.
 *
 * The white border is an SVG filter (`StickerCut`) that grows a rounded
 * outline from the art's own shape; a second copy in amber is swapped in on
 * hover.
 *
 * Layout is in a fixed design space scaled to the space under the header
 * (`--s`, from container query units), so it holds at any size with no
 * measuring: each group sits at a fixed share of it, its stickers on an
 * ellipse round the label. The stacked page (phones, deep links) stacks the
 * three groups down the page instead.
 */

/** design space the overlay's layout is drawn in — scaled down to fit */
const ROW_DESIGN = { w: 1400, h: 560 };
/** the stacked layout's design width, and its height in the same units */
const STACK_DESIGN = { w: 560, h: 1250 };
/** a standard (logo) sticker's width, in design units */
const STICKER = 90;
/** how far the art sits in from the sticker's edge, as a share of it — logos
 *  get a little room, photos fill theirs */
const LOGO_INSET = 0.08;
const PHOTO_INSET = 0.02;
/** room left round the art for its die-cut border, in design units */
const CUT_ROOM = 14;
/** extra tilt while a sticker is held */
const LIFT_TILT = 4;
/** a dragged sticker stays this far inside the screen edge (px) */
const EDGE = 4;
/** the name under a hovered sticker sits this far below its (tilted) edge,
 *  die-cut border included — design units */
const NAME_GAP = 14;

/** where each group sits: `cx`/`cy` as % of the space, `dx` a nudge in
 *  design units, `spin` where round the ellipse its first sticker goes
 *  (deg, -90 = straight up) — and the ellipse its stickers ring round on */
type Spot = { cx: number; cy: number; dx: number; spin: number };
const LAYOUTS: Record<CardLayout, { spots: Spot[]; rx: number; ry: number }> = {
  // Languages top centre, the other two in the bottom corners
  row: {
    spots: [
      { cx: 50, cy: 26.5, dx: 0, spin: -90 },
      { cx: 20, cy: 66, dx: 0, spin: -90 },
      // four stickers, two of them big photos — set on the diagonals so
      // none crowds the label's ends
      { cx: 81, cy: 73, dx: 0, spin: -45 },
    ],
    rx: 254,
    ry: 108,
  },
  // one under another, each knocked a little off centre
  stack: {
    spots: [
      { cx: 50, cy: 17, dx: -40, spin: -90 },
      { cx: 50, cy: 50, dx: 40, spin: -90 },
      { cx: 50, cy: 83, dx: -20, spin: -45 },
    ],
    // narrow enough for a phone, so tall enough to clear the wide labels
    rx: 175,
    ry: 160,
  },
};

const GROUPS = SKILLS_BOX_TITLES.map((title, g) => ({ title, items: SKILLS_BOX_ITEMS[g] }));

/** an image's width over its height — 1 for a glyph */
const aspectOf = (art: StickerArt) => ("image" in art ? art.image.width / art.image.height : 1);

/** each sticker's place on its group's ellipse — evenly round from `spin`,
 *  each knocked a little off its spot and tilted, from a fixed seed so the
 *  server and the browser agree */
const SCATTER = GROUPS.map((group, g) => {
  const rnd = mulberry32(101 + g * 17);
  const jitter = () => rnd() * 2 - 1;
  return group.items.map((item, i) => {
    const step = 360 / group.items.length;
    const angleJitter = jitter() * 8;
    const reach = 1 + jitter() * 0.06;
    const tilt = item.tilt ?? Math.round(jitter() * 11 * 10) / 10;
    return { step: i * step + angleJitter, reach, tilt };
  });
});

const r2 = (n: number) => Math.round(n * 100) / 100;
/** a length in design units, scaled to the space it's drawn in */
const ds = (n: number) => `calc(${r2(n)} * var(--s))`;
const safeId = (id: string) => id.replace(/[^a-zA-Z0-9]/g, "");

/* ── the mat ─────────────────────────────────────────────────────────────── */

const MAT_FILL = "#121214";
const GRID_MINOR = "rgba(255,255,255,0.07)";
const GRID_MAJOR = "rgba(255,255,255,0.14)";
const RULE = "rgba(255,255,255,0.38)";
const GUIDE = "rgba(255,255,255,0.3)";
const NUMERAL = "rgba(255,255,255,0.5)";
/** the ruler numbers are in the page's face (Orbitron), like all its text */
const NUMERAL_FONT = "var(--font-orbitron), var(--font-title), sans-serif";
/** the outer rule's inset from the mat's edge, and the inner (ruled area)
 *  rule's — the band between them carries the ticks and numbers */
const OUTER = 12;
const INNER = 44;
const GUIDE_ANGLES = [60, 45, 30];

/** The cutting mat itself, drawn to its measured size. One unit is about a
 *  twentieth of the mat's width. The grid, the numbering (0 up from the
 *  left along the top and bottom, 1 up from the bottom along the sides) and
 *  the guides all start from the ruled area's bottom-left corner, like a
 *  real mat's. */
function MatDrawing({ w, h }: { w: number; h: number }) {
  const id = `mat-${safeId(useId())}`;
  const x0 = INNER;
  const y0 = INNER;
  const x1 = w - INNER;
  const y1 = h - INNER;
  const unit = Math.round(Math.min(76, Math.max(44, w / 20)));
  if (x1 - x0 < unit || y1 - y0 < unit) return null;

  const tick = unit / 10;
  const tickLen = (i: number) => (i % 10 === 0 ? 11 : i % 5 === 0 ? 7 : 4);
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
  const numeral = { fill: NUMERAL, fontFamily: NUMERAL_FONT, fontSize: 11 } as const;
  const reach = w + h;

  return (
    <svg aria-hidden className="absolute inset-0 h-full w-full" width={w} height={h}>
      <defs>
        {/* tiled from the ruled area's bottom-left corner */}
        <pattern id={`${id}-grid`} patternUnits="userSpaceOnUse" x={x0} y={y1} width={unit} height={unit}>
          <path d={`M${unit / 2} 0V${unit}M0 ${unit / 2}H${unit}`} stroke={GRID_MINOR} />
          <path d={`M0.5 0V${unit}M0 0.5H${unit}`} stroke={GRID_MAJOR} />
        </pattern>
        <clipPath id={`${id}-clip`}>
          <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} />
        </clipPath>
      </defs>
      <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill={`url(#${id}-grid)`} />
      <g clipPath={`url(#${id}-clip)`} stroke={GUIDE}>
        {GUIDE_ANGLES.map((deg) => {
          const a = (deg * Math.PI) / 180;
          return <path key={deg} d={`M${x0} ${y1}L${r2(x0 + Math.cos(a) * reach)} ${r2(y1 - Math.sin(a) * reach)}`} />;
        })}
      </g>
      {GUIDE_ANGLES.map((deg) => {
        // each guide labelled a little below the top rule, just right of it
        const y = y0 + unit * 1.25;
        const x = x0 + (y1 - y) / Math.tan((deg * Math.PI) / 180);
        return x < x1 - 40 ? (
          <text key={deg} x={r2(x + 7)} y={r2(y)} {...numeral}>
            {deg}°
          </text>
        ) : null;
      })}
      <g fill="none" stroke={RULE}>
        <rect x={OUTER + 0.5} y={OUTER + 0.5} width={w - 2 * OUTER - 1} height={h - 2 * OUTER - 1} rx={6} />
        <rect x={x0 + 0.5} y={y0 + 0.5} width={x1 - x0 - 1} height={y1 - y0 - 1} />
        <path d={ticks} />
      </g>
      <g {...numeral} textAnchor="middle">
        {Array.from({ length: cols + 1 }, (_, k) => (
          <g key={k}>
            <text x={r2(x0 + k * unit)} y={y0 - 16}>
              {k}
            </text>
            <text x={r2(x0 + k * unit)} y={y1 + 25}>
              {k}
            </text>
          </g>
        ))}
        {Array.from({ length: rows }, (_, k) => (
          <g key={k} dominantBaseline="central">
            <text x={x0 - 21} y={r2(y1 - (k + 1) * unit)}>
              {k + 1}
            </text>
            <text x={x1 + 21} y={r2(y1 - (k + 1) * unit)}>
              {k + 1}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}

/** The mat as a backdrop: fills whatever box it's given (`DeskScene` and
 *  `FocusFrame` give it nearly the whole view) and draws itself to that
 *  box's size. */
export function SkillsMat() {
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
  return (
    <div
      ref={ref}
      className="relative h-full w-full overflow-hidden rounded-[22px] border border-white/10"
      style={{ background: MAT_FILL }}
    >
      {size && <MatDrawing w={size.w} h={size.h} />}
    </div>
  );
}

/* ── stickers ────────────────────────────────────────────────────────────── */

/** The die-cut: the art's own shape, closed up (holes and notches smaller
 *  than `close` filled), softened and re-cut a few px outside itself — that's
 *  the sticker, in `edge` — with the art printed on top. Rounded corners
 *  come from cutting a blur rather than growing the shape square. */
function StickerCut({ id, edge, close }: { id: string; edge: string; close: number }) {
  return (
    <filter id={id} x="-30%" y="-30%" width="160%" height="160%" colorInterpolationFilters="sRGB">
      <feMorphology in="SourceAlpha" operator="dilate" radius={close} result="grown" />
      <feMorphology in="grown" operator="erode" radius={close} result="closed" />
      <feGaussianBlur in="closed" stdDeviation={3.5} result="soft" />
      <feComponentTransfer in="soft" result="cut">
        <feFuncA type="linear" slope="22" intercept="-0.6" />
      </feComponentTransfer>
      <feFlood floodColor={edge} />
      <feComposite in2="cut" operator="in" result="paper" />
      <feMerge>
        <feMergeNode in="paper" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  );
}

function Art({ art }: { art: StickerArt }) {
  if ("image" in art) {
    return (
      <Image
        src={art.image}
        alt=""
        draggable={false}
        className="pointer-events-none block h-full w-full object-contain"
      />
    );
  }
  const { Icon, color } = art;
  return <Icon aria-hidden className="block h-full w-full" style={{ color }} />;
}

type Drag = { id: number; sx: number; sy: number; ox: number; oy: number; minX: number; maxX: number; minY: number; maxY: number };

const clampTo = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), hi);

/** One sticker. It's moved with `translate` straight on the element while
 *  dragging (no re-render per pointer move); React only hears about the pick
 *  up and the drop. The outer box carries the position and the name (which
 *  stays level); the tilt, shadow and lift are on the sticker inside it. */
function Sticker({
  item,
  left,
  top,
  tilt,
  delay,
  raise,
}: {
  item: SkillItem;
  left: string;
  top: string;
  tilt: number;
  delay: number;
  raise: () => number;
}) {
  const drag = useRef<Drag | null>(null);
  const offset = useRef({ x: 0, y: 0 });
  const [lifted, setLifted] = useState(false);
  const [drops, setDrops] = useState(0);

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

  const width = STICKER * (item.scale ?? 1);
  const aspect = aspectOf(item.art);
  const height = width / aspect;
  const inset = Math.abs(aspect - 1) < 0.05 ? LOGO_INSET : PHOTO_INSET;
  // how far the tilted sticker reaches below its untilted box, so the name
  // clears it however it's turned
  const t = (tilt * Math.PI) / 180;
  const below = (width * Math.abs(Math.sin(t)) + height * Math.abs(Math.cos(t))) / 2 - height / 2;

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
        width: ds(width),
        height: ds(height),
        marginLeft: ds(-width / 2),
        marginTop: ds(-height / 2),
      }}
    >
      <div className="sticker-tilt h-full w-full" style={{ rotate: `${tilt + (lifted ? LIFT_TILT : 0)}deg` }}>
        <div className="sticker-in h-full w-full" style={{ animationDelay: `${delay}ms` }}>
          <div className={`sticker-body relative h-full w-full ${drops > 0 ? `sticker-slap-${drops % 2}` : ""}`}>
            {/* reaches past the sticker on every side: the die-cut filter's
                region is a share of this box, and a thin sticker (the iron)
                would otherwise have its border clipped off */}
            <div
              className="sticker-art absolute"
              style={{ inset: ds(-CUT_ROOM), padding: `calc(${ds(CUT_ROOM)} + ${r2(inset * width)} * var(--s))` }}
            >
              <Art art={item.art} />
            </div>
          </div>
        </div>
      </div>
      <span aria-hidden className="sticker-name" style={{ top: `calc(100% + ${ds(below + NAME_GAP)})` }}>
        {item.name}
      </span>
    </div>
  );
}

/* ── the board ───────────────────────────────────────────────────────────── */

function StickerBoard({ layout }: { layout: CardLayout }) {
  const wide = layout === "row";
  const design = wide ? ROW_DESIGN : STACK_DESIGN;
  const { spots, rx, ry } = LAYOUTS[layout];
  const cutId = `cut-${safeId(useId())}`;
  // the last sticker picked up goes on top, and stays there
  const z = useRef(10);
  const raise = useCallback(() => ++z.current, []);
  // in the overlay the stickers wait for the card to be revealed; on the
  // stacked page, for the header to settle
  const start = wide ? 0 : 400;

  return (
    <div
      className={`relative w-full select-none ${wide ? "min-h-0 flex-1 [container-type:size]" : "[container-type:inline-size]"}`}
      style={
        {
          "--s": wide
            ? `min(1px, calc(100cqw / ${design.w}), calc(100cqh / ${design.h}))`
            : `min(1px, calc(100cqw / ${design.w}))`,
          // the two die-cuts: white at rest, amber under the pointer
          "--cut": `url(#${cutId})`,
          "--cut-hot": `url(#${cutId}-hot)`,
        } as CSSProperties
      }
    >
      <svg aria-hidden width="0" height="0" className="absolute">
        <StickerCut id={cutId} edge="#ffffff" close={wide ? 16 : 12} />
        <StickerCut id={`${cutId}-hot`} edge="#ffbe5c" close={wide ? 16 : 12} />
      </svg>
      <div
        className={`relative ${wide ? "reveal-gate h-full" : ""}`}
        style={wide ? undefined : { height: ds(design.h) }}
      >
        {GROUPS.map((group, g) => {
          const spot = spots[g];
          const at = start + g * 320;
          return (
            <div key={group.title} role="group" aria-label={group.title}>
              <h3
                className="label-in skills-heading absolute whitespace-nowrap uppercase leading-none"
                style={{
                  // centred with `transform` — the fade-in animates `translate`
                  transform: "translate(-50%, -50%)",
                  left: `calc(${spot.cx}% + ${ds(spot.dx)})`,
                  top: `${spot.cy}%`,
                  fontSize: `max(0.75rem, ${ds(23)})`,
                  animationDelay: `${at}ms`,
                }}
              >
                {group.title}
              </h3>
              {group.items.map((item, i) => {
                const { step, reach, tilt } = SCATTER[g][i];
                const angle = ((spot.spin + step) * Math.PI) / 180;
                const [nx, ny] = (wide && item.nudge) || [0, 0];
                return (
                  <Sticker
                    key={item.name}
                    item={item}
                    left={`calc(${spot.cx}% + ${ds(spot.dx + nx + Math.cos(angle) * rx * reach)})`}
                    top={`calc(${spot.cy}% + ${ds(ny + Math.sin(angle) * ry * reach)})`}
                    tilt={tilt}
                    delay={at + 150 + i * 90}
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
