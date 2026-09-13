"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { MouseEvent, ReactNode, SVGProps } from "react";
import { createPortal } from "react-dom";
import {
  SiAutodesk,
  SiBlender,
  SiC,
  SiCplusplus,
  SiDocker,
  SiFirebase,
  SiGithub,
  SiHtml5,
  SiJavascript,
  SiKicad,
  SiMysql,
  SiNextdotjs,
  SiNodedotjs,
  SiPython,
  SiReact,
  SiTailwindcss,
  SiVercel,
} from "react-icons/si";
import { FaJava } from "react-icons/fa6";
import { TbSql } from "react-icons/tb";
import { DESK_VIEWBOX } from "@/lib/desk";
import DeskSvg from "./DeskSvg";
import DeskCardList from "./DeskCardList";

/** the soldering iron drawing traced onto the desk's tool wall (see
 *  `DeskSvg`, "soldering station" group) — the same path data, re-based into
 *  its own tight viewBox so it can stand alone as a skill-grid icon. Drawn
 *  as an outline (stroke only, no fill) so it reads the same hand-drawn way
 *  against the card's dark interior as it does on the desk itself. */
function SolderingIcon({ className, ...rest }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="139 316 134 86"
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...rest}
    >
      <path d="M254 358 L202 358 L150 374 L150 390 L254 390 Z" />
      <rect x={156} y={390} width={10} height={6} rx={1} />
      <rect x={238} y={390} width={10} height={6} rx={1} />
      <path d="M150 374 L145.3 358.7 M202 358 L197.3 342.7" />
      <path
        d="M145.3 358.7 Q147.6 350.7 156.0 362.7 Q156.2 348.0 164.7 360.1
           Q164.9 345.3 173.4 357.4 Q173.6 342.7 182.0 354.7
           Q182.2 340.0 190.7 352.1 Q190.9 337.3 197.3 342.7"
      />
      <path d="M231.9 358.8 L237.1 339.3 L231.3 337.7 L226.1 357.2 Z" />
      <path d="M220.7 330.7 L245.9 337.5 A4 4 0 0 1 243.8 345.2 L218.7 338.5 Z" />
      <path d="M215.4 342.8 L220.1 325.4 Q222.3 324.9 224.0 326.4 L219.3 343.8 Q217.1 344.3 215.4 342.8 Z" />
      <path d="M218.7 330.8 L185.4 321.8 L173.3 322.1 L183.5 328.5 L216.9 337.4 Z" />
      <path d="M248.7 342.4 A16 16 0 0 1 254 374" strokeWidth={3.2} />
      <circle cx={213} cy={372} r={3.5} />
      <circle cx={224} cy={372} r={3.5} />
      <circle cx={240} cy={377} r={9} />
      <circle cx={240} cy={377} r={2.5} />
      <line x1={240} y1={377} x2={240} y2={368} />
    </svg>
  );
}

/**
 * Each screen's glass rect, in viewBox units — must track the inset rect
 * drawn for that screen in `DeskSvg`:
 *   screen 1 — `Screen x={382} y={239} w={202} h={138}` (default inset 10)
 *   screen 2 — `Screen x={602} y={300} w={150} h={90} inset={9}`
 *   screen 3 — `Screen x={802} y={268} w={222} h={120} inset={10}`
 *   screen 4 — `Screen x={1062} y={128} w={182} h={252} inset={12}`
 *
 * First pass at the "click a screen, it takes over the screen" interaction —
 * placeholder content standing in for each real section, not wired to
 * routing yet. Screen 1 shows a triangle; screens 2–4 show short text labels
 * (screen 2 is the real "SKILLS" title; screens 3–4 are still "Section 2/3"
 * placeholders) that will become the real section titles later.
 *
 * This is an illusion, not a literal camera zoom: continuously scaling the
 * whole hand-drawn desk SVG up to fill the viewport would crop it unevenly
 * (its aspect ratio rarely matches the viewport's) and drag along whatever
 * scroll-driven transform `DeskStage` has applied to an ancestor. Instead, a
 * separate, purpose-built fullscreen view fades/scales in from the click
 * point, portaled straight to `<body>` so it isn't nested inside — and
 * doesn't inherit — any transformed ancestor.
 */
type Rect = { x: number; y: number; w: number; h: number };

type ScreenDemo =
  | { id: string; glass: Rect; kind: "shape" }
  | { id: string; glass: Rect; kind: "text"; label: string };

