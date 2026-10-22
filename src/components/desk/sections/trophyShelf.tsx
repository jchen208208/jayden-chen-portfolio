"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { AWARDS, type Award, type AwardObject } from "@/lib/site";
import { useSlotReel, type ReelTiming } from "@/hooks/useSlotReel";

/**
 * About's awards: a wall shelf under the contact sheet with one thing on it
 * per award — a cup, a medal on its stand, a plaque, a framed certificate, a
 * rosette — and a label under each, like a museum's. Drawn in the desk's own
 * line art (one stroke weight, opaque shapes, a few faint details).
 *
 * Hovering one lights it: it hops and swings on the elastic overshoot the
 * Projects and Experience pictures use and turns solid amber, its faint
 * details gone, and its rank spins on the slot reels and lands amber. The
 * labels read without any of that. All of it but the reel is CSS
 * (`.shelf-*` / `.award-*` in globals.css).
 */

/** the rank's spin on hover — Experience's dates' timing */
const RANK_REEL: ReelTiming = {
  firstLandMs: 110,
  landWindowMs: 320,
  jitterMs: 15,
  fastMs: 40,
  slowMs: 130,
  decelMs: 200,
};

/* ── the objects ─────────────────────────────────────────────────────────────
   Each is drawn in a 120 × 150 box standing on its bottom edge (the shelf).
   `award-body`: opaque shapes, outlined. `award-line`: outline only.
   `award-detail`: faint marks inside, gone once it's lit. */

/** a rosette's frilled edge: `bumps` scallops round a circle */
function scallop(cx: number, cy: number, r: number, bumps: number, depth: number) {
  const at = (a: number, rr: number) =>
    `${(cx + rr * Math.cos(a)).toFixed(2)} ${(cy + rr * Math.sin(a)).toFixed(2)}`;
  let d = "";
  for (let k = 0; k < bumps; k++) {
    const a0 = (k / bumps) * Math.PI * 2 - Math.PI / 2;
    const a1 = ((k + 1) / bumps) * Math.PI * 2 - Math.PI / 2;
    if (k === 0) d += `M${at(a0, r)}`;
    d += ` Q${at((a0 + a1) / 2, r + depth * 2)} ${at(a1, r)}`;
  }
  return `${d} Z`;
}

const ROSETTE_EDGE = scallop(60, 60, 27, 16, 3.2);

const OBJECTS: Record<AwardObject, ReactNode> = {
  cup: (
    <>
      <g className="award-line">
        <path d="M36 34 C20 34 17 50 26 59 C30 63 36 66 44 67" />
        <path d="M84 34 C100 34 103 50 94 59 C90 63 84 66 76 67" />
      </g>
      <g className="award-body">
        <path d="M34 26 H86 C86 58 78 76 64 82 H56 C42 76 34 58 34 26 Z" />
        <path d="M56 82 H64 L62.5 106 H57.5 Z" />
        <rect x={46} y={106} width={28} height={7} rx={1.5} />
        <rect x={36} y={113} width={48} height={37} rx={2} />
      </g>
      <g className="award-detail">
        <path d="M39 33 H81" />
        <rect x={48} y={123} width={24} height={15} rx={1} />
      </g>
    </>
  ),
  medal: (
    <>
      <g className="award-body">
        <rect x={57.5} y={38} width={5} height={104} />
        <rect x={32} y={142} width={56} height={8} rx={2} />
        <rect x={38} y={33} width={44} height={6} rx={2} />
        <path d="M42 39 H53 L60 68 L67 39 H78 L65 92 H55 Z" />
        <circle cx={60} cy={110} r={20} />
      </g>
      <g className="award-detail">
        <circle cx={60} cy={110} r={13} />
        <path d="M47.5 39 L58 82 M72.5 39 L62 82" />
      </g>
    </>
  ),
  plaque: (
    <>
      <g className="award-body">
        <path d="M30 150 V68 Q30 38 60 38 Q90 38 90 68 V150 Z" />
        <path d="M36 144 V69 Q36 44 60 44 Q84 44 84 69 V144 Z" />
        <circle cx={60} cy={78} r={14} />
        <rect x={42} y={108} width={36} height={22} rx={2} />
      </g>
      <g className="award-detail">
        <path d="M51 84 Q48 74 54 68 M69 84 Q72 74 66 68" />
        <path d="M48 116 H72 M52 123 H68" />
      </g>
    </>
  ),
  certificate: (
    <>
      {/* the easel leg it leans back on, behind the frame */}
      <g className="award-line">
        <path d="M84 72 L108 150" />
      </g>
      <g className="award-body">
        <rect x={22} y={52} width={74} height={98} rx={2} />
        <rect x={29} y={59} width={60} height={84} />
      </g>
      <g className="award-detail">
        <path d="M39 74 H79 M43 84 H75 M39 98 H79 M39 106 H71" />
        <circle cx={74} cy={127} r={6} />
      </g>
    </>
  ),
  rosette: (
    <>
      <g className="award-body">
        <path d="M52 84 L37 150 L44.5 143 L49 150 L62 90 Z" />
        <path d="M68 84 L83 150 L75.5 143 L71 150 L58 90 Z" />
        <path d={ROSETTE_EDGE} />
        <circle cx={60} cy={60} r={19} />
      </g>
      <g className="award-detail">
        <circle cx={60} cy={60} r={12} />
      </g>
    </>
  ),
};

