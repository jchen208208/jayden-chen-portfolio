"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { LANGUAGES, type Seg } from "../skillItems";
import type { CardOptions } from "./shared";
import { PAD, SkillPane, UsedIn, useLive } from "./skillsKit";
import { usedIn } from "./usedIn";

/**
 * Languages: a row of tabs over a small editor that types out the selected
 * language. It walks the tabs on its own and stops while you are on it; a
 * hover or click picks one. Keywords and strings take the glow (the same rule
 * as the desk's code screen), everything else is ink.
 */

/** how long a language stays up before the next one is typed */
const CYCLE_MS = 7500;
const CHAR_MS = 55;
/** a beat between one line finishing and the next starting */
const LINE_GAP_MS = 160;
const START_MS = 250;

const lineLength = (segs: Seg[]) => segs.reduce((n, [text]) => n + text.length, 0);

function CodeLine({ segs, delay, last }: { segs: Seg[]; delay: number; last: boolean }) {
  const n = lineLength(segs);
  const timing = {
    animationDuration: `${n * CHAR_MS}ms`,
    animationDelay: `${delay}ms`,
  };
  return (
    <div className="flex items-center whitespace-pre">
      <span
        className="sk-type sk-anim"
        style={{ "--n": n, ...timing, animationTimingFunction: `steps(${n}, end)` } as CSSProperties}
      >
        {segs.map(([text, tone], i) => (
          <span key={i} className={`sk-${tone}`}>
            {text}
          </span>
        ))}
      </span>
      <span className={`sk-caret sk-anim ${last ? "sk-caret-last" : ""}`} style={timing} />
    </div>
  );
}

function Editor() {
  const live = useLive();
  const [active, setActive] = useState(0);
  const [hold, setHold] = useState(false);

  // on to the next language after a while — unless it's being looked at
  useEffect(() => {
    if (!live || hold) return;
    const t = setTimeout(() => setActive((a) => (a + 1) % LANGUAGES.length), CYCLE_MS);
    return () => clearTimeout(t);
  }, [live, hold, active]);

  const lang = LANGUAGES[active];
  // each line starts when the one before it has been typed
  const delays = lang.lines.map((_, i) =>
    lang.lines
      .slice(0, i)
      .reduce((at, segs) => at + lineLength(segs) * CHAR_MS + LINE_GAP_MS, START_MS),
  );

  return (
    <div
      className="flex h-full w-full flex-col font-mono text-white"
      style={{ padding: PAD, gap: "clamp(12px, 4cqw, 24px)" }}
      onMouseEnter={() => setHold(true)}
      onMouseLeave={() => setHold(false)}
      onFocus={() => setHold(true)}
      onBlur={() => setHold(false)}
    >
      <div role="tablist" aria-label="Languages" className="flex" style={{ gap: "2.2cqw" }}>
        {LANGUAGES.map((l, i) => (
          <button
            key={l.name}
            type="button"
            role="tab"
            aria-selected={i === active}
            aria-label={l.name}
            title={l.name}
            onMouseEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            onClick={() => setActive(i)}
            className="flex flex-1 cursor-pointer flex-col items-center outline-none"
            style={{ gap: "1.6cqw" }}
          >
            <span
              className="sk-tab flex aspect-square w-full items-center justify-center rounded-lg border-2 border-white"
              data-on={i === active}
              style={{ padding: "20%" }}
            >
              <l.Icon className="h-full w-full" />
            </span>
            <span className="sk-tab-bar" data-on={i === active} />
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1">
        <div
          className="uppercase tracking-wide text-white/45"
          style={{ fontSize: "clamp(10px, 2.9cqw, 14px)" }}
        >
          {lang.file}
        </div>
        {/* remounted per language, which restarts every line's typing */}
        <div
          key={active}
          className="flex"
          style={{
            marginTop: "2cqw",
            gap: "3cqw",
            fontSize: "clamp(11px, 4.1cqw, 24px)",
            lineHeight: 1.75,
            fontVariantLigatures: "none",
          }}
        >
          <div aria-hidden className="select-none text-right text-white/35">
            {lang.lines.map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
          <div className="min-w-0">
            {lang.lines.map((segs, i) => (
              <CodeLine
                key={i}
                segs={segs}
                delay={delays[i]}
                last={i === lang.lines.length - 1}
              />
            ))}
          </div>
        </div>
      </div>

      <UsedIn names={usedIn(lang)} />
    </div>
  );
}

export default function LanguagesBody(opts: CardOptions) {
  return (
    <SkillPane {...opts} aspect="1 / 1">
      <Editor />
    </SkillPane>
  );
}