const SCREENS: ScreenDemo[] = [
  { id: "screen1", glass: { x: 392, y: 249, w: 182, h: 118 }, kind: "shape" },
  {
    id: "screen2",
    glass: { x: 611, y: 309, w: 132, h: 72 },
    kind: "text",
    label: "SKILLS",
  },
  {
    id: "screen3",
    glass: { x: 812, y: 278, w: 202, h: 100 },
    kind: "text",
    label: "Section 2",
  },
  {
    id: "screen4",
    glass: { x: 1074, y: 140, w: 158, h: 228 },
    kind: "text",
    label: "Section 3",
  },
];

/** eases like the "expo out" curve most CSS zoom-in effects use — a fast
 *  start that settles in slowly, which is what makes a scale read as a
 *  deliberate zoom instead of a snap */
const ZOOM_EASE = "cubic-bezier(0.16, 1, 0.3, 1)";
const ZOOM_MS = 900;

/** the Skills screen (screen2) gets a two-stage opening sequence instead of
 *  the other screens' single zoom: one smooth, uninterrupted zoom straight
 *  from the click point to centred-fullscreen (identical timing to every
 *  other screen, so there's no hitch at a hand-off), then — once fully
 *  open — a quick glide up to sit near the top of the page, like a label
 *  growing into a full-page title that settles into a header. */
type OverlayStage = "closed" | "center" | "top";
const SKILLS_SCREEN_ID = "screen2";
const SKILLS_STAGE_TIMING: Record<Exclude<OverlayStage, "closed">, { ms: number; ease: string }> =
  {
    center: { ms: ZOOM_MS, ease: ZOOM_EASE },
    top: { ms: 400, ease: "cubic-bezier(0.4, 0, 0.2, 1)" },
  };
/** the glide-up starts before the zoom-to-centre transition fully settles
 *  (it's still finishing its last bit of ease-out), so the two motions
 *  overlap slightly instead of the glide only kicking in once the zoom has
 *  come to a complete stop. */
const SKILLS_GLIDE_DELAY_MS = 620;
/** equal gap kept above the boxes (from the header) and below them (from
 *  the bottom of the screen) */
const SKILLS_BOX_V_GAP = 40;
/** one subtitle per card, left to right */
const SKILLS_BOX_TITLES = ["Languages", "Tools & Frameworks", "Hardware & Design"];

/** every skill tile's fixed footprint — same for every item, sized so a
 *   3-column grid row reads as big, evenly spaced icons */
const SKILL_TILE_BASE = "clamp(4.5rem, 7vw, 6.5rem)";

type SkillItem = {
  name: string;
  icon: (className: string) => ReactNode;
  /** overrides the icon box's default padding — used for `SolderingIcon`,
   *  whose landscape drawing needs a lot less inset than a square brand
   *  logo to read as similarly large inside the same square tile */
  iconPadding?: string;
};

/** the actual skills inside each card, matched to `SKILLS_BOX_TITLES` by
 *  index — one array per card, each rendered as an icon tile (brand logo +
 *  name underneath) rather than a plain text chip. Soldering has no brand
 *  logo, so it uses the hand-drawn `SolderingIcon` traced from the desk's
 *  own tool wall/3D-printer setup instead of a `react-icons` glyph. */
const SKILLS_BOX_ITEMS: SkillItem[][] = [
  [
    { name: "Python", icon: (c) => <SiPython className={c} /> },
    { name: "C", icon: (c) => <SiC className={c} /> },
    { name: "C++", icon: (c) => <SiCplusplus className={c} /> },
    { name: "JavaScript", icon: (c) => <SiJavascript className={c} /> },
    { name: "Java", icon: (c) => <FaJava className={c} /> },
    { name: "SQL", icon: (c) => <TbSql className={c} /> },
    { name: "HTML/CSS", icon: (c) => <SiHtml5 className={c} /> },
  ],
  [
    { name: "Git/GitHub", icon: (c) => <SiGithub className={c} /> },
    { name: "MySQL", icon: (c) => <SiMysql className={c} /> },
    { name: "Docker", icon: (c) => <SiDocker className={c} /> },
    { name: "Node.js", icon: (c) => <SiNodedotjs className={c} /> },
    { name: "React", icon: (c) => <SiReact className={c} /> },
    { name: "Next.js", icon: (c) => <SiNextdotjs className={c} /> },
    { name: "Vercel", icon: (c) => <SiVercel className={c} /> },
    { name: "Firebase", icon: (c) => <SiFirebase className={c} /> },
    { name: "Tailwind CSS", icon: (c) => <SiTailwindcss className={c} /> },
  ],
  [
    { name: "Soldering", icon: (c) => <SolderingIcon className={c} />, iconPadding: "p-1" },
    { name: "PCB Design (KiCad)", icon: (c) => <SiKicad className={c} /> },
    { name: "CAD Modelling (Fusion 360)", icon: (c) => <SiAutodesk className={c} /> },
    { name: "3D Graphics Design", icon: (c) => <SiBlender className={c} /> },
  ],
];

