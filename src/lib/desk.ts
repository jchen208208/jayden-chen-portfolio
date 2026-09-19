/**
 * Desk scene geometry shared by the SVG (`DeskSvg`) and the HTML layers that
 * sit over it (`DeskScene`'s click targets and cues, `ProjectsMonitorScreen`).
 *
 * Coordinate space is `DESK_VIEWBOX`. Positions are converted to `%` of the
 * viewBox so the HTML overlay layer stays glued to the SVG at every width.
 */

import type { SectionId } from "./site";

export const DESK_VIEWBOX = { w: 1600, h: 740 } as const;

export type Rect = { x: number; y: number; w: number; h: number };

/**
 * Screen 2 — the smaller laptop — is drawn at its original coordinates in
 * `DeskSvg` and then scaled up in place.
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

/** Maps a rect drawn inside that group to where it actually lands on the
 *  desk. The click target and zoom origin live outside the SVG and so don't
 *  inherit the transform. */
export function laptop1Rect(r: Rect): Rect {
  const { scale, dx, ax, ay } = LAPTOP1;
  return {
    x: dx + ax + (r.x - ax) * scale,
    y: ay + (r.y - ay) * scale,
    w: r.w * scale,
    h: r.h * scale,
  };
}

export type ScreenSpec = {
  id: SectionId;
  /** the glass rectangle in desk units, as it lands on screen — must track the
   *  inset rect `DeskSvg` draws for that screen */
  glass: Rect;
  /** where this screen's bouncing "Click" cue sits: its centre x and top, in
   *  desk units — hand-picked so the cue clears whatever's drawn above that
   *  particular screen (the wall shelf, the lamp, the toolboxes) */
  cue: { centerX: number; top: number };
};

/** Screen 2's glass at its ORIGINAL, unscaled coordinates — what
 *  `LaptopSkillsScreen` draws in, inside the `LAPTOP1_TRANSFORM` group. */
export const SKILLS_GLASS_LOCAL: Rect = { x: 611, y: 309, w: 132, h: 72 };

/**
 * In reading order, left to right across the desk:
 *   projects   — screen 1, landscape monitor   `Screen x={382} y={239} w={202} h={138}` (inset 10)
 *   skills     — screen 2, small laptop        `Screen x={602} y={300} w={150} h={90} inset={9}`, scaled by `LAPTOP1`
 *   experience — screen 3, larger laptop       `Screen x={802} y={268} w={222} h={120} inset={10}`
 *   about      — screen 4, portrait monitor    `Screen x={1062} y={128} w={182} h={252} inset={12}`
 */
export const SCREENS: ScreenSpec[] = [
  {
    id: "projects",
    glass: { x: 392, y: 249, w: 182, h: 118 },
    cue: { centerX: 382 + 202 / 2, top: 185 },
  },
  {
    id: "skills",
    glass: laptop1Rect(SKILLS_GLASS_LOCAL),
    // the laptop grew upward, so the gap between the bookshelf (bottom at
    // y=226) and the bezel is tight
    cue: { centerX: laptop1Rect(SKILLS_GLASS_LOCAL).x + laptop1Rect(SKILLS_GLASS_LOCAL).w / 2, top: 240 },
  },
  {
    id: "experience",
    glass: { x: 812, y: 278, w: 202, h: 100 },
    cue: { centerX: 802 + 222 / 2, top: 214 },
  },
  {
    id: "about",
    glass: { x: 1074, y: 140, w: 158, h: 228 },
    // sits highest on the desk, so its cue gets the least headroom
    cue: { centerX: 1062 + 182 / 2, top: 74 },
  },
];

export function screenById(id: SectionId): ScreenSpec {
  const s = SCREENS.find((s) => s.id === id);
  if (!s) throw new Error(`no screen for section "${id}"`);
  return s;
}

/** left/top/width/height as `%` strings, for absolutely positioning an HTML
 *  element over a desk rect */
export function percentBox(r: Rect) {
  return {
    left: `${(r.x / DESK_VIEWBOX.w) * 100}%`,
    top: `${(r.y / DESK_VIEWBOX.h) * 100}%`,
    width: `${(r.w / DESK_VIEWBOX.w) * 100}%`,
    height: `${(r.h / DESK_VIEWBOX.h) * 100}%`,
  };
}
