/**
 * Painted art plates for the waterfall scene. Generated (Nano Banana / Copilot),
 * curated by hand — see public/plates/README.md for the prompts.
 *
 * Compositing convention (no alpha channels — see README):
 *   - "cover"    opaque, sits flat in the stack
 *   - "multiply" painted dark-on-white; the white drops out, darkening what's
 *                behind it (backlit silhouettes: trees, outcrops, canopy)
 *   - "screen"   painted on pure black; the black drops out, adding light on
 *                top of what's behind it (waterfall, spray, spirit motes)
 */

/**
 * The four master scene paintings — one continuous Higgsfield generation per
 * piece, each generated image-to-image off the previous piece's bottom edge
 * (tone + content matched at the seam), so the whole descent reads as one
 * painting. Stacked at 100% width; ~1.79:1 (9:16-ish) each. Full-res sources
 * in public/plates/master/_source/.
 */
export const MASTER = {
  /** 1600x3004 — sky, clifftop trees, waterfall, cliff face, 2 outcrops */
  waterfall: "/plates/master/piece1-waterfall.jpg",
  /** 1600x2867 — falls into mist/pool, then forest canopy (focal tree ~54%) */
  canopy: "/plates/master/piece2-canopy.jpg",
  /** 1600x2867 — canopy underside down into the warm jungle interior;
   *  central mossy branch = the Experience sign-branch spot */
  jungle: "/plates/master/piece3-jungle.jpg",
  /** 1600x2867 — jungle floor + shrub band, then below-ground roots + earth */
  roots: "/plates/master/piece4-roots.jpg",
} as const;

/** native heights at 100vw width, in vw */
export const MASTER_H_VW = {
  waterfall: 187.75,
  canopy: 179.19,
  jungle: 179.19,
  roots: 179.19,
} as const;

/** Focal-tree center within piece2, as an object-position / transform-origin
 *  percentage — where the canopy zoom scales toward. */
export const CANOPY_FOCUS = "54% 51%";

export const PLATES = {
  sky: "/plates/sky.jpg",
  treesFar: "/plates/trees-far.jpg",
  treesNear: "/plates/trees-near.jpg",
  cliffTile: "/plates/cliff-tile.jpg",
  outcrop1: "/plates/outcrop-1.jpg",
  outcrop2: "/plates/outcrop-2.png",
  outcrop3: "/plates/outcrop-3.png",
  spray: "/plates/spray.png",
  canopy: "/plates/canopy.jpg",
  motesField: "/plates/motes-field.jpg",
} as const;

export const MOTES_FIELD_SIZE = { w: 1024, h: 572 };

/**
 * Hand-picked crop windows into motes-field.jpg, each framing one clean
 * wisp (source-pixel space). Generous padding is fine — the source is pure
 * black outside the glow, and black is a no-op under `screen`.
 */
export const MOTE_SPRITES = [
  { x: 40, y: 225, w: 140, h: 150, depth: "near" as const, variant: "a" as const },
  { x: 300, y: 220, w: 190, h: 190, depth: "far" as const, variant: "b" as const },
  { x: 615, y: 195, w: 170, h: 180, depth: "mid" as const, variant: "c" as const },
  { x: 795, y: 150, w: 190, h: 190, depth: "near" as const, variant: "a" as const },
  { x: 845, y: 5, w: 160, h: 160, depth: "far" as const, variant: "b" as const },
  { x: 85, y: 415, w: 140, h: 150, depth: "mid" as const, variant: "c" as const },
  { x: 340, y: 415, w: 150, h: 155, depth: "near" as const, variant: "a" as const },
  { x: 520, y: 355, w: 140, h: 140, depth: "far" as const, variant: "b" as const },
  { x: 680, y: 395, w: 150, h: 155, depth: "mid" as const, variant: "c" as const },
  { x: 145, y: 255, w: 160, h: 175, depth: "near" as const, variant: "b" as const },
] as const;