function AwardItem({ award }: { award: Award }) {
  // bumped on each hover — every bump spins the rank
  const [spins, setSpins] = useState(0);
  const rank = useSlotReel(award.rank.toUpperCase(), { play: spins, timing: RANK_REEL });

  return (
    <li
      className="award"
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") setSpins((n) => n + 1);
      }}
    >
      <svg viewBox="0 0 120 150" aria-hidden className="award-art">
        {OBJECTS[award.object]}
      </svg>
      <span aria-hidden className="shelf-board" />
      <span aria-hidden className="shelf-bracket" />
      <div className="award-label">
        {/* the reel's text is decoration while it spins */}
        <span className="award-rank font-screen uppercase leading-none">
          <span aria-hidden>{rank}</span>
          <span className="sr-only">{award.rank}</span>
        </span>
        <span className="font-title text-sm uppercase leading-tight tracking-wide text-white md:text-base">
          {award.title}
        </span>
        <span className="font-mono text-[11px] uppercase tracking-wide text-white/50">
          {award.org} · {award.date.slice(0, 4)}
        </span>
        {award.summary && (
          <span className="font-mono text-xs leading-snug text-white/60">{award.summary}</span>
        )}
      </div>
    </li>
  );
}

export function TrophyShelf({
  perShelf,
  firstIndex,
}: {
  /** awards to a shelf — a narrow page hangs a few shelves */
  perShelf: number;
  /** where the shelves come in the page's order of arrival (`--i`) */
  firstIndex: number;
}) {
  const awards = [...AWARDS].sort((a, b) => b.date.localeCompare(a.date));
  const shelves: Award[][] = [];
  for (let i = 0; i < awards.length; i += perShelf) shelves.push(awards.slice(i, i + perShelf));

  return (
    <section aria-label="Awards" className="@container mx-auto flex w-full max-w-[60rem] flex-col gap-12">
      <h3
        className="about-in skills-heading text-center text-2xl md:text-3xl"
        style={{ "--i": firstIndex } as CSSProperties}
      >
        AWARDS
      </h3>
      {shelves.map((shelf, s) => (
        <ul
          key={s}
          className="about-in shelf"
          style={
            {
              "--i": firstIndex + 1 + s,
              "--cols": perShelf,
              gridTemplateColumns: `repeat(${shelf.length}, minmax(0, 1fr))`,
              // a shelf with fewer on it is a shorter shelf, not a sparser one
              width: `${(shelf.length / perShelf) * 100}%`,
            } as CSSProperties
          }
        >
          {shelf.map((award) => (
            <AwardItem key={award.title} award={award} />
          ))}
        </ul>
      ))}
    </section>
  );
}
