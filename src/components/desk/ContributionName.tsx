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
 * `ContributionWord` spells any other word the same way (the "Hi!" under the
 * desk), sized so its squares match the name's.
 *
 * The shades are seeded so the server and the browser draw the same word —
 * otherwise hydration would see two different colourings. The squares are SVG
 * rather than text so each can carry its own colour; the words are still in
 * the DOM, as their headings' own text, for screen readers.
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
  // a dotted lowercase i, and a bang, one column each
  i: ["X", ".", "X", "X", "X", "X", "X"],
  "!": ["X", "X", "X", "X", "X", ".", "X"],
};

const ROWS = 7;
/** empty columns between letters, and between words */
const LETTER_GAP = 1;
const WORD_GAP = 4;

/** a word laid out in squares: each lit square's column and row, the middle
 *  column of each letter, and the width in columns. A character uses its own
 *  glyph if there is one (`i`, `!`), else its capital's. */
function layoutWord(text: string) {
  const squares: { col: number; row: number }[] = [];
  const centres: number[] = [];
  let col = 0;
  text.split(" ").forEach((word, wi) => {
    if (wi) col += WORD_GAP;
    [...word].forEach((ch, li) => {
      if (li) col += LETTER_GAP;
      const glyph = GLYPHS[ch] ?? GLYPHS[ch.toUpperCase()];
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
const NAME_SEED = 11;

/** the odds that a square at column `col` is gold-ish: each letter's middle
 *  sits at its own lean (gold, charcoal, gold, …) and it eases to the next
 *  letter's across the space between them */
function goldOdds(col: number, centres: number[]) {
  const x = col + 0.5;
  const lean = (i: number) => (i % 2 === 0 ? LEAN : 1 - LEAN);
  if (x <= centres[0]) return lean(0);
  const last = centres.length - 1;
  if (x >= centres[last]) return lean(last);
  let i = 0;
  while (x > centres[i + 1]) i++;
  const k = (x - centres[i]) / (centres[i + 1] - centres[i]);
  const s = k * k * (3 - 2 * k); // smoothstep
  return lean(i) + (lean(i + 1) - lean(i)) * s;
}

/** a word's squares, each with a shade from the black-and-gold ramp
 *  (`lib/goldRamp`) — the same on every render — and its view size */
function paintWord(text: string, seed: number) {
  const { squares, centres, cols } = layoutWord(text);
  const rnd = mulberry32(seed);
  const cells = squares.map(({ col, row }) => {
    const goldish = rnd() < goldOdds(col, centres);
    return { x: col * PITCH, y: row * PITCH, fill: rampColour(rampPosition(rnd, goldish)) };
  });
  return {
    cells,
    viewW: cols * PITCH - (PITCH - CELL),
    viewH: ROWS * PITCH - (PITCH - CELL),
  };
}

/** the name's width on the page; every word is sized against it, so all the
 *  squares on the page are the same size */
const NAME_WIDTH = "min(92vw, 50rem)";
const NAME_VIEW_W = paintWord(PROFILE.name, NAME_SEED).viewW;

/** `text` spelled out in contribution squares, its squares the size of the
 *  hero name's. Decorative — put the word itself alongside as text. */
export function ContributionWord({ text, seed }: { text: string; seed: number }) {
  const { cells, viewW, viewH } = paintWord(text, seed);
  const share = Math.round((viewW / NAME_VIEW_W) * 10000) / 10000;
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${viewW} ${viewH}`}
      className="block h-auto"
      style={{ width: share === 1 ? NAME_WIDTH : `calc(${NAME_WIDTH} * ${share})` }}
    >
      {cells.map((c) => (
        <rect key={`${c.x}-${c.y}`} x={c.x} y={c.y} width={CELL} height={CELL} rx={2} fill={c.fill} />
      ))}
    </svg>
  );
}

export default function ContributionName() {
  return (
    <h1>
      <span className="sr-only">{PROFILE.name}</span>
      <ContributionWord text={PROFILE.name} seed={NAME_SEED} />
    </h1>
  );
}
