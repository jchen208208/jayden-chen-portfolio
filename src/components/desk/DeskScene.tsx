"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties, MouseEvent, Ref } from "react";
import { createPortal, flushSync } from "react-dom";
import { getFontEmbedCSS, toCanvas } from "html-to-image";
import { DESK_VIEWBOX } from "@/lib/desk";
import DeskSvg, { laptop1Rect } from "./DeskSvg";
import DeskCardList from "./DeskCardList";
import { SKILLS_BOX_ITEMS, SKILLS_BOX_TITLES } from "./skillItems";
import ProjectsMonitorScreen from "./ProjectsMonitorScreen";

/**
 * Each screen's glass rect, in viewBox units — must track the inset rect
 * drawn for that screen in `DeskSvg`:
 *   screen 1 — `Screen x={382} y={239} w={202} h={138}` (default inset 10)
 *   screen 2 — `Screen x={602} y={300} w={150} h={90} inset={9}`, then scaled
 *               up in place by `LAPTOP1` (see `laptop1Rect`)
 *   screen 3 — `Screen x={802} y={268} w={222} h={120} inset={10}`
 *   screen 4 — `Screen x={1062} y={128} w={182} h={252} inset={12}`
 *
 * First pass at the "click a screen, it takes over the screen" interaction —
 * not wired to routing yet. Every screen now carries its real section title:
 * "PROJECTS", "SKILLS", "EXPERIENCE", and — on the portrait monitor, which
 * plays a tennis point through to a podium — "PERSONAL & AWARDS".
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

type ScreenDemo = { id: string; glass: Rect; kind: "text"; label: string };

const SCREENS: ScreenDemo[] = [
  {
    id: "screen1",
    glass: { x: 392, y: 249, w: 182, h: 118 },
    kind: "text",
    label: "PROJECTS",
  },
  {
    id: "screen2",
    // drawn at 611,309,132,72 and then scaled up in place by `DeskSvg` — this
    // layer sits outside the SVG, so it has to apply the same transform
    glass: laptop1Rect({ x: 611, y: 309, w: 132, h: 72 }),
    kind: "text",
    label: "SKILLS",
  },
  {
    id: "screen3",
    glass: { x: 812, y: 278, w: 202, h: 100 },
    kind: "text",
    label: "EXPERIENCE",
  },
  {
    id: "screen4",
    glass: { x: 1074, y: 140, w: 158, h: 228 },
    kind: "text",
    label: "PERSONAL & AWARDS",
  },
];

/** eases like the "expo out" curve most CSS zoom-in effects use — a fast
 *  start that settles in slowly, which is what makes a scale read as a
 *  deliberate zoom instead of a snap */
const ZOOM_EASE = "cubic-bezier(0.16, 1, 0.3, 1)";
const ZOOM_MS = 900;

/** The Skills screen gets a two-stage opening sequence instead of the other
 *  screens' single zoom: one smooth, uninterrupted zoom straight from the
 *  click point to centred-fullscreen (identical timing to every other screen,
 *  so there's no hitch at a hand-off), then — once open — a quick glide up to
 *  sit near the top of the page, like a label growing into a full-page title
 *  that settles into a header, leaving the rest of the page free for its
 *  cards. */
type OverlayStage = "closed" | "center" | "top";
const SKILLS_SCREEN_ID = "screen2";
const LIFT_STAGE_TIMING: Record<Exclude<OverlayStage, "closed">, { ms: number; ease: string }> =
  {
    center: { ms: ZOOM_MS, ease: ZOOM_EASE },
    top: { ms: 400, ease: "cubic-bezier(0.4, 0, 0.2, 1)" },
  };
/** the glide-up starts before the zoom-to-centre transition fully settles
 *  (it's still finishing its last bit of ease-out), so the two motions
 *  overlap slightly instead of the glide only kicking in once the zoom has
 *  come to a complete stop. */
const LIFT_GLIDE_DELAY_MS = 620;
/** The gap above the boxes (from the header) and below them (from the bottom
 *  of the screen) — the same number both times, so the block sits evenly
 *  between the two. The boxes then take everything that's left. */
