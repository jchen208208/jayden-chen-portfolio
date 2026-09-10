/**
 * Desk scene geometry — the swap seam.
 *
 * Everything here is a placeholder: a handful of flat shapes plus four screen
 * rectangles. When the low-detail reference image arrives, retrace `DESK_PATHS`
 * and adjust the `SCREENS` coordinates — no component code needs to change.
 *
 * Coordinate space is `DESK_VIEWBOX`. Screen positions are converted to `%` of
 * the viewBox so the HTML overlay layer stays glued to the SVG at every width.
 */

import type { SectionId } from "./site";

export const DESK_VIEWBOX = { w: 1600, h: 740 } as const;

/** Flat decorative shapes, one light key on black. */
export const DESK_PATHS = {
  /** desktop surface — a shallow trapezoid seen slightly from above */
  deskTop: "M170 600 L1430 600 L1560 690 L40 690 Z",
  /** desk front edge */
  deskFront: "M40 690 L1560 690 L1560 742 L40 742 Z",
  /** left / right legs */
  legL: "M150 742 L232 742 L232 900 L150 900 Z",
  legR: "M1368 742 L1450 742 L1450 900 L1368 900 Z",
} as const;

export type ScreenKind = "laptop" | "monitor";

export type ScreenSpec = {
  id: SectionId;
  kind: ScreenKind;
  /** the glass rectangle, in viewBox units */
  x: number;
  y: number;
  w: number;
  h: number;
  /** degrees — a hint for later perspective tracing; 0 for the placeholder */
  skew: number;
};

/**
 * Two monitors raised at the back, two laptops lower and in front — Jayden's
 * real four-screen setup. Laptops sit fully below the monitor line so nothing
 * overlaps.
 */
export const SCREENS: ScreenSpec[] = [
  { id: "experience", kind: "monitor", x: 440, y: 150, w: 360, h: 228, skew: 0 },
  { id: "skills", kind: "monitor", x: 830, y: 150, w: 360, h: 228, skew: 0 },
  { id: "projects", kind: "laptop", x: 392, y: 450, w: 300, h: 166, skew: -2 },
  { id: "about", kind: "laptop", x: 928, y: 450, w: 300, h: 166, skew: 2 },
];

/** reading / tab order, independent of paint order */
export const SCREEN_ORDER: SectionId[] = [
  "projects",
  "experience",
  "skills",
  "about",
];

export function screenById(id: SectionId): ScreenSpec {
  const s = SCREENS.find((s) => s.id === id);
  if (!s) throw new Error(`no screen for section "${id}"`);
  return s;
}

/** left/top/width/height as `%` strings, for absolutely positioning the overlay */
export function screenPercentBox(s: ScreenSpec) {
  return {
    left: `${(s.x / DESK_VIEWBOX.w) * 100}%`,
    top: `${(s.y / DESK_VIEWBOX.h) * 100}%`,
    width: `${(s.w / DESK_VIEWBOX.w) * 100}%`,
    height: `${(s.h / DESK_VIEWBOX.h) * 100}%`,
  };
}
