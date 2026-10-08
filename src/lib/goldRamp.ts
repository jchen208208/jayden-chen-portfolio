/**
 * The black-and-gold ramp — Waterloo's colours — that the hero name's squares
 * are coloured from (`ContributionName`), shared with the desk screens'
 * mosaic (`ScreenMosaic`) so the two read as one palette.
 */

/** how gold (1) or how charcoal (0) a shade is, as colour stops: charcoal →
 *  a lighter grey → a bronze where the two meet → the site's amber light
 *  (`--glow`, #ffbe5c) → a pale highlight. Shades are placed anywhere along
 *  it, so there are in-between shades rather than two palettes.
 *
 *  The charcoal end can't be darker than this: below about 3:1 against the
 *  black page (#5a5a60 is 3.1:1) a square stops reading as part of a letter,
 *  and the charcoal letters — and with them the name — became hard to make
 *  out. It was #2f2f35 (1.6:1). */
const STOPS: [number, string][] = [
  [0, "#5a5a60"],
  [0.4, "#9c9ca2"],
  [0.52, "#8f7442"],
  [0.72, "#c18a2e"],
  [0.9, "#ffbe5c"],
  [1, "#ffe3b0"],
];

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

/** the colour at `t` (0–1) along the ramp */
export function rampColour(t: number) {
  let i = 1;
  while (i < STOPS.length - 1 && t > STOPS[i][0]) i++;
  const [t0, c0] = STOPS[i - 1];
  const [t1, c1] = STOPS[i];
  const k = Math.min(1, Math.max(0, (t - t0) / (t1 - t0)));
  const [a, b] = [hex(c0), hex(c1)];
  return `rgb(${a.map((v, j) => Math.round(v + (b[j] - v) * k)).join(",")})`;
}

/** where along the ramp a shade lands: gold-ish ones in its upper stretch,
 *  the rest in its lower, and the brightest few rarer */
export function rampPosition(rnd: () => number, goldish: boolean) {
  const r = rnd() ** 1.4;
  return goldish ? 0.55 + 0.45 * r : 0.42 * r;
}
