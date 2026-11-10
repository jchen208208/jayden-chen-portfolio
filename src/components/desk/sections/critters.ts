/**
 * The creatures peeking over the Experience pictures' borders, and the
 * borders themselves — pixel art as letter grids (`pixelArt.ts` has the
 * letters). `PixelFrame.tsx` draws them.
 *
 * A creature hides behind its picture. At rest just its ears and eyes show
 * over the top edge; lit (the card hovered, or its role's page open) it pops
 * up and hooks its paws over the border. Every so often it blinks.
 *
 * This file imports nothing at runtime, so a plain Node script can load it to
 * draw the art out for a look.
 */

import type { FrameStyle } from "./pixelArt";

export type Critter = {
  /** ear tips to chin */
  head: readonly string[];
  /** its eyes shut: rows laid over the head from row `from` for a blink —
   *  only the letters that differ are drawn */
  blink: { from: number; rows: readonly string[] };
  /** its paws, as wide as the head. The top row sits one pixel above the
   *  frame's edge; the rest hang over the border. */
  paws: readonly string[];
  /** rows of the head showing over the frame's edge at rest (ears and eyes)
   *  and when it's up */
  rest: number;
  up: number;
};

/* ── the creatures ─────────────────────────────────────────────────────────── */

const CAT: Critter = {
  head: [
    ".d............d.",
    ".dd..........dd.",
    ".dgd........dgd.",
    ".dpgd......dgpd.",
    ".dppgddddddgppd.",
    "dggggggggggggggd",
    "dggggggggggggggd",
    "dggwkggggggwkggd",
    "dggkkggggggkkggd",
    "dgggggpkkpgggggd",
    "dggggpkppkpggggd",
    ".dgggppppppgggd.",
    "..dddddddddddd..",
  ],
  blink: { from: 7, rows: ["dggggggggggggggd"] },
  paws: [
    "..ddd......ddd..",
    ".dpppd....dpppd.",
    ".dpdpd....dpdpd.",
  ],
  rest: 9,
  up: 12,
};

const FROG: Critter = {
  head: [
    "..dddd....dddd..",
    ".dppppd..dppppd.",
    ".dpkkpd..dpkkpd.",
    ".dppppddddppppd.",
    "dggggggggggggggd",
    "dgkggggggggggkgd",
    "dggkkkkkkkkkkggd",
    "dgppppppppppppgd",
    ".dppppppppppppd.",
    "..dddddddddddd..",
  ],
  blink: { from: 1, rows: [".dggggd..dggggd.", ".dkkkkd..dkkkkd.", ".dggggddddggggd."] },
  paws: [
    ".p.p.p....p.p.p.",
    ".ppppp....ppppp.",
    "..ppp......ppp..",
  ],
  rest: 4,
  up: 7,
};

const BUNNY: Critter = {
  head: [
    "...dd......dd...",
    "..dgpd....dpgd..",
    "..dgpd....dpgd..",
    "..dgpd....dpgd..",
    "..dgpd....dpgd..",
    "..dgpd....dpgd..",
    ".ddgpddddddpgdd.",
    "dggggggggggggggd",
    "dggggggggggggggd",
    "dggwkggggggwkggd",
    "dggkkggggggkkggd",
    "dgggggpbbpgggggd",
    "dggggpkppkpggggd",
    ".dggggppppggggd.",
    "..dddddddddddd..",
  ],
  blink: { from: 9, rows: ["dggggggggggggggd"] },
  paws: [
    "..ddd......ddd..",
    ".dpppd....dpppd.",
    ".dpdpd....dpdpd.",
  ],
  rest: 11,
  up: 14,
};

const BEAR: Critter = {
  head: [
    ".ddd........ddd.",
    "dgpgd......dgpgd",
    "dgppddddddddppgd",
    "dggggggggggggggd",
    "dggggggggggggggd",
    "dggggkggggkggggd",
    "dggggkggggkggggd",
    "dgggppppppppgggd",
    "dggppppkkppppggd",
    "dggpppkppkpppggd",
    ".dggppppppppggd.",
    "..dddddddddddd..",
  ],
  blink: { from: 5, rows: ["dggggggggggggggd", "dgggkkggggkkgggd"] },
  paws: [
    "..ddd......ddd..",
    ".dpppd....dpppd.",
    ".dpdpd....dpdpd.",
  ],
  rest: 7,
  up: 10,
};

