/**
 * Desk scene geometry shared by the pixel desk (`DeskSvg`, drawn by
 * `scripts/desk-pixels.mjs`, which reads these) and the HTML layers that sit
 * over it (`DeskScene`'s click targets and screen labels).
 *
 * Coordinate space is `DESK_VIEWBOX`. Positions are converted to `%` of the
 * viewBox so the HTML overlay layer stays glued to the SVG at every width.
 * This file imports only types, so the generator (plain Node) can load it.
 */

import type { SectionId } from "./site";

/** `x` pans the view: the desk was widened 24 on its right end to fit the
 *  speaker, so the view shifts right by half that to keep it centred */
export const DESK_VIEWBOX = { x: 12, w: 1600, h: 740 } as const;

/** The desk is pixel art, like the lotus under it: one art pixel is this
 *  many desk units (≈3 screen px with the desk at rest, ≈4 at its framed
 *  beat mid-scroll) */
export const DESK_PX = 4;

/** the pixel grid over the view, from its top-left corner — which puts the
 *  desktop's top (y 396) on a pixel edge. 400 × 185 art pixels. */
export const DESK_GRID = {
  x: DESK_VIEWBOX.x,
  y: 0,
  cols: DESK_VIEWBOX.w / DESK_PX,
  rows: Math.ceil(DESK_VIEWBOX.h / DESK_PX),
} as const;

/** how far in from each end of the view the floor line stops, in desk
 *  units — the sign-off under the desk (`DeskStage`) starts where it does */
export const DESK_FLOOR_INSET = 40;

export type Rect = { x: number; y: number; w: number; h: number };

/**
 * Screen 2 — the smaller laptop — is drawn at its original coordinates (in
 * the pixel desk's generator) and then scaled up in place.
 *
 * Anchored at (`ax`, `ay`): `ay` is the desk surface, so the laptop grows
 * upward and stays planted on it rather than floating or sinking, and `ax` is
 * its own horizontal centre so it grows evenly about itself. `dx` then nudges
 * the whole thing right. `scale` is bounded by its neighbours — screen 1's
 * bezel ends at x=584 and screen 3's base starts at x=792, and at 1.12 with
 * dx=12 this laptop spans ~596..782, clearing both by ~10.
 */
export const LAPTOP1 = { scale: 1.12, dx: 12, ax: 677, ay: 396 } as const;

export const LAPTOP1_TRANSFORM =
  `translate(${LAPTOP1.dx} 0) translate(${LAPTOP1.ax} ${LAPTOP1.ay}) ` +
  `scale(${LAPTOP1.scale}) translate(${-LAPTOP1.ax} ${-LAPTOP1.ay})`;

/** the cylindrical portable speaker standing upright right of the portrait
 *  monitor (the pixel desk): its centreline, its width, the crest of its domed
 *  top, and the bottom of its body at the sides — it stands on a rubber
 *  base `base` tall, on the desk */
export const SPEAKER = {
  cx: 1290,
  w: 48,
  top: 292,
  bottom: 390,
  base: 6,
} as const;

/** the whole speaker, crest to base — what's hovered to open its popup, and
 *  where the popup stands */
export const SPEAKER_RECT: Rect = {
  x: SPEAKER.cx - SPEAKER.w / 2,
  y: SPEAKER.top,
  w: SPEAKER.w,
  h: SPEAKER.bottom + SPEAKER.base - SPEAKER.top,
};

/** the tip of the tallest leaf of the snake plant beside the speaker
 *  (the pixel desk) — the speaker's popup stands clear above it, so it
 *  never covers the plant */
export const PLANT_TOP = 288;

export type ScreenSpec = {
  id: SectionId;
  /** the glass in desk units: the opening inside the screen's bezel, on
   *  whole art pixels (`DESK_PX`), so what's shown on it — an HTML layer
   *  over the desk (`DeskScene`) — lines up with the pixels round it. The
   *  pixel desk (`scripts/desk-pixels.mjs`) cuts each opening from here. */
  glass: Rect;
};

/**
 * In reading order, left to right across the desk — each glass three art
 * pixels inside its screen's outer edge, all round:
 *   projects   — screen 1, landscape monitor   `Screen x={382} y={239} w={202} h={138}`
 *   skills     — screen 2, small laptop        `Screen x={602} y={300} w={150} h={90}`, scaled by `LAPTOP1`
 *   experience — screen 3, larger laptop       `Screen x={802} y={268} w={222} h={120}`
 *   about      — screen 4, portrait monitor    `Screen x={1062} y={128} w={182} h={252}`
 */
export const SCREENS: ScreenSpec[] = [
  {
    id: "projects",
    glass: { x: 392, y: 248, w: 180, h: 120 },
  },
  {
    id: "skills",
    glass: { x: 616, y: 300, w: 148, h: 80 },
  },
  {
    id: "experience",
    glass: { x: 812, y: 280, w: 200, h: 96 },
  },
  {
    id: "about",
    glass: { x: 1072, y: 140, w: 160, h: 228 },
  },
];

/** desk units → a CSS length that scales with the desk, via the container
 *  query width of `[data-desk]` (the full viewBox width is 100cqw) */
export const deskUnits = (u: number) => `${(u / DESK_VIEWBOX.w) * 100}cqw`;

/** left/top/width/height as `%` strings, for absolutely positioning an HTML
 *  element over a desk rect */
export function percentBox(r: Rect) {
  return {
    left: `${((r.x - DESK_VIEWBOX.x) / DESK_VIEWBOX.w) * 100}%`,
    top: `${(r.y / DESK_VIEWBOX.h) * 100}%`,
    width: `${(r.w / DESK_VIEWBOX.w) * 100}%`,
    height: `${(r.h / DESK_VIEWBOX.h) * 100}%`,
  };
}
