import type { CSSProperties } from "react";

/**
 * The Skills header, typed into an editor one character at a time, like the
 * code on the Skills laptop (`LaptopSkillsScreen`) —
 *
 *   ·  ▌                            ← the cursor waits on an empty line
 *   ·  typedef struct skills {};▌   ← then the line types itself in, and the
 *                                      cursor keeps blinking
 *
 * Tokens are coloured like an IDE's syntax highlighting, kept to the colour
 * rule (top of globals.css): ink in two weights, the glow in two strengths.
 *
 * Typing is pure CSS and works in any face, monospace or not: every
 * character is laid out from the start (so a centred header never drifts)
 * and is just hidden until its moment. Each character carries its own copy
 * of the cursor at its right edge, shown only from its keystroke until the
 * next one lands — so the cursor seems to ride along — and the last one
 * stays and blinks. Plays once per mount (`DeskScene` keys the title per
 * opening). globals.css (`.typed-*`) holds the keyframes; reduced motion
 * shows the finished line.
 */

type Tone = "keyword" | "type" | "bracket" | "punct";

const TONE: Record<Tone, string> = {
  keyword: "var(--glow, #ffbe5c)",
  type: "var(--ink, #f4f6f8)",
  bracket: "color-mix(in srgb, var(--glow, #ffbe5c) 55%, transparent)",
  punct: "var(--ink-faint, rgba(255,255,255,0.4))",
};

export type Segment = [text: string, tone: Tone];

/** the Skills header */
export const SKILLS_TITLE: Segment[] = [
  ["typedef", "keyword"],
  [" ", "punct"],
  ["struct", "keyword"],
  [" ", "punct"],
  ["skills", "type"],
  [" ", "punct"],
  ["{}", "bracket"],
  [";", "punct"],
];

const START_MS = 400; // empty line, cursor waiting
const CHAR_MS = 60;

/** ▌ — `at` places it: the line's start, or just past a character */
function Cursor({ className, at, style }: { className: string; at: "start" | "after"; style?: CSSProperties }) {
  return (
    <span
      className={`${className} pointer-events-none absolute top-1/2 h-[0.8em] w-[0.3em] -translate-y-1/2 ${at === "start" ? "left-0" : "left-full ml-[0.08em]"}`}
      style={{ background: "var(--ink, #f4f6f8)", ...style }}
    />
  );
}

export function TypedTitle({
  segments,
  label,
  className,
  style,
}: {
  segments: Segment[];
  /** what the title says, for screen readers */
  label: string;
  className?: string;
  style?: CSSProperties;
}) {
  const chars = segments.flatMap(([text, tone]) => [...text].map((ch) => ({ ch, tone })));
  const last = chars.length - 1;
  const at = (i: number) => `${START_MS + i * CHAR_MS}ms`;

  return (
    <span className={`normal-case ${className ?? ""}`} style={style}>
      <span className="sr-only">{label}</span>
      <span aria-hidden className="relative inline-block whitespace-pre">
        <Cursor className="typed-wait" at="start" style={{ "--dur": `${START_MS}ms` } as CSSProperties} />
        {chars.map(({ ch, tone }, i) => (
          <span key={i} className="typed-char relative" style={{ color: TONE[tone], animationDelay: at(i) }}>
            {ch}
            {i === last ? (
              <Cursor className="typed-cursor" at="after" style={{ animationDelay: at(i) }} />
            ) : (
              <Cursor
                className="typed-pass"
                at="after"
                style={{ animationDelay: at(i), "--dur": `${CHAR_MS}ms` } as CSSProperties}
              />
            )}
          </span>
        ))}
      </span>
    </span>
  );
}