const RACCOON: Critter = {
  head: [
    ".dd..........dd.",
    "dgpd........dpgd",
    "dgppddddddddppgd",
    "dggggggggggggggd",
    "dgppppggggppppgd",
    "dbbwkbbggbbwkbbd",
    "dbbkkbbggbbkkbbd",
    "dgbbbppppppbbbgd",
    "dggggppkkppggggd",
    "dgggppkppkppgggd",
    ".dggppppppppggd.",
    "..dddddddddddd..",
  ],
  blink: { from: 5, rows: ["dbbbbbbggbbbbbbd"] },
  paws: [
    "..ddd......ddd..",
    ".dbbbd....dbbbd.",
    ".dkbkd....dkbkd.",
  ],
  rest: 7,
  up: 10,
};

const PENGUIN: Critter = {
  head: [
    "....dddddddd....",
    "..ddbbbbbbbbdd..",
    ".dbbbbbbbbbbbbd.",
    "dbbbpppbbpppbbbd",
    "dbbppppppppppbbd",
    "dbbpwkppppwkpbbd",
    "dbbpkkppppkkpbbd",
    "dbbpppggggpppbbd",
    "dbbppppggppppbbd",
    ".dbppppppppppbd.",
    "..dbbppppppbbd..",
    "...dddddddddd...",
  ],
  blink: { from: 5, rows: ["dbbppppppppppbbd"] },
  paws: [
    "..dd........dd..",
    ".dbbd......dbbd.",
    ".dbbbd....dbbbd.",
  ],
  rest: 7,
  up: 10,
};

const HAMSTER: Critter = {
  head: [
    "...dd........dd...",
    "..dppd......dppd..",
    "..dpddddddddddpd..",
    ".dggggggggggggggd.",
    ".dggggggggggggggd.",
    ".dggwkggggggwkggd.",
    ".dggkkggggggkkggd.",
    "dpppggggkkggggpppd",
    "dpppppgkppkgpppppd",
    "dppppppppppppppppd",
    ".dppppppppppppppd.",
    "..dddddddddddddd..",
  ],
  blink: { from: 5, rows: [".dggggggggggggggd."] },
  paws: [
    "...ddd......ddd...",
    "..dpppd....dpppd..",
    "..dpdpd....dpdpd..",
  ],
  rest: 7,
  up: 10,
};

export const CRITTERS = {
  cat: CAT,
  frog: FROG,
  bunny: BUNNY,
  bear: BEAR,
  raccoon: RACCOON,
  penguin: PENGUIN,
  hamster: HAMSTER,
} as const;

/* ── the borders ───────────────────────────────────────────────────────────── */

/** every border's corner: a pixel cut off the outside, a bevelled block in */
const CORNER = [".dd", "dpg", "dgb"];

export const FRAMES = {
  studs: { edge: ["ddddd", "ggpgg", "ddddd"], corner: CORNER },
  bricks: { edge: ["dddddddd", "gggbgggg", "gggggggb"], corner: CORNER },
  checker: { edge: ["dddd", "ppgg", "ggpp"], corner: CORNER },
  waves: { edge: ["dddd", "gppg", "pggp"], corner: CORNER },
  crenels: { edge: ["dddd", "gggg", "gg.."], corner: CORNER },
  stitches: { edge: ["dddd", "ppgg", "bbbb"], corner: CORNER },
  rails: { edge: ["ddd", "ggb", "ggb"], corner: CORNER },
} satisfies Record<string, FrameStyle>;

/* ── who sits where ────────────────────────────────────────────────────────── */

export type Cast = {
  critter: Critter;
  frame: FrameStyle;
  /** where along the top edge the creature sits, as a share of the width —
   *  kept to the left half: the hover's swing lifts the right-hand side
   *  toward the card above */
  x: number;
};

/** In the Experience list's order. Reorder to move a creature or a border to
 *  another role; a role past the end starts the list again. */
export const CAST: Cast[] = [
  { critter: CRITTERS.cat, frame: FRAMES.studs, x: 0.16 },
  { critter: CRITTERS.frog, frame: FRAMES.waves, x: 0.38 },
  { critter: CRITTERS.bunny, frame: FRAMES.bricks, x: 0.12 },
  { critter: CRITTERS.bear, frame: FRAMES.stitches, x: 0.3 },
  { critter: CRITTERS.raccoon, frame: FRAMES.checker, x: 0.44 },
  { critter: CRITTERS.penguin, frame: FRAMES.rails, x: 0.2 },
  { critter: CRITTERS.hamster, frame: FRAMES.crenels, x: 0.34 },
];

export function castFor(index: number): Cast {
  return CAST[((index % CAST.length) + CAST.length) % CAST.length];
}
