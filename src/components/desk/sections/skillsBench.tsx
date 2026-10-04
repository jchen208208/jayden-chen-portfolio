"use client";

import { useState, type CSSProperties } from "react";
import { HARDWARE } from "../skillItems";
import type { CardOptions } from "./shared";
import { PAD, SkillPane } from "./skillsKit";
import { usedIn } from "./usedIn";

/**
 * Hardware & Design as three bench strips, each a small drawing of the work
 * doing its thing. They take turns on one 12 s loop (a slot each, see
 * `.sk-art` in globals.css) so there is only ever one amber moment at a time:
 * a solder joint heating and cooling, a trace routed between two pads, a
 * sketch pulled up into a block. Between turns each drawing rests finished
 * over a faint ghost of itself. Hovering a strip lights it and dims the rest.
 *
 * Drawn in 120 x 80 boxes. Line weight follows the desk's (about 2.4 px at the
 * size they are shown).
 */

const SW = 1.9;

/** the ghost every drawing rests on: the part, faint, so the animated layer
 *  always has something to draw over */
const GHOST = { stroke: "currentColor", strokeWidth: SW, opacity: 0.28 };

/** a through-hole joint: the iron comes in, the solder balls up round the
 *  lead and glows, the iron leaves, the joint cools */
function SolderArt() {
  return (
    <>
      <g stroke="currentColor" strokeWidth={SW}>
        <rect x={6} y={60} width={108} height={10} rx={2} />
        <rect x={48} y={56} width={32} height={4} rx={1} />
        <line x1={64} y1={14} x2={64} y2={56} />
      </g>
      <path className="sk-joint sk-anim" d="M50 56 Q64 34 78 56 Z" strokeWidth={SW} />
      <g className="sk-iron sk-anim" stroke="currentColor" strokeWidth={SW}>
        <path d="M70 47 L98 20 L104 26 L76 53 Z" fill="var(--paper, #000)" />
        <path d="M100 22 L113 9 L117 13 L104 26" fill="var(--paper, #000)" />
      </g>
    </>
  );
}

/** a trace laid between two pads: 45 degree bends, a via, an amber head */
const TRACE = "M27 56 H44 L60 40 H66 L82 24 H93";
function TraceArt() {
  return (
    <>
      <path d={TRACE} {...GHOST} />
      <g stroke="currentColor" strokeWidth={SW}>
        <path className="sk-trace sk-anim" pathLength={100} d={TRACE} />
        <circle cx={22} cy={56} r={5} />
        <circle cx={98} cy={24} r={5} />
        <circle className="sk-via" cx={63} cy={40} r={3.4} />
      </g>
      <path className="sk-spark sk-anim" pathLength={100} d={TRACE} strokeWidth={SW + 0.6} />
      <circle className="sk-padlit sk-anim" cx={98} cy={24} r={5} strokeWidth={SW} />
    </>
  );
}

/** a sketch pulled up into a block: the front face, then the extrusion */
const FACE = "M28 34 H68 V64 H28 Z";
const EDGES = "M28 34 L54 16 H94 L68 34 M94 16 V46 L68 64";
function BlockArt() {
  return (
    <>
      <g {...GHOST}>
        <path d={FACE} />
        <path d={EDGES} />
        <path d="M54 16 V46 H94 M54 46 L28 64" strokeDasharray="3 3.5" />
      </g>
      <path className="sk-face sk-anim" pathLength={100} d={FACE} stroke="currentColor" strokeWidth={SW} />
      <path className="sk-extrude sk-anim" pathLength={100} d={EDGES} strokeWidth={SW} />
    </>
  );
}

const ART = [SolderArt, TraceArt, BlockArt];

function Bench() {
  const [hover, setHover] = useState<string | null>(null);
  return (
    <div
      className="flex h-full w-full flex-col font-mono text-white"
      style={{ padding: PAD }}
      onMouseLeave={() => setHover(null)}
    >
      {HARDWARE.map((item, i) => {
        const Art = ART[i];
        const where = usedIn(item);
        return (
          <div
            key={item.name}
            className="sk-dim flex min-h-0 flex-1 items-center border-b border-white/15 last:border-b-0"
            data-dim={hover !== null && hover !== item.name}
            style={{ gap: "4cqw" }}
            tabIndex={0}
            onMouseEnter={() => setHover(item.name)}
            onFocus={() => setHover(item.name)}
            onBlur={() => setHover(null)}
          >
            <svg
              viewBox="0 0 120 80"
              aria-hidden
              className="sk-art h-full max-h-[11rem] shrink-0 py-[2cqw]"
              style={{ width: "38%", "--slot": i } as CSSProperties}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <Art />
            </svg>
            <div className="min-w-0">
              <div
                className="uppercase leading-tight tracking-wide"
                style={{ fontSize: "clamp(14px, 4cqw, 22px)" }}
              >
                {item.name}
                <span className="sk-pick-dot" data-on={hover === item.name} />
              </div>
              <div
                className="text-white/60"
                style={{ fontSize: "clamp(11px, 3.1cqw, 16px)", marginTop: "0.5em" }}
              >
                {item.note}
              </div>
              {where.length > 0 && (
                <div
                  className="uppercase tracking-wide text-white/45"
                  style={{ fontSize: "clamp(10px, 2.9cqw, 14px)", marginTop: "0.6em" }}
                >
                  Used in {where.join(" · ")}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function BenchBody(opts: CardOptions) {
  return (
    <SkillPane {...opts} aspect="4 / 4.4">
      <Bench />
    </SkillPane>
  );
}