const SKILLS_BOX_V_GAP = 40;
/** how far the header glides up from the centre of the screen */
const HEADER_LIFT_VH = 39;

/** the three skill cards pop in with an actual macOS "genie" warp —
 *  https://harshil.net/blog/recreating-the-mac-genie-effect — all three at
 *  once, on one shared clock. `clip-path` can only move straight-line vertices, which reads as a
 *  shape shrinking in place; the real genie look comes from each horizontal
 *  row of the card travelling to the pinch point at ITS OWN pace (rows
 *  nearer the pinch point start moving sooner) with x and y easing
 *  independently, which is what makes the middle "belly" out while the ends
 *  taper — a fabric being pulled through a point, not a rectangle
 *  shrinking. The card itself (border, title strip, icons, labels) is what
 *  gets warped: it's snapshotted to a bitmap once, then drawn onto a single
 *  <canvas> band by band every frame — see `drawGenieFrame` — so everything
 *  travels as one object and each frame is only a few hundred cheap
 *  `drawImage` calls. (Warping live DOM copies of the card instead meant
 *  dozens of full card clones, each its own GPU layer — visibly laggy.) */
const GENIE_MS = 300;
/** height (card px) of each horizontal band of the snapshot drawn per
 *  frame — thin enough that the stepped edges read as one smooth curve */
const GENIE_BAND_PX = 2;
const clamp01 = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** ease-in-out-sine — used for both each row's horizontal (width) and
 *  vertical (position) motion. Ease-out-expo covered half its distance in
 *  the first 10% of the timeline, so each card leapt out of the pinch point
 *  too fast to see where it came from. Sine starts slowly — the card is
 *  visibly born at the centre of the page and pulled out from there — and
 *  its speed tapers all the way back to zero, so it still settles without
 *  a snap (unlike cubic, whose deceleration is crammed into the end). */
const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;

type GenieRect = { x: number; y: number; w: number; h: number };
type GeniePoint = { x: number; y: number };

/** where one card-local row (`row` px down from the card's top) sits at
 *  `rawT`: how far along that row is (staggered by its position, 0 = top
 *  row moves first), and where its left/right edges and y-position sit
 *  between the pinch point and the row's final place in `rect`. */
function genieRow(rect: GenieRect, pinch: GeniePoint, rawT: number, row: number) {
  const r = row / rect.h;
  // A row that starts later squeezes its whole curve into the time left;
  // sine still eases to a stop, so a wider stagger here exaggerates the
  // bellied, pulled-through-a-point shape without the last rows snapping.
  const xStart = r * 0.5;
  const xT = easeInOutSine(clamp01((rawT - xStart) / (1 - xStart), 0, 1));
  const yStart = r * 0.25;
  const yT = easeInOutSine(clamp01((rawT - yStart) / (1 - yStart), 0, 1));
  return {
    left: lerp(pinch.x, rect.x, xT),
    right: lerp(pinch.x, rect.x + rect.w, xT),
    y: lerp(pinch.y, rect.y + row, yT),
  };
}

/** draws one frame of one card's genie unfurl: the card's snapshot `img` is
 *  cut into `GENIE_BAND_PX`-tall bands, and each band [a, b) is stretched
 *  between row `a`'s and row `b`'s current genie positions. Stacked, the
 *  bands trace the bellied silhouette with the card's real content riding
 *  along inside. At rawT = 1 every band lands on its resting place, i.e.
 *  the card's exact layout. */
