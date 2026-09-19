"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { MouseEvent } from "react";
import { createPortal, flushSync } from "react-dom";
import { getFontEmbedCSS, toCanvas } from "html-to-image";
import { DESK_VIEWBOX, SCREENS, percentBox, type Rect, type ScreenSpec } from "@/lib/desk";
import { SECTIONS, type SectionId } from "@/lib/site";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import DeskSvg from "./DeskSvg";
import DeskCardList from "./DeskCardList";
import ProjectsMonitorScreen from "./ProjectsMonitorScreen";
import ScreenCard from "./ScreenCard";
import { hasSwappedTitleFonts, headerFontClass, sectionCards } from "./sections";

/**
 * The desk, its four clickable screens, and the fullscreen view each one
 * opens into.
 *
 * Every screen follows the same grammar, so the four sections read as one
 * system with four different contents:
 *
 *   on the desk — a white title strip (`ScreenTitleBar`) over the section's
 *                 own live animation
 *   on click    — one smooth zoom from the click point to a centred
 *                 fullscreen title, a quick glide up into a header, then the
 *                 section's cards unfurl beneath it with a macOS genie warp
 *   opened      — header + a row of `ScreenCard`s; only the card bodies differ
 *                 per section (see `sections/`)
 *
 * This is an illusion, not a literal camera zoom: continuously scaling the
 * whole hand-drawn desk SVG up to fill the viewport would crop it unevenly
 * (its aspect ratio rarely matches the viewport's) and drag along whatever
 * scroll-driven transform `DeskStage` has applied to an ancestor. Instead, a
 * separate, purpose-built fullscreen view fades/scales in from the click
 * point, portaled straight to `<body>` so it isn't nested inside — and
 * doesn't inherit — any transformed ancestor.
 */

/** eases like the "expo out" curve most CSS zoom-in effects use — a fast
 *  start that settles in slowly, which is what makes a scale read as a
 *  deliberate zoom instead of a snap */
const ZOOM_EASE = "cubic-bezier(0.16, 1, 0.3, 1)";
const ZOOM_MS = 900;

/** The two-stage opening: one smooth, uninterrupted zoom straight from the
 *  click point to centred-fullscreen, then — once open — a quick glide up to
 *  sit near the top of the page, like a label growing into a full-page title
 *  that settles into a header, leaving the rest of the page for the cards. */
type OverlayStage = "closed" | "center" | "top";
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
/** The minimum gap above the cards (from the header) and below them (from the
 *  bottom of the screen). The cards take `CARD_HEIGHT_SCALE` of what's left
 *  between the two, so the gap below ends up a little larger. */
const CARD_V_GAP = 40;
/** the cards take this share of the height left between the header gap and
 *  the bottom gap, leaving the rest as extra room under the row */
const CARD_HEIGHT_SCALE = 0.88;
/** how far the whole row (cards and everything in them) is moved down from
 *  just under the header, in px — never more than the spare room under the
 *  row, so the bottom gap never drops below `CARD_V_GAP` */
const CARD_TOP_SHIFT = 28;
/** how far the header glides up from the centre of the screen */
const HEADER_LIFT_VH = 39;
/** more cards than this wrap onto a second row */
const MAX_CARDS_PER_ROW = 4;

/** the cards pop in with an actual macOS "genie" warp —
 *  https://harshil.net/blog/recreating-the-mac-genie-effect — all at once, on
 *  one shared clock. `clip-path` can only move straight-line vertices, which
 *  reads as a shape shrinking in place; the real genie look comes from each
 *  horizontal row of the card travelling to the pinch point at ITS OWN pace
 *  (rows nearer the pinch point start moving sooner) with x and y easing
 *  independently, which is what makes the middle "belly" out while the ends
 *  taper — a fabric being pulled through a point, not a rectangle shrinking.
 *  The card itself (border, title strip, body) is what gets warped: it's
 *  snapshotted to a bitmap once, then drawn onto a single <canvas> band by
 *  band every frame — see `drawGenieFrame` — so everything travels as one
 *  object and each frame is only a few hundred cheap `drawImage` calls.
 *  (Warping live DOM copies of the card instead meant dozens of full card
 *  clones, each its own GPU layer — visibly laggy.) */
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

