"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { Cast, Critter } from "./critters";
import { BUMPINESS, INK, MARGIN, PX, bumpyFrame, toPaths, type Stroke } from "./pixelArt";

/**
 * An Experience picture's pixel-art border — the same little-bumps border
 * round every picture (`bumpyFrame`) — and the creature hiding behind the
 * picture with its ears over the top edge (art in `critters.ts`). Both
 * sit in `RoleShot`'s `.xp-shot` beside the picture's own frame, so they hop
 * and swing with it; CSS layers them (`.px-*` in globals.css): the head
 * behind the picture, the border over it, the paws over the border.
 *
 * The creature's moves all hang off `--lit`, the switch the picture's colour
 * already uses — at rest its ears and eyes peek over; lit, it pops up a
 * pixel at a time and slaps its paws on the edge.
 */

/** the border's size in art pixels until it's been measured — about the
 *  Experience list's picture (~532 × 332 px), so the server's drawing is
 *  near enough that nothing jumps when it is */
const DEFAULT_SIZE = { cols: 133, rows: 83 };

function Strokes({ strokes }: { strokes: Stroke[] }) {
  return strokes.map(({ letter, d }) => <path key={letter} d={d} fill={INK[letter]} />);
}

/** the border, redrawn to the picture's size so its pixels stay square. Its
 *  bumps stand just outside the picture (the SVG draws past its own box),
 *  and none on the stretch of the top edge where `cast`'s creature peeks. */
export function PixelBorder({ cast }: { cast: Cast }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [size, setSize] = useState(DEFAULT_SIZE);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const cols = Math.max(12, Math.round(entry.contentRect.width / PX));
      const rows = Math.max(12, Math.round(entry.contentRect.height / PX));
      setSize((s) => (s.cols === cols && s.rows === rows ? s : { cols, rows }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const strokes = useMemo(() => {
    const from = Math.floor(cast.x * size.cols);
    const clear = [from - 1, from + cast.critter.head[0].length] as const;
    return toPaths(bumpyFrame(size.cols, size.rows, BUMPINESS, clear));
  }, [size, cast]);

  return (
    <span ref={ref} aria-hidden className="px-border">
      <svg
        viewBox={`${MARGIN} ${MARGIN} ${size.cols} ${size.rows}`}
        preserveAspectRatio="none"
        shapeRendering="crispEdges"
        overflow="visible"
      >
        <Strokes strokes={strokes} />
      </svg>
    </span>
  );
}

type Drawn = { head: Stroke[]; blink: Stroke[]; paws: Stroke[] };
const drawn = new Map<Critter, Drawn>();

/** a creature's strokes, worked out once — the blink is only the pixels
 *  that change, laid over the open eyes */
function draw(critter: Critter): Drawn {
  let d = drawn.get(critter);
  if (!d) {
    const { head, blink, paws } = critter;
    const shut = head.map((open, y) => {
      const row = blink.rows[y - blink.from];
      return row ? [...row].map((letter, x) => (letter === open[x] ? "." : letter)).join("") : "";
    });
    d = { head: toPaths(head), blink: toPaths(shut), paws: toPaths(paws) };
    drawn.set(critter, d);
  }
  return d;
}

/** the creature: its head (behind the picture) and its paws (over the
 *  border) */
export function Peeker({ cast }: { cast: Cast }) {
  const { critter, x } = cast;
  const { head, blink, paws } = draw(critter);
  const w = critter.head[0].length;
  const h = critter.head.length;
  const place = {
    "--x": x,
    "--rest": critter.rest,
    "--up": critter.up,
    "--rise": critter.up - critter.rest,
  } as CSSProperties;

  return (
    <>
      <svg
        aria-hidden
        className="px-head"
        viewBox={`0 0 ${w} ${h}`}
        width={w * PX}
        height={h * PX}
        shapeRendering="crispEdges"
        style={place}
      >
        <Strokes strokes={head} />
        <g className="px-blink">
          <Strokes strokes={blink} />
        </g>
      </svg>
      <svg
        aria-hidden
        className="px-paws"
        viewBox={`0 0 ${w} ${critter.paws.length}`}
        width={w * PX}
        height={critter.paws.length * PX}
        shapeRendering="crispEdges"
        style={place}
      >
        <Strokes strokes={paws} />
      </svg>
    </>
  );
}