/** the three placeholder cards pop in with an actual macOS "genie" warp —
 *  https://harshil.net/blog/recreating-the-mac-genie-effect — drawn on a
 *  <canvas> scanline by scanline, one card at a time. `clip-path` can only
 *  move straight-line vertices, which reads as a shape shrinking in place;
 *  the real genie look comes from each horizontal row of the card
 *  travelling to the pinch point at ITS OWN pace (rows nearer the pinch
 *  point start moving sooner) with x and y easing independently, which is
 *  what makes the middle "belly" out while the ends taper — a fabric being
 *  pulled through a point, not a rectangle shrinking. */
const GENIE_MS = 420;
/** gap between one card finishing its genie and the next one starting */
const GENIE_STAGGER_MS = 60;
const clamp01 = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** ease-out-expo — used for both each row's horizontal (width) and vertical
 *  (position) motion. A plain ease-in-out-cubic still reads as a "snap":
 *  most of its deceleration is crammed into roughly the last third of the
 *  timeline, so the shape is still moving at a noticeable clip until very
 *  late, then stops abruptly. Ease-out-expo instead burns off almost all
 *  its motion in an early burst and spends the back half of the timeline
 *  barely creeping the rest of the way — a long, gentle glide to rest
 *  rather than a moving object hitting a wall. */
const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

// Must stay in sync with the revealed cards' own CSS below (same rounded
// corner radius, same border thickness) so there's no visible change the
// instant the canvas hands off to the real element.
/** outer corner radius, all four corners */
const GENIE_OUTER_RADIUS = 16;
/** border thickness, all four sides ("very slightly thicker" than a
 *  hairline) */
const GENIE_BORDER_THICKNESS = 3;

type GenieRect = { x: number; y: number; w: number; h: number };
type GeniePoint = { x: number; y: number };

/** how far a rounded corner's edge is pulled in from the flat/straight
 *  position, at depth `d` (0 = the very corner, `radius` = where the
 *  straight run begins) — the standard quarter-circle corner formula */
const cornerInset = (d: number, radius: number) =>
  radius - Math.sqrt(Math.max(0, radius * radius - (radius - d) * (radius - d)));

/** draws one frame of one card's genie unfurl: for each of its `h` rows,
 *  work out how far along that row is (staggered by its position, 0 = top
 *  row moves first) and where its left/right edges and y-position sit
 *  between the pinch point and the row's final place in `rect`, then tick
 *  just that row's left/right border pixels. Rounded corners (top AND
 *  bottom, tapering as the whole shape does, so they never look like they
 *  "turn on" only once fully open) come from nudging each row's left/right
 *  inward per `cornerInset`. */
