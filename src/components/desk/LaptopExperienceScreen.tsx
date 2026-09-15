/**
 * What the larger laptop (screen 3) shows while it sits on the desk: a code
 * editor open on `experience.md` in Markdown live-preview, the way Obsidian /
 * Typora / VS Code's preview render it —
 *
 *   ●●●  experience.md
 *   ·  # EXPERIENCE          ← same monospace, drawn large, like a rendered heading
 *   ·  ```ts
 *   ·  ▬▬▬▬▬ ▬▬▬▬ = [{        ← code as bars: real glyphs would be ~4px tall
 *   ·    ▬▬▬▬▬ ▬▬▬▬▬▬▬▬▬,
 *   ·  }];▌                  ← typed in one character at a time, block cursor
 *
 * Coloured like VS Code's default Dark Modern theme (including its bracket
 * pair colours), with macOS window buttons in the tab bar.
 * One editor font throughout (Fira Code for the heading, JetBrains Mono for
 * the rest); the heading earns its size the way a Markdown heading does in a
 * real editor, so the section name stays obvious while everything below still
 * reads as code. The code is shaped like one job entry (`role`, `company`,
 * `dates`) — a preview of what the section opens to.
 *
 * Typing is pure CSS: each token bar grows `steps(chars)` over its own slice
 * of one shared cycle, and the cursor jumps along with it. Those keyframes
 * depend on every token's timing, so they're generated below from `CODE`
 * and emitted in an inline `<style>`. globals.css holds the rest: hovering
 * the screen's click target pauses typing, brightens the code and holds the
 * cursor solid; `prefers-reduced-motion` shows the finished file.
 *
 * Everything is in desk viewBox units, drawn inside `DeskSvg`'s outer `<g>`.
 */

const INK = "var(--ink, #f4f6f8)";
const MONO = "var(--font-mono), ui-monospace, monospace";
const FIRA = "var(--font-fira-code), monospace";

/** the glass — must track `Screen x={802} y={268} w={222} h={120} inset={10}`
 *  in `DeskSvg` (and `SCREENS` in `DeskScene`) */
const GLASS = { x: 812, y: 278, w: 202, h: 100 };

/* ── editor chrome ─────────────────────────────────────────────────────── */
const TAB_BAR_H = 12;
const TAB_TEXT_SIZE = 6.5;
const GUTTER_MARK_X = GLASS.x + 4;

/* ── heading ───────────────────────────────────────────────────────────── */
const TEXT_X = GLASS.x + 18;
const HEADING_BASELINE = 311;
const HEADING_SIZE = 20;

/* ── code block ────────────────────────────────────────────────────────── */
const BLOCK = { x: TEXT_X - 4, y: 316, w: 176, h: 57 };
const CODE_X = TEXT_X;
/** one monospace cell of the (imaginary) code font */
const CH = 3.2;
const ROW_PITCH = 8.8;
const FENCE_ROW_Y = 322;
const BAR_H = 3;
/** gap left between neighbouring tokens' bars, so `"…"` and `,` don't merge */
const BAR_INSET = 0.8;
const CURSOR_W = CH / 2;
const CURSOR_H = 6.5;

/** colours from VS Code's default dark theme (Dark Modern) */
const THEME = {
  keyword: "#569cd6", // const
  constant: "#4fc1ff", // jobs
  operator: "#cccccc", // =
  property: "#9cdcfe", // role
  string: "#ce9178", // "…"
  punct: "#cccccc", // : , ;
  bracket1: "#ffd700", // [ ]  — bracket pair colourisation, depth 1
  bracket2: "#da70d6", // { }  — depth 2
  heading: "#569cd6", // # EXPERIENCE
  fence: "#cccccc", // ```ts
  lineNumber: "#6e7681",
  cursor: "#aeafad",
  activeTab: "#0078d4",
} as const;

/** macOS window buttons: close, minimise, zoom */
const WINDOW_BUTTONS = ["#ff5f57", "#febc2e", "#28c840"];

type Tone =
  | "keyword"
  | "constant"
  | "operator"
  | "property"
  | "string"
  | "punct"
  | "bracket1"
  | "bracket2";

/** the typed code, row by row: an indent, then [length in chars, tone]
 *  tokens separated by one space — or none, for a token marked `true`
 *  (`[{`, `role:`, `",`) — roughly
 *    const jobs = [{
 *      role: "……………………………………",
 *      company: "…………………",
 *      dates: "………………",
 *    }]; */
