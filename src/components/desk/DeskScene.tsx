"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { MouseEvent } from "react";
import { createPortal } from "react-dom";
import { DESK_VIEWBOX } from "@/lib/desk";
import DeskSvg from "./DeskSvg";
import DeskCardList from "./DeskCardList";

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
/** the three placeholder cards pop in with the macOS "genie" treatment —
 *  https://harshil.net/blog/recreating-the-mac-genie-effect — not a plain
 *  scale from nothing, but a `clip-path` that's pinched down to a single
 *  point and unfurls into the full rectangle. A `polygon()` clip can only
 *  interpolate straight-line vertices (no bezier), so the "funnel" look is
 *  faked with 8 points — the 4 corners collapse straight onto the pinch
 *  point, while the 4 edge-midpoints lag a little behind it (`BELLY`),
 *  giving the collapsed shape a small four-pointed sliver instead of a
 *  flat dot — which is what reads as "being pulled through a point"
 *  rather than "shrinking in place". */
const SKILLS_BOX_POP = { ms: 550, ease: "cubic-bezier(0.65, 0, 0.35, 1)" };
const SKILLS_BOX_BELLY = 10;
const SKILLS_BOX_OPEN_CLIP =
  "polygon(0% 0%, 50% 0%, 100% 0%, 100% 50%, 100% 100%, 50% 100%, 0% 100%, 0% 50%)";
function genieClipPath(pinchXPercent: number, pinchYPercent: number) {
  const b = SKILLS_BOX_BELLY;
  const pt = (x: number, y: number) => `${x}% ${y}%`;
  return `polygon(${[
    pt(pinchXPercent, pinchYPercent),
    pt(pinchXPercent, pinchYPercent - b),
    pt(pinchXPercent, pinchYPercent),
    pt(pinchXPercent + b, pinchYPercent),
    pt(pinchXPercent, pinchYPercent),
    pt(pinchXPercent, pinchYPercent + b),
    pt(pinchXPercent, pinchYPercent),
    pt(pinchXPercent - b, pinchYPercent),
  ].join(", ")})`;
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
  const boxRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [boxLayout, setBoxLayout] = useState<{ top: number; height: number } | null>(null);
  // Per-box genie pinch point, in that box's own % (can and often does land
  // outside 0–100, since two of the three boxes don't contain the shared
  // point themselves) — so all three visibly pinch down to and unfurl from
  // the same single spot: the exact centre of the page. Measured via
  // offsetLeft/offsetWidth (unaffected by the clip-path) once the row has
  // its final layout.
  const [boxPinch, setBoxPinch] = useState<{ x: number; y: number }[]>([
    { x: 50, y: 50 },
    { x: 50, y: 50 },
    { x: 50, y: 50 },
  ]);
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
  // the three content cards only pop once they have a real, measured layout
  const boxesPopped = isSkills && stage === "top" && boxLayout !== null;

  // Wait for the header's own glide-up transition to actually finish, then
  // measure its real (responsive) resting position so the boxes below it
  // can use an equal gap above and below by construction, and work out
  // each box's own genie pinch point — expressed in that box's local % —
  // so all three unfurl from the exact centre of the page.
  useEffect(() => {
    if (!isSkills || stage !== "top") return;
    const measure = () => {
      const header = headerRef.current;
      if (!header) return;
      const headerBottom = header.getBoundingClientRect().bottom;
      const top = headerBottom + SKILLS_BOX_V_GAP;
      const height = window.innerHeight - top - SKILLS_BOX_V_GAP;
      setBoxLayout({ top, height });

      const boxes = boxRefs.current;
      if (boxes.length && boxes.every(Boolean)) {
        const row = boxes[0]!.parentElement!;
        const rowLeft = row.getBoundingClientRect().left;
        const pageCenterX = window.innerWidth / 2;
        const pageCenterY = window.innerHeight / 2;
        const pinchY = ((pageCenterY - top) / height) * 100;
        setBoxPinch(
          boxes.map((b) => ({
            x: ((pageCenterX - (rowLeft + b!.offsetLeft)) / b!.offsetWidth) * 100,
            y: pinchY,
          })),
        );
      }
    };
    const t = window.setTimeout(measure, SKILLS_STAGE_TIMING.top.ms);
    window.addEventListener("resize", measure);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("resize", measure);
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
                Each card's own `clip-path` is pinched down to
                `boxPinch[i]` — the exact centre of the page, in that
                box's own local % — and unfurls to the full rectangle, the
                macOS genie effect rather than a plain scale-from-nothing;
                see `genieClipPath` above. */}
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
                    ref={(el) => {
                      boxRefs.current[i] = el;
                    }}
                    className="flex-1 rounded-2xl border border-white"
                    style={{
                      clipPath: boxesPopped
                        ? SKILLS_BOX_OPEN_CLIP
                        : genieClipPath(boxPinch[i].x, boxPinch[i].y),
                      transition: `clip-path ${SKILLS_BOX_POP.ms}ms ${SKILLS_BOX_POP.ease}`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}