function drawGenieFrame(ctx: CanvasRenderingContext2D, rect: GenieRect, pinch: GeniePoint, rawT: number) {
  const rows: { left: number; right: number; y: number; row: number }[] = [];
  for (let row = 0; row < rect.h; row++) {
    const r = row / rect.h;
    // Smaller stagger windows than before: a row that starts later still
    // has to squeeze its whole ease-out-expo curve into the time left, so
    // too big a delay would force a fast-then-sudden-stop scramble right
    // at the end for the last rows — the exact snap we're removing.
    const xStart = r * 0.4;
    const xT = easeOutExpo(clamp01((rawT - xStart) / (1 - xStart), 0, 1));
    const yStart = r * 0.12;
    const yT = easeOutExpo(clamp01((rawT - yStart) / (1 - yStart), 0, 1));
    const left = lerp(pinch.x, rect.x, xT);
    const right = lerp(pinch.x, rect.x + rect.w, xT);
    const y = lerp(pinch.y, rect.y + row, yT);
    if (right - left < 1) continue;
    rows.push({ left, right, y, row });
  }
  if (!rows.length) return;

  // The outer radius shrinks toward 0 while the card is still tiny/near the
  // pinch point (otherwise a 16px radius on a 4px-tall sliver would invert
  // the corners into a bowtie), then grows back to full size as it opens.
  const first = rows[0];
  const last = rows[rows.length - 1];
  const curHeight = Math.abs(last.y - first.y) || 1;
  const curWidth = Math.min(first.right - first.left, last.right - last.left) || 1;
  const scale = clamp01(Math.min(curWidth, curHeight) / (GENIE_OUTER_RADIUS * 2), 0, 1);
  const outerR = GENIE_OUTER_RADIUS * scale;

  let firstRowDrawn: { left: number; right: number; y: number } | null = null;
  let lastRowDrawn: { left: number; right: number; y: number } | null = null;
  for (const { left, right, y, row } of rows) {
    let outerInset = 0;
    if (row < outerR) {
      outerInset = cornerInset(row, outerR);
    } else if (row > rect.h - 1 - outerR) {
      outerInset = cornerInset(rect.h - 1 - row, outerR);
    }
    const L = left + outerInset;
    const R = right - outerInset;
    if (R - L < 1) continue;
    if (!firstRowDrawn) firstRowDrawn = { left: L, right: R, y };
    lastRowDrawn = { left: L, right: R, y };
    ctx.fillRect(L, y, GENIE_BORDER_THICKNESS, 1.5);
    ctx.fillRect(R - GENIE_BORDER_THICKNESS, y, GENIE_BORDER_THICKNESS, 1.5);
  }
  // flat top/bottom edge caps, each between its pair of rounded corners
  if (firstRowDrawn) {
    ctx.fillRect(
      firstRowDrawn.left,
      firstRowDrawn.y,
      firstRowDrawn.right - firstRowDrawn.left,
      GENIE_BORDER_THICKNESS,
    );
  }
  if (lastRowDrawn) {
    ctx.fillRect(
      lastRowDrawn.left,
      lastRowDrawn.y,
      lastRowDrawn.right - lastRowDrawn.left,
      GENIE_BORDER_THICKNESS,
    );
  }
}

/** the lamp's pull-chain handle, in the same viewBox units as `SCREENS` —
 *  a generous hit box around the chain of beads drawn in `DeskSvg`. The
 *  chain's own attach point is (1017,169) local to the tilted head group,
 *  which — carried through that group's 15° rotation and the lamp group's
 *  translate(-5,0) — lands around (998,172) on screen; the chain then hangs
 *  straight down from there to the handle at dy 20–24. */
const LAMP_CHAIN_HIT: Rect = { x: 988, y: 165, w: 22, h: 42 };

/** one "click here" cue per screen — a bouncing title-font label with a pair
 *  of small arrowheads underneath, sitting in the gap between the wall shelf
 *  and each screen's own bezel. `top`/`centerX` are in viewBox units, each
 *  hand-picked so the cue clears whatever's drawn above that particular
 *  screen (the wall shelf, the lamp, the toolboxes). */
type ScreenCueSpec = { label: string; centerX: number; top: number };

const SCREEN_CUES: ScreenCueSpec[] = [
  // screen 1 (382,239,202,138) — the "Projects" play-button screen
  { label: "Click", centerX: 382 + 202 / 2, top: 185 },
  // screen 2 (602,300,150,90) — "Skills"
  { label: "Click", centerX: 602 + 150 / 2, top: 246 },
  // screen 3 (802,268,222,120) — "Personal"
  { label: "Click", centerX: 802 + 222 / 2, top: 214 },
  // screen 4 (1062,128,182,252) — sits highest on the desk, so its cue gets
  // the least headroom
  { label: "Click", centerX: 1062 + 182 / 2, top: 74 },
];

function ScreenCue({ label, centerX, top }: ScreenCueSpec) {
  return (
    <div
      aria-hidden
      className="bounce-cue pointer-events-none absolute flex -translate-x-1/2 flex-col items-center text-white/70"
      style={{
        left: `${(centerX / DESK_VIEWBOX.w) * 100}%`,
        top: `${(top / DESK_VIEWBOX.h) * 100}%`,
      }}
    >
      <span className="font-title text-[13px] uppercase tracking-wide sm:text-[15px]">
        {label}
      </span>
      <div className="-mt-1 flex flex-col items-center">
        <ArrowheadDown />
        <ArrowheadDown className="-mt-0.5" />
      </div>
    </div>
  );
}

