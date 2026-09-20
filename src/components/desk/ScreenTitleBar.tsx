/**
 * The one title treatment every desk screen wears: a white strip across the
 * top of the glass with the section's name knocked out of it in the hero's
 * display face (Mileast). Same size on all four screens — `TITLE_SIZE` desk units — so the
 * four sections name themselves identically, and the opened section's header
 * is visibly this same label grown large.
 *
 * Drawn in whatever coordinate space the caller's SVG uses (the desk viewBox
 * for screens 2–4, glass-local units for screen 1), which is why it takes the
 * glass rect explicitly. `scale` is for a screen that is drawn small and then
 * scaled up by a parent transform (screen 2, see `LAPTOP1`): pass that scale
 * and the strip is drawn correspondingly smaller so it lands at the same
 * on-screen size as the others.
 *
 * Every attribute is explicit (`stroke="none"`, font, fill) because three of
 * the callers sit inside `DeskSvg`'s outer `<g stroke={INK} strokeWidth={2.4}>`.
 */

const INK = "var(--ink, #f4f6f8)";
const PAPER = "var(--paper, #000)";
/** the hero's display face — the same one the name is set in */
const TITLE_FONT = "var(--font-mileast), Georgia, serif";

export const TITLE_SIZE = 19;
/** strip height for a one-line title — deep enough for `TITLE_SIZE` to breathe */
export const TITLE_H = 29;
/** extra height per additional line */
const LINE_PITCH = 21;

/** how tall the strip is for a title of `lines` lines, at `scale` */
export function titleBarHeight(lines: number, scale = 1) {
  return (TITLE_H + (lines - 1) * LINE_PITCH) / scale;
}

export default function ScreenTitleBar({
  x,
  y,
  w,
  r = 4,
  lines,
  scale = 1,
}: {
  /** the glass rect's top-left and width, in the caller's units */
  x: number;
  y: number;
  w: number;
  /** the glass's own corner radius, so the strip's top corners follow it
   *  instead of poking out square */
  r?: number;
  /** the title, one string per line (a long name wraps to two) */
  lines: string[];
  scale?: number;
}) {
  const h = titleBarHeight(lines.length, scale);
  const size = TITLE_SIZE / scale;
  const pitch = LINE_PITCH / scale;
  const rr = r / scale;
  // first line sits centred in a one-line strip; each further line one pitch down
  const firstY = y + TITLE_H / scale / 2;
  return (
    <g stroke="none">
      {/* rounded along the top, square along the bottom where it meets the body */}
      <path
        d={`M${x} ${y + rr} A${rr} ${rr} 0 0 1 ${x + rr} ${y}
            L${x + w - rr} ${y} A${rr} ${rr} 0 0 1 ${x + w} ${y + rr}
            L${x + w} ${y + h} L${x} ${y + h} Z`}
        fill={INK}
      />
      <g
        fontFamily={TITLE_FONT}
        fontSize={size}
        fill={PAPER}
        textAnchor="middle"
        letterSpacing={size * 0.03}
      >
        {lines.map((line, i) => (
          <text key={line} x={x + w / 2} y={firstY + i * pitch} dominantBaseline="central">
            {line}
          </text>
        ))}
      </g>
    </g>
  );
}
