"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
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
 * ("Section 1/2/3") that will become the real section titles later.
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
    label: "Section 1",
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

/** the lamp's pull-chain handle, in the same viewBox units as `SCREENS` —
 *  a generous hit box around the chain of beads drawn in `DeskSvg`. The
 *  chain's own attach point is (1017,169) local to the tilted head group,
 *  which — carried through that group's 15° rotation and the lamp group's
 *  translate(-5,0) — lands around (998,172) on screen; the chain then hangs
 *  straight down from there to the handle at dy 20–24. */
const LAMP_CHAIN_HIT: Rect = { x: 988, y: 165, w: 22, h: 42 };

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
  // `document.body` doesn't exist during SSR — this flips to true only once
  // mounted on the client, without a setState-in-effect.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

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
  }, []);

  const close = useCallback(() => setOpenId(null), []);

  const toggleLamp = useCallback(() => setLampOn((v) => !v), []);

  const zoomed = openId !== null;

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
                transform: zoomed ? "scale(1)" : `scale(${startScale})`,
                transformOrigin: `${origin.x}% ${origin.y}%`,
                transition: `transform ${ZOOM_MS}ms ${ZOOM_EASE}`,
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
                  className="px-8 text-center font-mono"
                  style={{
                    fontSize: "clamp(2rem, 8vw, 6rem)",
                    color: "var(--ink, #f4f6f8)",
                  }}
                >
                  {content.label}
                </div>
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