type CodeToken = [len: number, tone: Tone, joined?: boolean];
const CODE: { indent: number; tokens: CodeToken[] }[] = [
  {
    indent: 0,
    tokens: [[5, "keyword"], [4, "constant"], [1, "operator"], [1, "bracket1"], [1, "bracket2", true]],
  },
  { indent: 2, tokens: [[4, "property"], [1, "punct", true], [22, "string"], [1, "punct", true]] },
  { indent: 2, tokens: [[7, "property"], [1, "punct", true], [15, "string"], [1, "punct", true]] },
  { indent: 2, tokens: [[5, "property"], [1, "punct", true], [13, "string"], [1, "punct", true]] },
  { indent: 0, tokens: [[1, "bracket2"], [1, "bracket1", true], [1, "punct", true]] },
];

/* ── timing ────────────────────────────────────────────────────────────── */
const START_MS = 700; // empty block, cursor waiting
const CHAR_MS = 85;
const NEWLINE_MS = 320;
const HOLD_MS = 3000; // finished file on screen before it clears and loops

const rowY = (row: number) => FENCE_ROW_Y + (row + 1) * ROW_PITCH;

type Token = { row: number; col: number; len: number; tone: Tone; start: number; end: number };
type CursorStop = { t: number; col: number; row: number; steps: number };

/** lays every token out on the grid and on the clock, and records where the
 *  cursor is at each moment it starts moving */
function buildTimeline() {
  const tokens: Token[] = [];
  const cursor: CursorStop[] = [];
  let t = START_MS;
  CODE.forEach(({ indent, tokens: rowTokens }, row) => {
    let col = indent;
    if (row > 0) t += NEWLINE_MS;
    // a newline lands straight on the auto-indent
    cursor.push({ t, col, row, steps: 0 });
    rowTokens.forEach(([len, tone, joined], i) => {
      if (i > 0 && !joined) {
        // the space before this token
        cursor.push({ t, col, row, steps: 1 });
        t += CHAR_MS;
        col += 1;
      }
      cursor.push({ t, col, row, steps: len });
      tokens.push({ row, col, len, tone, start: t, end: t + len * CHAR_MS });
      t += len * CHAR_MS;
      col += len;
    });
    cursor.push({ t, col, row, steps: 0 });
  });
  return { tokens, cursor, cycleMs: t + HOLD_MS };
}

const { tokens: TOKENS, cursor: CURSOR_STOPS, cycleMs: CYCLE_MS } = buildTimeline();
const FINAL = CURSOR_STOPS[CURSOR_STOPS.length - 1];
const cursorX = (col: number) => CODE_X + col * CH;
const cursorY = (row: number) => rowY(row) - CURSOR_H / 2;

const pct = (ms: number) => `${((ms / CYCLE_MS) * 100).toFixed(3)}%`;

/** every token: hidden until its slice, grows a character per step, holds
 *  until the cycle ends, then the whole file clears at once */
const TOKEN_CSS = TOKENS.map(
  (tok, i) => `@keyframes exp-tok-${i} {
  0%, ${pct(tok.start)} { transform: scaleX(0); animation-timing-function: steps(${tok.len}, end); }
  ${pct(tok.end)} { transform: scaleX(1); animation-timing-function: step-end; }
  100% { transform: scaleX(0); }
}`,
).join("\n");

/** the cursor as a translate away from where it rests on the finished file
 *  (its un-animated position, which reduced motion shows) */
const cursorOffset = (col: number, row: number) =>
  `translate(${(cursorX(col) - cursorX(FINAL.col)).toFixed(2)}px, ${(cursorY(row) - cursorY(FINAL.row)).toFixed(2)}px)`;

function buildCursorCss() {
  const home = { t: 0, col: CODE[0].indent, row: 0, steps: 0 };
  const frames: string[] = [];
  let prevT = -Infinity;
  for (const { t, col, row, steps } of [home, ...CURSOR_STOPS]) {
    // stops sharing an instant (a line jump, then typing straight away) need
    // distinct keyframe offsets — nudge the later one a millisecond along
    const at = Math.max(t, prevT + 1);
    prevT = at;
    const timing = steps > 0 ? `steps(${steps}, end)` : "step-end";
    frames.push(
      `  ${pct(at)} { transform: ${cursorOffset(col, row)}; animation-timing-function: ${timing}; }`,
    );
  }
  frames.push(`  100% { transform: ${cursorOffset(home.col, home.row)}; }`);
  return `@keyframes exp-cursor-move {\n${frames.join("\n")}\n}`;
}

