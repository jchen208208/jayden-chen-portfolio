import { rampColour, rampPosition } from "@/lib/goldRamp";
import { PROFILE } from "@/lib/site";
import { mulberry32 } from "@/lib/svg";

/**
 * The hero name, spelled out in small squares like the cells of a GitHub
 * contribution graph: a 7-row pixel face in black and gold, Waterloo's
 * colours. Every other letter leans gold and the rest lean charcoal, but
 * nothing is pure: a gold letter has a few dark squares in it and a dark one a
 * few gold, the lean eases from one letter to the next across the gaps, and
 * the squares themselves fade through in-between shades. The speckle is what
 * makes it read as a busy contribution graph rather than a coloured sign.
 * (Not real data: the first version used his actual graph, but a quiet
 * stretch left whole letters dim. And no glow: all-bright amber with a halo
 * shouted over everything else on the page.)
 *
 * The shades are seeded so the server and the browser draw the same name —
 * otherwise hydration would see two different colourings. The squares are SVG
 * rather than text so each can carry its own colour; the name is still in the
 * DOM, as the heading's own text, for screen readers.
 */

/* ── the letters: `X` = a square, 7 rows each, most 4 wide ──────────────── */
const GLYPHS: Record<string, string[]> = {
  J: ["..XX", "...X", "...X", "...X", "...X", "X..X", ".XX."],
  A: [".XX.", "X..X", "X..X", "XXXX", "X..X", "X..X", "X..X"],
  // five wide, so the stem is a single column down the middle
  Y: ["X...X", "X...X", ".X.X.", "..X..", "..X..", "..X..", "..X.."],
  D: ["XXX.", "X..X", "X..X", "X..X", "X..X", "X..X", "XXX."],
  E: ["XXXX", "X...", "X...", "XXX.", "X...", "X...", "XXXX"],
  N: ["X..X", "XX.X", "XX.X", "X.XX", "X.XX", "X..X", "X..X"],
  C: [".XXX", "X...", "X...", "X...", "X...", "X...", ".XXX"],
  H: ["X..X", "X..X", "X..X", "XXXX", "X..X", "X..X", "X..X"],
};

const ROWS = 7;
/** empty columns between letters, and between the two words */
const LETTER_GAP = 1;
const WORD_GAP = 4;

/** the name laid out in squares: each lit square's column and row, the middle
 *  column of each letter, and the width in columns */
function layoutName(name: string) {
  const squares: { col: number; row: number }[] = [];
  const centres: number[] = [];
  let col = 0;
  name
    .toUpperCase()
    .split(" ")
    .forEach((word, wi) => {
      if (wi) col += WORD_GAP;
      [...word].forEach((ch, li) => {
        if (li) col += LETTER_GAP;
        const glyph = GLYPHS[ch];
        if (!glyph) return;
        glyph.forEach((line, row) =>
          [...line].forEach((c, dx) => c === "X" && squares.push({ col: col + dx, row })),
        );
        centres.push(col + (glyph[0].length - 1) / 2);
        col += glyph[0].length;
      });
    });
  return { squares, centres, cols: col };
}

/* ── the squares ──────────────────────────────────────────────────────── */
const PITCH = 13;
const CELL = 10;

/** how strongly a letter leans: gold letters sit at `LEAN`, charcoal ones at
 *  `1 - LEAN`. At 0.8 about one square in five goes against its letter, so the
 *  charcoal letters carry some gold squares that mark out their shape. */
const LEAN = 0.8;
const SEED = 11;

const { squares: SQUARES, centres: CENTRES, cols: COLS } = layoutName(PROFILE.name);
const VIEW_W = COLS * PITCH - (PITCH - CELL);
const VIEW_H = ROWS * PITCH - (PITCH - CELL);

/** the odds that a square at column `col` is gold-ish: each letter's middle
 *  sits at its own lean (gold, charcoal, gold, …) and it eases to the next
 *  letter's across the space between them */
function goldOdds(col: number) {
  const x = col + 0.5;
  const lean = (i: number) => (i % 2 === 0 ? LEAN : 1 - LEAN);
  if (x <= CENTRES[0]) return lean(0);
  const last = CENTRES.length - 1;
  if (x >= CENTRES[last]) return lean(last);
  let i = 0;
  while (x > CENTRES[i + 1]) i++;
  const k = (x - CENTRES[i]) / (CENTRES[i + 1] - CENTRES[i]);
  const s = k * k * (3 - 2 * k); // smoothstep
  return lean(i) + (lean(i + 1) - lean(i)) * s;
}

/** a shade for each square from the black-and-gold ramp (`lib/goldRamp`),
 *  the same on every render */
const CELLS = (() => {
  const rnd = mulberry32(SEED);
  return SQUARES.map(({ col, row }) => {
    const goldish = rnd() < goldOdds(col);
    return { x: col * PITCH, y: row * PITCH, fill: rampColour(rampPosition(rnd, goldish)) };
  });
})();

export default function ContributionName() {
  return (
    <h1>
      <span className="sr-only">{PROFILE.name}</span>
      <svg
        aria-hidden
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="block h-auto w-[min(92vw,50rem)]"
      >
        {CELLS.map((c) => (
          <rect
            key={`${c.x}-${c.y}`}
            x={c.x}
            y={c.y}
            width={CELL}
            height={CELL}
            rx={2}
            fill={c.fill}
          />
        ))}
      </svg>
    </h1>
  );
}