type GeniePoint = { x: number; y: number };

/** where one card-local row (`row` px down from the card's top) sits at
 *  `rawT`: how far along that row is (staggered by its position, 0 = top
 *  row moves first), and where its left/right edges and y-position sit
 *  between the pinch point and the row's final place in `rect`. */
function genieRow(rect: Rect, pinch: GeniePoint, rawT: number, row: number) {
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
  rect: Rect,
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

/** the lamp's pull-chain handle, in desk viewBox units — a generous hit box
 *  around the chain of beads drawn in `DeskSvg`. The chain's own attach point
 *  is (1017,169) local to the tilted head group, which — carried through that
 *  group's 15° rotation and the lamp group's translate(-5,0) — lands around
 *  (998,172) on screen; the chain then hangs straight down from there to the
 *  handle at dy 20–24. */
const LAMP_CHAIN_HIT: Rect = { x: 988, y: 165, w: 22, h: 42 };

/** one "click here" cue per screen — a bouncing title-font label with a pair
 *  of small arrowheads underneath, sitting in the gap between the wall shelf
 *  and each screen's own bezel (positions in `SCREENS[].cue`) */
function ScreenCue({ centerX, top }: ScreenSpec["cue"]) {
  return (
    <div
      aria-hidden
      className="bounce-cue pointer-events-none absolute flex -translate-x-1/2 flex-col items-center text-white/70"
      style={{
        left: `${(centerX / DESK_VIEWBOX.w) * 100}%`,
        top: `${(top / DESK_VIEWBOX.h) * 100}%`,
      }}
    >
      <span className="font-title text-[13px] uppercase tracking-wide sm:text-[15px]">Click</span>
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
    <svg width="9" height="5" viewBox="0 0 9 5" fill="none" aria-hidden className={className}>
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
  const [openId, setOpenId] = useState<SectionId | null>(null);
  const [lampOn, setLampOn] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  // How big the clicked screen's glass was on screen, as a fraction of the
  // viewport — the fullscreen content starts at this scale (roughly the
  // source element's own size) instead of from an invisible speck, so it
  // reads as that same content growing to fill the screen, not something new
  // popping in.
  const [startScale, setStartScale] = useState(0.05);
  // The section last opened. Never cleared back to null (just left showing
  // whatever was last opened, hidden behind the closed overlay): the header
  // below is one persistent element whose `transform` is simply reassigned,
  // and unmounting it would leave the next open with no prior frame to
  // transition from — it would snap straight to its target scale instead of
  // animating.
  const [content, setContent] = useState<SectionId | null>(null);
  // Drives the persistent wrapper's transform: "closed" → "center" on click,
  // then on to "top" once fully open (see `openScreen`).
  const [stage, setStage] = useState<OverlayStage>("closed");
  const stageTimers = useRef<number[]>([]);
  // Measured once the header has finished gliding up, so the cards below it
  // can sit exactly where "equal gap above, equal gap below" actually lands
  // for the header's real (responsive) size — rather than a guessed CSS
  // position.
  const headerRef = useRef<HTMLDivElement>(null);
  const [boxLayout, setBoxLayout] = useState<{ top: number; height: number } | null>(null);
  // The canvas the genie warp is drawn on, every card at once — see the
  // effect below. The real cards stay invisible (see `cardsRevealed`) until
  // the warp reaches rawT=1, at which point it has landed exactly on the
  // cards' resting layout, so swapping the canvas frame for the real cards is
  // seamless.
  const genieCanvasRef = useRef<HTMLCanvasElement>(null);
  // the element carrying the zoom/glide transform — watched for
  // `transitionend` so the cards are measured against a settled header
  const liftRef = useRef<HTMLDivElement>(null);
  // the real (resting) cards and the overlay they sit in — measured to get
  // each warp's exact end rect and pinch point
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [cardsRevealed, setCardsRevealed] = useState(false);
  const reduced = usePrefersReducedMotion();
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

  // No scroll lock here: toggling `overflow: hidden` on <html> makes Chrome
  // reset `window.scrollY` to 0 the instant it happens. `DeskStage` reads
  // `window.scrollY` on every scroll/resize to position the desk, so that
  // reset made it visibly snap to its "resting" (unscrolled) frame the moment
  // a screen opened, and it never scrolled back once closed. The fullscreen
  // overlay is opaque, so background scroll while it's open is harmless.

  const openScreen = useCallback(
    (e: MouseEvent<HTMLButtonElement>, s: ScreenSpec) => {
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
      setContent(s.id);
      // a long section may have been left scrolled down last time
      overlayRef.current?.scrollTo(0, 0);
      setOpenId(s.id);

      clearStageTimers();
      setStage("center");
      // One smooth zoom straight to centred-fullscreen, then — just before
      // it's fully settled — glide up to the header spot.
      stageTimers.current.push(
        window.setTimeout(() => setStage("top"), reduced ? 0 : LIFT_GLIDE_DELAY_MS),
      );
    },
    [clearStageTimers, reduced],
  );

  const close = useCallback(() => {
    clearStageTimers();
    setStage("closed");
    setOpenId(null);
    setBoxLayout(null);
    setCardsRevealed(false);
  }, [clearStageTimers]);

  const toggleLamp = useCallback(() => setLampOn((v) => !v), []);

  const zoomed = openId !== null;
  const cards = content ? sectionCards(content, { layout: "row", active: zoomed }) : [];
  const cardCount = cards.length;
  const columns = Math.min(cardCount, MAX_CARDS_PER_ROW);
  const rowMaxWidth = cards[0]?.maxWidth;
  const rowFitsContent = cards[0]?.fitContent ?? false;

  const overlayTransform =
    stage === "closed"
      ? `scale(${startScale})`
      : stage === "top"
        ? `scale(1) translateY(-${HEADER_LIFT_VH}vh)` // glide up to sit high on the page
        : "scale(1)";
  // Pivots on the click point while zooming in and out, and on the viewport
  // centre once open, so the glide-up stays centred horizontally.
  const overlayOrigin = stage === "top" ? "50% 50%" : `${origin.x}% ${origin.y}%`;
  const overlayTiming = stage === "closed" ? { ms: ZOOM_MS, ease: ZOOM_EASE } : LIFT_STAGE_TIMING[stage];
  const transitionMs = reduced ? 0 : overlayTiming.ms;

  // Wait for the header's own glide-up transition to actually finish, then
  // measure its real (responsive) resting position so the cards below it can
  // use an equal gap above and below by construction. Once that's known,
  // measure each card's own final rect and run the genie warp for all of
  // them at once — see `drawGenieFrame` above — each unfurling from the exact
  // centre of the page, revealing the real cards only once the shared warp
  // finishes.
  useEffect(() => {
    if (content === null || stage !== "top") return;
    let cancelled = false;
    let rafId = 0;

    const canvas = genieCanvasRef.current;

    const run = async () => {
      const header = headerRef.current;
      if (!header || !canvas) return;
      const headerBottom = header.getBoundingClientRect().bottom;
      const baseTop = headerBottom + CARD_V_GAP;
      // most of what's left between the header gap and the bottom gap is the
      // cards' — see `CARD_HEIGHT_SCALE`
      const available = window.innerHeight - baseTop - CARD_V_GAP;
      const height = available * CARD_HEIGHT_SCALE;
      const top = baseTop + Math.min(CARD_TOP_SHIFT, available - height);
      // `flushSync` commits the new layout to the DOM right now, so the
      // (still invisible) real cards can be measured at their actual final
      // rects below. Each warp then ends exactly where its card already
      // sits, with no settling nudge once the real card takes over. Working
      // the rects out by hand from the CSS numbers instead drifted by a few
      // px: `vw` and `window.innerWidth` both count the page scrollbar, but
      // this fixed overlay's width doesn't.
      flushSync(() => setBoxLayout({ top, height }));
      if (reduced) {
        flushSync(() => setCardsRevealed(true));
        return;
      }
      // All in the overlay's own coordinates, which is what the canvas
      // (absolutely positioned inside it) draws in.
      const overlay = overlayRef.current!.getBoundingClientRect();
      const els = cardRefs.current
        .slice(0, cardCount)
        .filter((c): c is HTMLDivElement => c !== null);
      const rects: Rect[] = els.map((card) => {
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
      // The font CSS is gathered once and shared by all of them.
      let snapshots: HTMLCanvasElement[];
      try {
        const fontEmbedCSS = await getFontEmbedCSS(els[0]);
        snapshots = await Promise.all(
          els.map((card) =>
            toCanvas(card, { pixelRatio: dpr, fontEmbedCSS, style: { opacity: "1" } }),
          ),
        );
      } catch {
        // can't snapshot — just show the cards unanimated
        if (!cancelled) setCardsRevealed(true);
        return;
      }
      if (cancelled) return;

      // Every card shares one clock: same start frame, same end frame.
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
          flushSync(() => setCardsRevealed(true));
        }
      };
      rafId = requestAnimationFrame(frame);
    };

    // Wait for the glide to ACTUALLY finish before measuring, or the cards are
    // sized against a header position they'll never rest at. Neither a bare
    // timeout (the transition doesn't necessarily begin on the tick this
    // effect runs) nor `transitionend` (it fired as the glide *started*,
    // once the zoom it interrupts was retargeted) can be trusted, so this
    // asks the element itself: flush styles so the glide has definitely
    // begun, then wait on every transition still running on it — looping,
    // since finishing one can't start another but a retarget can replace
    // one. The timeout is only a backstop, and under reduced motion there's
    // nothing running so it resolves at once.
    const lift = liftRef.current;
    let started = false;
    const start = () => {
      if (started || cancelled) return;
      started = true;
      void run();
    };
    const settle = async () => {
      if (!lift) return;
      lift.getBoundingClientRect();
      for (let i = 0; i < 4; i++) {
        const running = lift.getAnimations().filter((a) => a.playState !== "finished");
        if (running.length === 0) break;
        await Promise.allSettled(running.map((a) => a.finished));
      }
    };
    void settle().then(start);
    const t = window.setTimeout(start, reduced ? 0 : LIFT_STAGE_TIMING.top.ms + ZOOM_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
      cancelAnimationFrame(rafId);
      // don't leave a half-drawn frame behind for the next open
      canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [content, stage, cardCount, reduced]);

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
          {/* screen 1's contents — the board turning under its title strip.
              Sits between the desk art and the click targets below, and is
              `pointer-events-none`, so its own screen's button still takes
              the click. */}
          <ProjectsMonitorScreen />
          <button
            type="button"
            aria-label={lampOn ? "Turn lamp off" : "Turn lamp on"}
            aria-pressed={lampOn}
            onClick={toggleLamp}
            onMouseDown={(e) => e.preventDefault()}
            className="absolute cursor-pointer outline-none"
            style={percentBox(LAMP_CHAIN_HIT)}
          />
          {SCREENS.map((s) => (
            <button
              key={s.id}
              data-screen={s.id}
              type="button"
              aria-label={`Open ${SECTIONS[s.id].deskLabel}`}
              onClick={(e) => openScreen(e, s)}
              // Prevents the browser's default focus-on-click: with the desk
              // sitting inside a `position: sticky` + transformed ancestor,
              // focusing this button made some browsers snap-scroll the page
              // to this element's untransformed layout position — visible as
              // the whole desk "teleporting" the instant it was clicked.
              onMouseDown={(e) => e.preventDefault()}
              className="absolute cursor-pointer outline-none"
              style={percentBox(s.glass)}
            />
          ))}
          {SCREENS.map((s) => (
            <ScreenCue key={s.id} {...s.cue} />
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
            role="dialog"
            aria-label={content ? SECTIONS[content].deskLabel : undefined}
            onClick={close}
            // A section sized to its content (Experience) can run past the
            // bottom of the screen, so the view itself scrolls like a page —
            // no scrollbar drawn. The desk page runs Lenis, which listens for
            // wheel events on the whole window; `data-lenis-prevent` hands
            // this element's scrolling back to the browser, and
            // `overscroll-contain` stops it chaining to the desk behind.
            data-lenis-prevent
            className="no-scrollbar fixed inset-0 z-50 flex cursor-pointer items-center justify-center overflow-y-auto overscroll-contain"
            style={{
              backgroundColor: "var(--paper, #000)",
              opacity: zoomed ? 1 : 0,
              pointerEvents: zoomed ? "auto" : "none",
              transition: `opacity ${reduced ? 0 : ZOOM_MS}ms ${ZOOM_EASE}`,
            }}
          >
            <button
              type="button"
              tabIndex={zoomed ? 0 : -1}
              onClick={(e) => {
                e.stopPropagation();
                close();
              }}
              aria-label="Close and return to the desk"
              className="fixed right-4 top-4 z-10 rounded px-2 py-1 font-mono text-xs text-white/60 ring-1 ring-inset ring-white/15 transition-colors hover:text-white"
            >
              esc ✕
            </button>

            {/* One persistent wrapper — never unmounted — carries the scale
                transition; only its text swaps underneath it. */}
            <div
              ref={liftRef}
              className="flex h-full w-full items-center justify-center"
              style={{
                transform: overlayTransform,
                transformOrigin: overlayOrigin,
                transition: `transform ${transitionMs}ms ${overlayTiming.ease}, transform-origin ${transitionMs}ms ${overlayTiming.ease}`,
              }}
            >
              {/* the same label the screen wears in its title strip, grown to
                  fill the screen — a fresh element, not a scaled copy of the
                  desk SVG, so it stays crisp at any viewport size */}
              {content && (
                <div
                  ref={headerRef}
                  className={`px-8 text-center uppercase leading-none ${headerFontClass(content)}`}
                  style={{ fontSize: "clamp(2rem, 8vw, 6rem)", color: "var(--ink, #f4f6f8)" }}
                >
                  {SECTIONS[content].screenLabel}
                </div>
              )}
            </div>

            {/* The section's cards. A sibling of the header wrapper (not a
                child) so they don't inherit its scale/glide transform. Sized
                to exactly fill what's left of the screen once `boxLayout` is
                measured: full width minus equal side margins, and the equal
                gap above (to the header) / below (to the screen's bottom
                edge). They stay invisible until the genie warp (the canvas
                below, drawn from snapshots of these same cards) reaches its
                last frame, then take over at the exact position/size the
                warp settled into. Clicks inside a card don't close the
                overlay — only the ground around them does. */}
            <div
              aria-hidden={!cardsRevealed}
              onClick={(e) => {
                if ((e.target as Element).closest("[data-screen-card]")) e.stopPropagation();
              }}
              className="absolute inset-x-[3vw] grid gap-[3vw]"
              style={{
                gridTemplateColumns: `repeat(${Math.max(columns, 1)}, minmax(0, 1fr))`,
                gridAutoRows: rowFitsContent ? "auto" : "minmax(0, 1fr)",
                // absolutely placed between two insets, so a max width plus
                // auto side margins centres the row
                ...(rowMaxWidth && { maxWidth: rowMaxWidth, marginInline: "auto" }),
                pointerEvents: cardsRevealed ? "auto" : "none",
                ...(boxLayout
                  ? rowFitsContent
                    ? // as tall as its content, with the usual gap kept
                      // below it when the view scrolls to the end
                      { top: boxLayout.top, paddingBottom: CARD_V_GAP }
                    : { top: boxLayout.top, height: boxLayout.height }
                  : { top: "60%", height: "30vh", transform: "translateY(-50%)" }),
              }}
            >
              {cards.map((card, i) => (
                <ScreenCard
                  key={`${content}-${card.key}`}
                  ref={(el) => {
                    cardRefs.current[i] = el;
                  }}
                  title={card.title}
                  monoTitle={hasSwappedTitleFonts(content!)}
                  bare={card.bare}
                  className="relative cursor-auto"
                  style={{ opacity: cardsRevealed ? 1 : 0 }}
                >
                  {card.body}
                </ScreenCard>
              ))}
            </div>
            {/* the genie warp itself — one shared canvas covering the whole
                overlay, drawn from each card's snapshot by the effect above */}
            <canvas
              ref={genieCanvasRef}
              aria-hidden
              className="pointer-events-none absolute inset-0 h-full w-full"
            />
          </div>,
          document.body,
        )}
    </div>
  );
}