function drawGenieFrame(
  ctx: CanvasRenderingContext2D,
  img: HTMLCanvasElement,
  rect: GenieRect,
  pinch: GeniePoint,
  rawT: number,
) {
  const srcPerRow = img.height / rect.h;
  let top = genieRow(rect, pinch, rawT, 0);
  for (let a = 0; a < rect.h; a += GENIE_BAND_PX) {
    const b = Math.min(a + GENIE_BAND_PX, rect.h);
    const bottom = genieRow(rect, pinch, rawT, b);
    const left = (top.left + bottom.left) / 2;
    const width = (top.right + bottom.right) / 2 - left;
    const height = bottom.y - top.y;
    // skip slivers, and never draw a band flipped (upside-down glyphs)
    if (width >= 0.5 && height > 0) {
      // +0.5px overlap so neighbouring bands' antialiased edges don't leave
      // faint seams between them
      ctx.drawImage(img, 0, a * srcPerRow, img.width, (b - a) * srcPerRow, left, top.y, width, height + 0.5);
    }
    top = bottom;
  }
}

/** one skill card — the genie warp animates a snapshot of this exact
 *  element, so the animated version is literally the same markup.
 *
 *  Its subtitle sits in a filled-white header strip — bounded by the card's
 *  own top/left/right border plus this strip's own bottom edge, which is all
 *  the "line under the subtitle" needs to be, since the white-to-black
 *  colour change against the card's dark interior already reads as a
 *  dividing line without an extra stroke. `overflow-hidden` clips the
 *  strip's own square corners to the card's rounded ones. The subtitle text
 *  is coloured like the page background instead of ink, so it reads as a
 *  knockout cut from the white fill rather than white text sitting on top
 *  of it. */
