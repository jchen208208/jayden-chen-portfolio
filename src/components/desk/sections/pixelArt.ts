/**
 * Pixel art drawn as letter grids — the Experience pictures' bumpy border
 * and the creatures peeking over it (`critters.ts`, `PixelFrame.tsx`). One
 * letter a pixel, one string a row, as the lotus's frames are
 * (`lotusFrames.ts`).
 *
 * It's drawn as inline SVG with each letter's fill a CSS variable, so the
 * art takes the theme's light in its own shades and follows the theme bar
 * with no script — the lotus's canvas has to read its colours off `<html>`.
 *
 * This file imports nothing, so a plain Node script can load it to draw the
 * art out for a look.
 */

/** screen px per art pixel — the lotus's scale too */
export const PX = 4;

/**
 * What each letter is painted with: the theme's light, pale → deep →
 * bronze, the card's near-black for eyes and noses, and white for the glint
 * in an eye. `.` is empty.
 */
export const INK: Record<string, string> = {
  p: "var(--glow-pale)",
  g: "var(--glow)",
  d: "var(--glow-deep)",
  b: "var(--glow-bronze)",
  k: "var(--card)",
  w: "#fff",
};

export type Stroke = { letter: string; d: string };

/** a grid as one SVG path per letter (in art pixels), each row's runs of a
 *  letter merged into one rectangle */
export function toPaths(rows: readonly string[]): Stroke[] {
  const byLetter = new Map<string, string>();
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const letter = row[x];
      let n = 1;
      while (row[x + n] === letter) n++;
      if (letter in INK) byLetter.set(letter, `${byLetter.get(letter) ?? ""}M${x} ${y}h${n}v1h-${n}z`);
      x += n;
    }
  });
  return [...byLetter].map(([letter, d]) => ({ letter, d }));
}

/* ── the border ────────────────────────────────────────────────────────────── */

/** how bumpy the border is */
export type Bumpiness = {
  /** the chance each step along the outside edge starts a bump */
  bumps: number;
  /** the widest a bump gets, in art pixels */
  size: number;
  /** the chance each pixel inside the band is a darker one */
  texture: number;
  /** which arrangement — another seed, other bumps */
  seed: number;
};

/** the Experience pictures' border, as Jayden picked it on a dev slider */
export const BUMPINESS: Bumpiness = { bumps: 0.09, size: 2, texture: 0.16, seed: 5 };

/** art pixels drawn outside the picture's box on every side, for the bumps */
export const MARGIN = 2;

/** the band's depth, art pixels: a deep outer row, then two in the glow */
const DEPTH = 3;

/** no bumps this close to a corner, art pixels */
const CORNER_CLEAR = 3;

/** a number in [0, 1) from integers — always the same for the same ones, so
 *  the bumps land in the same places on the server and in every render */
function rand(...keys: number[]) {
  let h = 0x2545f491;
  for (const k of keys) {
    h = Math.imul(h ^ (k | 0), 0x9e3779b1);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/**
 * The border round a picture `cols` × `rows` art pixels, as a grid with
 * `MARGIN` pixels spare on every side (grid x = picture x + `MARGIN`): a band
 * `DEPTH` deep with its corners cut a pixel square, a few darker pixels
 * scattered through it, and little bumps standing out from its outside edge,
 * a pixel tall and never touching. `clear` keeps a stretch of the top edge,
 * in picture x, free of bumps — where the creature peeks over.
 */
export function bumpyFrame(
  cols: number,
  rows: number,
  { bumps, size, texture, seed }: Bumpiness,
  clear?: readonly [number, number],
): string[] {
  const grid = Array.from({ length: rows + 2 * MARGIN }, () => Array<string>(cols + 2 * MARGIN).fill("."));
  const put = (x: number, y: number, letter: string) => {
    grid[y + MARGIN][x + MARGIN] = letter;
  };

  // the band, by how far each pixel is in from the outside
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const depth = Math.min(x, y, cols - 1 - x, rows - 1 - y);
      if (depth >= DEPTH) continue;
      const corner = (x === 0 || x === cols - 1) && (y === 0 || y === rows - 1);
      if (corner) continue;
      put(x, y, depth === 0 || rand(seed, 1, x, y) < texture ? "d" : "g");
    }
  }

  // the bumps: along each edge, a bump starts with chance `bumps`, is 1 to
  // `size` wide, and leaves at least a pixel before the next can start
  const edges = [
    { length: cols, at: (t: number) => [t, -1] }, // top
    { length: cols, at: (t: number) => [t, rows] }, // bottom
    { length: rows, at: (t: number) => [-1, t] }, // left
    { length: rows, at: (t: number) => [cols, t] }, // right
  ];
  edges.forEach(({ length, at }, edge) => {
    const last = length - 1 - CORNER_CLEAR;
    let t = CORNER_CLEAR;
    while (t <= last) {
      if (rand(seed, 2, edge, t) >= bumps) {
        t++;
        continue;
      }
      const width = Math.min(1 + Math.floor(rand(seed, 3, edge, t) * size), last - t + 1);
      const blocked = edge === 0 && clear && t <= clear[1] && t + width - 1 >= clear[0];
      if (!blocked) {
        for (let i = 0; i < width; i++) {
          const [x, y] = at(t + i);
          put(x, y, "d");
        }
      }
      t += width + 1;
    }
  });

  return grid.map((row) => row.join(""));
}