/** a single down-pointing arrowhead, used in pairs beneath each screen cue —
 *  smaller than the text it sits under */
function ArrowheadDown({ className }: { className?: string }) {
  return (
    <svg
      width="9"
      height="5"
      viewBox="0 0 9 5"
      fill="none"
      aria-hidden
      className={className}
    >
      <path
        d="M1 1L4.5 4L8 1"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function DeskScene({ className }: { className?: string }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [lampOn, setLampOn] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  // How big the clicked screen's glass was on screen, as a fraction of the
  // viewport — the fullscreen content starts at this scale (roughly the
  // source element's own size) instead of from an invisible speck, so it
  // reads as that same content growing to fill the screen, not something new
  // popping in.
  const [startScale, setStartScale] = useState(0.05);
  // The screen last opened. Never cleared back to null (just left showing
  // whatever was last opened, hidden behind the closed overlay) — clearing it
  // would swap which element type sits at this JSX position (the shape's
  // <svg> vs. a screen's <div>), which unmounts and remounts a fresh element
  // whenever a *different kind* of screen opens next. A freshly-mounted
  // element has no prior frame to transition from, so it snaps straight to
  // its target scale instead of animating — the inconsistent "sometimes
  // fast, sometimes slow, and screen 1 always fast" bug. Keeping one
  // persistent wrapper element (below) whose `transform` is simply
  // reassigned, and never unmounted, makes the transition play every time.
  const [content, setContent] = useState<ScreenDemo | null>(null);
  // Drives the persistent wrapper's transform. Every screen just flips
  // straight from "closed" to "center"; Skills additionally steps on to
  // "top" once fully open (see `openScreen`).
  const [stage, setStage] = useState<OverlayStage>("closed");
  const stageTimers = useRef<number[]>([]);
  // Skills only: measured once the header has finished gliding up, so the
  // three cards below it can sit exactly where "equal gap above, equal gap
  // below" actually lands for the header's real (responsive) size — rather
  // than a guessed CSS position.
  const headerRef = useRef<HTMLDivElement>(null);
  const [boxLayout, setBoxLayout] = useState<{ top: number; height: number } | null>(null);
  // The canvas the genie warp is actually drawn on, one card at a time —
  // see the effect below. Each card's real bordered <div> stays invisible
  // (see `boxRevealed`) until its own genie frame reaches rawT=1, at which
  // point the canvas frame and the div's resting position are identical, so
  // swapping from one to the other is seamless.
  const genieCanvasRef = useRef<HTMLCanvasElement>(null);
  const [boxRevealed, setBoxRevealed] = useState([false, false, false]);
  // `document.body` doesn't exist during SSR — this flips to true only once
  // mounted on the client, without a setState-in-effect.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const clearStageTimers = useCallback(() => {
    for (const id of stageTimers.current) window.clearTimeout(id);
    stageTimers.current = [];
  }, []);

  useEffect(() => clearStageTimers, [clearStageTimers]);

  // No scroll lock here: `useScrollLock` toggles `overflow: hidden` on
  // <html>, and Chrome resets `window.scrollY` to 0 the instant that happens.
  // `DeskStage` reads `window.scrollY` on every scroll/resize to position the
  // desk, so that reset made it visibly snap to its "resting" (unscrolled)
  // frame the moment a screen opened, and it never scrolled back once
  // closed — restoring scrollY on close couldn't undo it, since DeskStage
  // had already redrawn against the 0. The fullscreen overlay is opaque, so
  // background scroll while it's open is harmless to leave unlocked.

  const openScreen = useCallback((e: MouseEvent<HTMLButtonElement>, s: ScreenDemo) => {
    const box = e.currentTarget.getBoundingClientRect();
    setOrigin({
      x: ((box.left + box.width / 2) / window.innerWidth) * 100,
      y: ((box.top + box.height / 2) / window.innerHeight) * 100,
    });
    // Match the fullscreen view's starting size to how big the little screen
    // actually looked, so it visibly grows from there rather than from a dot.
    setStartScale(
      Math.max(0.03, Math.min(box.width / window.innerWidth, box.height / window.innerHeight)),
    );
    setContent(s);
    setOpenId(s.id);

    clearStageTimers();
    setStage("center");
    if (s.id === SKILLS_SCREEN_ID) {
      // One smooth zoom straight to centred-fullscreen (same timing as
      // every other screen), then — just before it's fully settled — glide
      // up to the header spot.
      stageTimers.current.push(window.setTimeout(() => setStage("top"), SKILLS_GLIDE_DELAY_MS));
    }
  }, [clearStageTimers]);

  const close = useCallback(() => {
    clearStageTimers();
    setStage("closed");
    setOpenId(null);
    setBoxLayout(null);
    setBoxRevealed([false, false, false]);
  }, [clearStageTimers]);

  const toggleLamp = useCallback(() => setLampOn((v) => !v), []);

  const zoomed = openId !== null;
  const isSkills = content?.id === SKILLS_SCREEN_ID;

  // The Skills screen steps through its own scale per stage; every other
  // screen just flips between its start size and fullscreen.
  const overlayTransform =
    stage === "closed"
      ? `scale(${startScale})`
      : stage === "top"
        ? "scale(1) translateY(-35vh)" // glide up to sit high on the page
        : "scale(1)";
  // Skills pivots on the viewport centre once it's open (so the glide-up
  // stays centred horizontally); every other screen keeps pivoting on the
  // click point throughout, since they never move again after opening.
  const overlayOrigin =
    isSkills && stage !== "closed" ? "50% 50%" : `${origin.x}% ${origin.y}%`;
  const overlayTiming =
    isSkills && stage !== "closed" ? SKILLS_STAGE_TIMING[stage] : { ms: ZOOM_MS, ease: ZOOM_EASE };
  // Wait for the header's own glide-up transition to actually finish, then
  // measure its real (responsive) resting position so the boxes below it
  // can use an equal gap above and below by construction. Once that's
  // known, measure each box's own final rect and run the genie warp for
  // them one at a time — see `drawGenieFrame` above — each unfurling from
  // the exact centre of the page, revealing that card's real bordered
  // <div> only once its own frame finishes.
  useEffect(() => {
    if (!isSkills || stage !== "top") return;
    let cancelled = false;
    let rafId = 0;
    let staggerTimer = 0;

    const run = () => {
      const header = headerRef.current;
      const canvas = genieCanvasRef.current;
      if (!header || !canvas) return;
      const headerBottom = header.getBoundingClientRect().bottom;
      const top = headerBottom + SKILLS_BOX_V_GAP;
      const height = window.innerHeight - top - SKILLS_BOX_V_GAP;
      setBoxLayout({ top, height });

      // Computed directly from the same values the row's CSS uses
      // (inset-x-[3vw] padding, gap-[3vw], three equal flex-1 columns)
      // instead of measuring the real boxes with getBoundingClientRect.
      // `setBoxLayout` above is a React state update — it hasn't been
      // committed to the DOM yet at this point in the same function, so
      // the boxes are still laid out at their small fallback size
      // (top: 60%, height: 30vh). Measuring them here would genie-animate
      // to THAT size and then visibly jump to the real, larger one the
      // instant each box is revealed. Working out the same final rect the
      // CSS will land on, ahead of the DOM catching up, keeps the animated
      // size and the revealed size identical throughout.
      const vw = window.innerWidth / 100;
      const sidePad = 3 * vw;
      const gap = 3 * vw;
      const rowWidth = window.innerWidth - sidePad * 2;
      const boxWidth = (rowWidth - gap * 2) / 3;
      const rects: GenieRect[] = [0, 1, 2].map((i) => ({
        x: sidePad + i * (boxWidth + gap),
        y: top,
        w: boxWidth,
        h: height,
      }));
      const pinch: GeniePoint = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      const ctx = canvas.getContext("2d")!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "#fff";

      const animateBox = (index: number) => {
        if (cancelled) return;
        if (index >= rects.length) {
          // safety net — should already be clear from the last box's own
          // rawT===1 branch below, but never leave a stray frame behind.
          ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
          return;
        }
        const rect = rects[index];
        let start: number | null = null;
        const frame = (ts: number) => {
          if (cancelled) return;
          if (start === null) start = ts;
          const rawT = clamp01((ts - start) / GENIE_MS, 0, 1);
          ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
          if (rawT < 1) {
            drawGenieFrame(ctx, rect, pinch, rawT);
            rafId = requestAnimationFrame(frame);
          } else {
            // Fully open: the canvas is left blank (cleared just above)
            // instead of drawing one last sharp-cornered rectangle, which
            // would otherwise sit on top of the real rounded-corner <div>
            // for the stagger gap (and permanently after the last box) —
            // that mismatch was the "smaller rectangle" glitch.
            setBoxRevealed((prev) => {
              const next = [...prev];
              next[index] = true;
              return next;
            });
            staggerTimer = window.setTimeout(() => animateBox(index + 1), GENIE_STAGGER_MS);
          }
        };
        rafId = requestAnimationFrame(frame);
      };
      animateBox(0);
    };

    const t = window.setTimeout(run, SKILLS_STAGE_TIMING.top.ms);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
      window.clearTimeout(staggerTimer);
      cancelAnimationFrame(rafId);
    };
  }, [isSkills, stage]);

  useEffect(() => {
    if (!zoomed) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomed, close]);

  return (
    <div className={className}>
      <div className="mx-auto hidden w-full max-w-[1180px] px-4 md:block">
        <div
          className="relative w-full"
          style={{ aspectRatio: `${DESK_VIEWBOX.w} / ${DESK_VIEWBOX.h}` }}
        >
          <DeskSvg className="absolute inset-0 h-full w-full" lampOn={lampOn} />
          <button
            type="button"
            aria-label={lampOn ? "Turn lamp off" : "Turn lamp on"}
            aria-pressed={lampOn}
            onClick={toggleLamp}
            onMouseDown={(e) => e.preventDefault()}
            className="absolute cursor-pointer outline-none"
            style={{
              left: `${(LAMP_CHAIN_HIT.x / DESK_VIEWBOX.w) * 100}%`,
              top: `${(LAMP_CHAIN_HIT.y / DESK_VIEWBOX.h) * 100}%`,
              width: `${(LAMP_CHAIN_HIT.w / DESK_VIEWBOX.w) * 100}%`,
              height: `${(LAMP_CHAIN_HIT.h / DESK_VIEWBOX.h) * 100}%`,
            }}
          />
          {SCREENS.map((s) => (
            <button
              key={s.id}
              type="button"
              aria-label="Open screen"
              onClick={(e) => openScreen(e, s)}
              // Prevents the browser's default focus-on-click: with the desk
              // sitting inside a `position: sticky` + transformed ancestor,
              // focusing this button made some browsers snap-scroll the page
              // to this element's untransformed layout position — visible as
              // the whole desk "teleporting" the instant it was clicked.
              onMouseDown={(e) => e.preventDefault()}
              className="absolute cursor-pointer outline-none"
              style={{
                left: `${(s.glass.x / DESK_VIEWBOX.w) * 100}%`,
                top: `${(s.glass.y / DESK_VIEWBOX.h) * 100}%`,
                width: `${(s.glass.w / DESK_VIEWBOX.w) * 100}%`,
                height: `${(s.glass.h / DESK_VIEWBOX.h) * 100}%`,
              }}
            />
          ))}
          {/* one click-here cue per screen — see `SCREEN_CUES` above */}
          {SCREEN_CUES.map((cue) => (
            <ScreenCue key={cue.centerX} {...cue} />
          ))}
        </div>
      </div>

      <div className="md:hidden">
        <DeskCardList />
      </div>

      {mounted &&
        createPortal(
          <div
            aria-hidden={!zoomed}
            onClick={close}
            className="fixed inset-0 z-50 flex cursor-pointer items-center justify-center"
            style={{
              backgroundColor: "var(--paper, #000)",
              opacity: zoomed ? 1 : 0,
              pointerEvents: zoomed ? "auto" : "none",
              transition: `opacity ${ZOOM_MS}ms ${ZOOM_EASE}`,
            }}
          >
            {/* One persistent wrapper — never unmounted — carries the scale
                transition; only its children (which shape/text is showing)
                swap underneath it. See the note on `content` above for why
                that split matters. */}
            <div
              className="flex h-full w-full items-center justify-center"
              style={{
                transform: overlayTransform,
                transformOrigin: overlayOrigin,
                transition: `transform ${overlayTiming.ms}ms ${overlayTiming.ease}, transform-origin ${overlayTiming.ms}ms ${overlayTiming.ease}`,
              }}
            >
              {/* fresh, purpose-built fullscreen view — not a scaled copy of
                  the desk SVG, so it stays crisp and correctly proportioned
                  at any viewport size */}
              {content?.kind === "shape" && (
                <svg
                  viewBox="0 0 100 100"
                  preserveAspectRatio="xMidYMid meet"
                  className="h-full w-full"
                >
                  <polygon points="38,28 38,72 68,50" fill="var(--ink, #f4f6f8)" />
                </svg>
              )}
              {content?.kind === "text" && (
                <div
                  ref={isSkills ? headerRef : undefined}
                  className={
                    isSkills
                      ? "px-8 text-center font-title uppercase tracking-wide"
                      : "px-8 text-center font-mono"
                  }
                  style={{
                    fontSize: "clamp(2rem, 8vw, 6rem)",
                    color: "var(--ink, #f4f6f8)",
                  }}
                >
                  {content.label}
                </div>
              )}
            </div>

            {/* three placeholder content cards — Skills only. Kept as a
                sibling of the header wrapper (not a child) so they don't
                inherit its scale/glide transform. Sized to exactly fill
                what's left of the screen once `boxLayout` is measured (see
                the effect above): full width minus equal side margins,
                and the equal gap above (to the header) / below (to the
                screen's bottom edge) baked into `boxLayout.top/height`.
                Each card stays invisible until its own genie frame (drawn
                on the canvas below) reaches its last frame, at which point
                it's revealed at the exact same position/size the canvas
                just finished drawing — a seamless handoff from "animated
                warp" to "real bordered div". The corner radius and border
                thickness here are the same numbers as
                `GENIE_OUTER_RADIUS`/`GENIE_BORDER_THICKNESS` above, so the
                handoff doesn't change how the card looks.

                Each card's subtitle sits in a filled-white header strip —
                bounded by the card's own top/left/right border plus this
                strip's own bottom edge, which is all the "line under the
                subtitle" needs to be, since the white-to-black colour
                change against the card's dark interior already reads as a
                dividing line without an extra stroke. `overflow-hidden` on
                the card clips the strip's own square corners to the
                card's rounded ones. The subtitle text is coloured like the
                page background instead of ink, so it reads as a knockout
                cut from the white fill rather than white text sitting on
                top of it. */}
            {isSkills && (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-[3vw] flex items-stretch justify-center gap-[3vw]"
                style={
                  boxLayout
                    ? { top: boxLayout.top, height: boxLayout.height }
                    : { top: "60%", height: "30vh", transform: "translateY(-50%)" }
                }
              >
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="relative flex-1 overflow-hidden rounded-[16px] border-[3px] border-white"
                    style={{ opacity: boxRevealed[i] ? 1 : 0 }}
                  >
                    <div className="flex items-center justify-center bg-white py-5">
                      <span
                        className="font-title text-[clamp(1.25rem,2.6vw,2.25rem)] uppercase tracking-wide"
                        style={{ color: "var(--paper, #000)" }}
                      >
                        {SKILLS_BOX_TITLES[i]}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 justify-items-center gap-x-5 gap-y-7 p-6">
                      {SKILLS_BOX_ITEMS[i].map((item) => (
                        <div
                          key={item.name}
                          className="flex flex-col items-center gap-2.5"
                          style={{ width: SKILL_TILE_BASE }}
                        >
                          <div
                            className={`flex aspect-square w-full items-center justify-center rounded-lg border-2 border-white text-white ${item.iconPadding ?? "p-3"}`}
                          >
                            {item.icon("h-full w-full")}
                          </div>
                          {/* fixed height + line-clamp-2, instead of letting
                              the label grow with its own text — otherwise a
                              long name (e.g. "CAD Modelling (Fusion 360)")
                              wraps onto extra lines and makes THAT row taller
                              than the same row in another card, throwing off
                              cross-card alignment even though every tile
                              above it is the same size. */}
                          <span className="line-clamp-2 h-8 text-center font-title text-xs uppercase leading-tight tracking-wide text-white sm:h-9 sm:text-sm">
                            {item.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* the genie warp itself — one shared canvas covering the whole
                page, since the animating card's rect is already in
                viewport (not row-local) coordinates */}
            {isSkills && (
              <canvas
                ref={genieCanvasRef}
                aria-hidden
                className="pointer-events-none absolute inset-0 h-full w-full"
              />
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}
