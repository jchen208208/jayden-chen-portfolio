/**
 * The pixel desk's colours, one letter each — shared by the generator that
 * draws it (`scripts/desk-pixels.mjs`) and the parts drawn live over it
 * (`DeskSvg`, `PcFanLights`). Imports nothing, so Node can load it.
 *
 * The room is the lotus's greys (`LotusBloom`), lit from the upper left:
 * every object a dark body with a pale rim along its top and left edges and
 * a dimmer one along its bottom and right, details a shade off its body.
 * Those are fixed. The light — the lamp's bulb, the PC's fans and button,
 * the notes off the speaker — is the theme's glow, in its own shades, so it
 * follows the theme bar.
 */
export const DESK_GREYS = {
  /** a lit rim: an edge facing the light */
  a: "#9c9ca2",
  /** a shadow rim, and the stronger details */
  b: "#5a5a60",
  /** faint details */
  c: "#3a3a40",
  /** bodies */
  e: "#26262b",
  /** the deepest: recesses, holes, the shadow one thing casts on another */
  k: "#17171b",
} as const;

/** every letter as a CSS colour — the light's as the theme's tokens */
export const DESK_FILL: Record<string, string> = {
  ...DESK_GREYS,
  v: "var(--glow-pale, #ffe3b0)",
  w: "color-mix(in srgb, var(--glow-pale, #ffe3b0) 50%, var(--glow, #ffbe5c))",
  x: "var(--glow, #ffbe5c)",
  y: "var(--glow-deep, #c18a2e)",
  z: "var(--glow-bronze, #8f7442)",
  n: "var(--neon-core, #fff4e2)",
  s: "var(--screen-deep, #1a1106)",
};

/** pixels to draw: one SVG path per letter, in art pixels */
export type Cells = readonly (readonly [letter: string, d: string])[];