function SkillsCard({
  index,
  className = "",
  style,
  ref,
}: {
  index: number;
  className?: string;
  style?: CSSProperties;
  ref?: Ref<HTMLDivElement>;
}) {
  return (
    <div
      ref={ref}
      className={`flex flex-col overflow-hidden rounded-[16px] border-[3px] border-white ${className}`}
      style={style}
    >
      <div className="flex shrink-0 items-center justify-center bg-white py-5">
        <span
          className="font-title text-[clamp(1.25rem,2.6vw,2.25rem)] uppercase tracking-wide"
          style={{ color: "var(--paper, #000)" }}
        >
          {SKILLS_BOX_TITLES[index]}
        </span>
      </div>
      {/* The card's height is dictated from outside (see `boxLayout`), so the
          grid takes what's left of it and divides that into three equal rows
          — `grid-rows-3` rather than auto rows. Sizing the tiles from the
          viewport instead used to overflow a card that wasn't tall enough for
          them, and `overflow-hidden` then ate the bottom row's labels. Three
          fixed rows also keep every card's rows at the same heights, so icons
          line up across all three. */}
      {/* Deliberately uneven vertical padding. Each label reserves two lines'
          worth of height (`h-9`) but most are one line, so every card ends
          with ~18px of empty space under the last row's text that the eye
          still reads as part of the bottom gap. Splitting that difference —
          8px off the bottom onto the top — is what makes the space above the
          first row of icons and below the last row's text look equal. */}
      <div className="grid min-h-0 flex-1 grid-cols-3 grid-rows-3 justify-items-center gap-x-5 gap-y-5 px-6 pt-8 pb-4">
        {SKILLS_BOX_ITEMS[index].map((item) => (
          <div key={item.name} className="flex min-h-0 w-full flex-col items-center gap-2.5">
            {/* square, and as big as the row leaves room for once the label
                below has taken its share */}
            <div
              className={`flex aspect-square min-h-0 flex-1 items-center justify-center rounded-lg border-2 border-white text-white ${item.iconPadding ?? "p-3"}`}
            >
              <item.Icon className="h-full w-full" />
            </div>
            {/* fixed height (two lines' worth) instead of letting the label
                grow with its own text — otherwise a long name (e.g. "CAD
                Modelling (Fusion 360)") wraps onto extra lines and makes
                THAT row taller than the same row in another card, throwing
                off cross-card alignment even though every tile above it is
                the same size. */}
            <span className="h-8 shrink-0 text-center font-title text-xs uppercase leading-tight tracking-wide text-white sm:h-9 sm:text-sm">
              {item.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
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
  // screen 2 — "Skills". Follows the laptop's scaled-up position, and sits a
  // little higher than it used to: the laptop grew upward, so the gap between
  // the bookshelf (bottom at y=226) and the bezel is tighter than before.
  { label: "Click", centerX: SCREENS[1].glass.x + SCREENS[1].glass.w / 2, top: 240 },
  // screen 3 (802,268,222,120) — "Experience"
  { label: "Click", centerX: 802 + 222 / 2, top: 214 },
  // screen 4 (1062,128,182,252) — the portrait monitor. Sits highest on the
  // desk, so its cue gets the least headroom
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
  // The canvas the genie warp is drawn on, all three cards at once — see
  // the effect below. Each card's real <div> stays invisible (see
  // `boxRevealed`) until its own warp reaches rawT=1, at which point the
  // warp has landed exactly on the card's resting layout, so swapping the
  // canvas frame for the real card is seamless.
  const genieCanvasRef = useRef<HTMLCanvasElement>(null);
  // the element carrying the zoom/glide transform — watched for
  // `transitionend` so the boxes are measured against a settled header
  const liftRef = useRef<HTMLDivElement>(null);
  // the real (resting) cards and the overlay they sit in — measured to get
  // each warp's exact end rect and pinch point
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const overlayRef = useRef<HTMLDivElement>(null);
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
      stageTimers.current.push(window.setTimeout(() => setStage("top"), LIFT_GLIDE_DELAY_MS));
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
        ? `scale(1) translateY(-${HEADER_LIFT_VH}vh)` // glide up to sit high on the page
        : "scale(1)";
  // Skills pivots on the viewport centre once it's open (so the glide-up
  // stays centred horizontally); every other screen keeps pivoting on the
  // click point throughout, since they never move again after opening.
  const overlayOrigin =
    isSkills && stage !== "closed" ? "50% 50%" : `${origin.x}% ${origin.y}%`;
  const overlayTiming =
    isSkills && stage !== "closed" ? LIFT_STAGE_TIMING[stage] : { ms: ZOOM_MS, ease: ZOOM_EASE };
  // Wait for the header's own glide-up transition to actually finish, then
  // measure its real (responsive) resting position so the boxes below it
  // can use an equal gap above and below by construction. Once that's
  // known, measure each box's own final rect and run the genie warp for
  // all three at once — see `drawGenieFrame` above — each unfurling from
  // the exact centre of the page, revealing the real cards only once the
  // shared warp finishes.
  useEffect(() => {
    if (!isSkills || stage !== "top") return;
    let cancelled = false;
    let rafId = 0;

    const canvas = genieCanvasRef.current;

    const run = async () => {
      const header = headerRef.current;
      if (!header || !canvas) return;
      const headerBottom = header.getBoundingClientRect().bottom;
      const top = headerBottom + SKILLS_BOX_V_GAP;
      // equal gap above and below: whatever is left between the header and
      // the bottom of the screen is the boxes'
      const height = window.innerHeight - top - SKILLS_BOX_V_GAP;
      // `flushSync` commits the new layout to the DOM right now, so the
      // (still invisible) real cards can be measured at their actual final
      // rects below. Each warp then ends exactly where its card already
      // sits, with no settling nudge once the real card takes over. Working
      // the rects out by hand from the CSS numbers instead drifted by a few
      // px: `vw` and `window.innerWidth` both count the page scrollbar, but
      // this fixed overlay's width doesn't.
      flushSync(() => setBoxLayout({ top, height }));
      // All in the overlay's own coordinates, which is what the canvas
      // (absolutely positioned inside it) draws in.
      const overlay = overlayRef.current!.getBoundingClientRect();
      const cards = [0, 1, 2].map((i) => cardRefs.current[i]!);
      const rects: GenieRect[] = cards.map((card) => {
        const r = card.getBoundingClientRect();
        return { x: r.left - overlay.left, y: r.top - overlay.top, w: r.width, h: r.height };
      });
      // centre of the overlay itself (not `window.innerWidth`, for the same
      // scrollbar reason)
      const pinch: GeniePoint = { x: overlay.width / 2, y: overlay.height / 2 };

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = overlay.width * dpr;
      canvas.height = overlay.height * dpr;
      const ctx = canvas.getContext("2d")!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Snapshot every card up front, at its final size — they're laid out
      // but invisible (opacity 0), so the snapshot's own root gets opacity 1.
      // The font CSS is gathered once and shared by all three.
      let snapshots: HTMLCanvasElement[];
      try {
        const fontEmbedCSS = await getFontEmbedCSS(cards[0]);
        snapshots = await Promise.all(
          cards.map((card) =>
            toCanvas(card, { pixelRatio: dpr, fontEmbedCSS, style: { opacity: "1" } }),
          ),
        );
      } catch {
        // can't snapshot (shouldn't happen) — just show the cards unanimated
        if (!cancelled) setBoxRevealed([true, true, true]);
        return;
      }
      if (cancelled) return;

      // All three cards share one clock: same start frame, same end frame.
      let start: number | null = null;
      const frame = (ts: number) => {
        if (cancelled) return;
        if (start === null) start = ts;
        const rawT = clamp01((ts - start) / GENIE_MS, 0, 1);
        ctx.clearRect(0, 0, overlay.width, overlay.height);
        if (rawT < 1) {
          rects.forEach((rect, i) => drawGenieFrame(ctx, snapshots[i], rect, pinch, rawT));
          rafId = requestAnimationFrame(frame);
        } else {
          // Fully open: the canvas was just cleared, and `flushSync` reveals
          // the real cards in this same frame, so there's never a frame with
          // neither (or both) showing.
          flushSync(() => setBoxRevealed([true, true, true]));
        }
      };
      rafId = requestAnimationFrame(frame);
    };

    // Wait for the glide to ACTUALLY finish before measuring. A bare
    // `setTimeout(LIFT_STAGE_TIMING.top.ms)` fired while the header was still
    // most of the way down the screen — the transition doesn't necessarily
    // begin on the same tick this effect is scheduled — and the boxes were
    // then sized against a header position they'd never rest at, which left
    // them hundreds of px too short and squashed the icons. `transitionend`
    // is the only thing that actually knows; the timeout stays as a fallback
    // in case the transition is interrupted or never fires at all.
    const lift = liftRef.current;
    let started = false;
    const start = () => {
      if (started || cancelled) return;
      started = true;
      lift?.removeEventListener("transitionend", onEnd);
      void run();
    };
    const onEnd = (e: TransitionEvent) => {
      if (e.target === lift && e.propertyName === "transform") start();
    };
    lift?.addEventListener("transitionend", onEnd);
    const t = window.setTimeout(start, LIFT_STAGE_TIMING.top.ms + 600);
    return () => {
      cancelled = true;
      lift?.removeEventListener("transitionend", onEnd);
      window.clearTimeout(t);
      cancelAnimationFrame(rafId);
      // don't leave a half-drawn frame behind for the next time Skills opens
      canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
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
          data-desk
          className="relative w-full"
          style={{ aspectRatio: `${DESK_VIEWBOX.w} / ${DESK_VIEWBOX.h}` }}
        >
          <DeskSvg className="absolute inset-0 h-full w-full" lampOn={lampOn} />
          {/* screen 1's contents — a little desktop with the board turning in
              a window. Sits between the desk art and the click targets below,
              and is `pointer-events-none`, so its own screen's button still
              takes the click. */}
          <ProjectsMonitorScreen />
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
              data-screen={s.id}
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
            ref={overlayRef}
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
              ref={liftRef}
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
              {content && (
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
                Each card stays invisible until its own genie warp (the
                canvas below, drawn from a snapshot of this same card)
                reaches its last frame, at which point it's revealed at the
                exact same position/size the warp just settled into — a seamless
                handoff from "animated warp" to "real card". */}
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
                  <SkillsCard
                    key={i}
                    ref={(el) => {
                      cardRefs.current[i] = el;
                    }}
                    index={i}
                    className="relative flex-1"
                    style={{ opacity: boxRevealed[i] ? 1 : 0 }}
                  />
                ))}
              </div>
            )}
            {/* the genie warp itself — one shared canvas covering the whole
                overlay, drawn from each card's snapshot by the effect above */}
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