const TYPING_CSS = `${TOKEN_CSS}\n${buildCursorCss()}`;
/** Every token runs its own CSS animation, so they only stay in step if they
 *  all start on the same frame. A hot reload that adds tokens would mount
 *  just the new ones mid-cycle (they'd type out of order, after the rest had
 *  cleared) — keying the whole screen on the generated keyframes remounts
 *  everything together whenever the code or timing changes. */
const TIMELINE_KEY = [...TYPING_CSS].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0);

/** only the name and length go inline — play-state stays in globals.css so
 *  hovering the screen can pause it */
const typeAnimation = (name: string) => ({
  animationName: name,
  animationDuration: `${CYCLE_MS}ms`,
});

export default function LaptopExperienceScreen() {
  const rows = [HEADING_BASELINE - HEADING_SIZE * 0.36, FENCE_ROW_Y, ...CODE.map((_, r) => rowY(r))];

  return (
    <g key={TIMELINE_KEY}>
      <style>{TYPING_CSS}</style>

      {/* tab bar: window buttons, the open file, and a rule under the bar */}
      <g stroke="none" fill={INK}>
        <rect x={GLASS.x} y={GLASS.y} width={GLASS.w} height={TAB_BAR_H} opacity={0.08} />
        {WINDOW_BUTTONS.map((color, i) => (
          <circle
            key={color}
            cx={GLASS.x + 6 + i * 5.5}
            cy={GLASS.y + TAB_BAR_H / 2}
            r={1.6}
            fill={color}
          />
        ))}
        <text
          x={GLASS.x + 26}
          y={GLASS.y + TAB_BAR_H / 2}
          dominantBaseline="central"
          fontSize={TAB_TEXT_SIZE}
          fontFamily={MONO}
          opacity={0.75}
        >
          experience.md
        </text>
        {/* active-tab marker under the filename */}
        <rect
          x={GLASS.x + 24}
          y={GLASS.y + TAB_BAR_H - 1.2}
          width={55}
          height={1.2}
          fill={THEME.activeTab}
        />
      </g>

      {/* gutter: a dim tick where each line number would be */}
      <g stroke="none" fill={THEME.lineNumber}>
        {rows.map((y) => (
          <rect key={y} x={GUTTER_MARK_X} y={y - 1.1} width={5} height={2.2} rx={1.1} />
        ))}
      </g>

      {/* the rendered heading — the one thing on this screen at full size */}
      <text
        x={TEXT_X}
        y={HEADING_BASELINE}
        fontSize={HEADING_SIZE}
        fontFamily={FIRA}
        fontWeight={600}
        fill={THEME.heading}
        stroke="none"
      >
        <tspan>#</tspan>
        {" EXPERIENCES"}
      </text>

      {/* code block */}
      <rect
        x={BLOCK.x}
        y={BLOCK.y}
        width={BLOCK.w}
        height={BLOCK.h}
        rx={2}
        fill={INK}
        opacity={0.07}
        stroke="none"
      />
      <g className="exp-code" stroke="none">
        <text
          x={CODE_X}
          y={FENCE_ROW_Y}
          dominantBaseline="central"
          fontSize={TAB_TEXT_SIZE}
          fontFamily={MONO}
          fill={THEME.fence}
        >
          ```ts
        </text>
        {TOKENS.map((tok, i) => (
          <rect
            key={i}
            className="exp-type exp-tok"
            x={CODE_X + tok.col * CH}
            y={rowY(tok.row) - BAR_H / 2}
            width={tok.len * CH - BAR_INSET}
            height={BAR_H}
            rx={BAR_H / 2}
            fill={THEME[tok.tone]}
            style={typeAnimation(`exp-tok-${i}`)}
          />
        ))}
        {/* ▌ cursor: the group travels, the rect blinks */}
        <g className="exp-type" style={typeAnimation("exp-cursor-move")}>
          <rect
            className="exp-cursor"
            fill={THEME.cursor}
            x={cursorX(FINAL.col)}
            y={cursorY(FINAL.row)}
            width={CURSOR_W}
            height={CURSOR_H}
          />
        </g>
      </g>
    </g>
  );
}
