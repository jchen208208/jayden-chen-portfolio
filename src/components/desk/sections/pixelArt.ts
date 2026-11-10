/**
 * Pixel art drawn as letter grids — the Experience pictures' borders and the
 * creatures peeking over them (`critters.ts`, `PixelFrame.tsx`). One letter
 * a pixel, one string a row, as the lotus's frames are (`lotusFrames.ts`).
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

/** a border's pattern: one tile of its top edge, which turns to run down the
 *  sides and along the bottom, and its top-left corner, which mirrors into
 *  the other three. Both list their outermost row first; the corner is as
 *  many pixels square as the edge is rows deep. */
export type FrameStyle = {
  edge: readonly string[];
  corner: readonly string[];
};

/** the whole border round a picture `cols` × `rows` art pixels, as a grid —
 *  empty inside. Each edge's tiles are centred on it, so the pattern meets
 *  both of its corners the same way. */
export function frameGrid(cols: number, rows: number, { edge, corner }: FrameStyle): string[] {
  const depth = edge.length;
  const tile = edge[0].length;
  const grid = Array.from({ length: rows }, () => Array<string>(cols).fill("."));
  const put = (x: number, y: number, letter: string) => {
    if (x >= 0 && y >= 0 && x < cols && y < rows && letter !== ".") grid[y][x] = letter;
  };

  // `i` runs along an edge between its corners; the tile starts so that the
  // part-tile left over is split between the two ends
  const tileAt = (length: number) => {
    const shift = Math.floor((length % tile) / 2);
    return (i: number) => (((i - shift) % tile) + tile) % tile;
  };

  const across = cols - 2 * depth;
  const down = rows - 2 * depth;
  const tx = tileAt(across);
  const ty = tileAt(down);
  for (let r = 0; r < depth; r++) {
    for (let i = 0; i < across; i++) {
      const letter = edge[r][tx(i)];
      put(depth + i, r, letter);
      put(depth + i, rows - 1 - r, letter);
    }
    for (let i = 0; i < down; i++) {
      const letter = edge[r][ty(i)];
      put(r, depth + i, letter);
      put(cols - 1 - r, depth + i, letter);
    }
    for (let c = 0; c < depth; c++) {
      const letter = corner[r][c];
      put(c, r, letter);
      put(cols - 1 - c, r, letter);
      put(c, rows - 1 - r, letter);
      put(cols - 1 - c, rows - 1 - r, letter);
    }
  }
  return grid.map((row) => row.join(""));
}
