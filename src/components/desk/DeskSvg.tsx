import type { CSSProperties } from "react";
import { DESK_GRID, DESK_PX, DESK_VIEWBOX } from "@/lib/desk";
import {
  BULB_LIT,
  CHAIN_PULLED,
  CHAIN_REST,
  DESK_ART,
  NOTES,
  POWER_OFF,
  POWER_ON,
} from "./pixel/deskArt";
import { DESK_FILL, type Cells } from "./pixel/palette";
import PcFanLights from "./PcFanLights";

/**
 * "The Desk" — Jayden's setup as pixel art, in the lotus's style
 * (`LotusBloom`): the room in the lotus's greys, lit from the upper left,
 * every object a dark body with a pale rim along its top and left edges and
 * a dimmer one along its bottom and right.
 *
 * Every object keeps the shape, size and place it had as line art: the
 * pixels are generated from that geometry, part by part, by
 * `scripts/desk-pixels.mjs` (`pixel/deskArt.ts`), one art pixel to
 * `DESK_PX` desk units:
 *
 *   tool wall → bookshelf → plant → 3D printer → desk → soldering station →
 *   cactus → speaker → lamp → four screens → PC tower → bin → chair
 *
 * The still scene is one image, drawn with its pixels kept square and sharp
 * at any size. Over it, in the theme's light, go the parts that change: the
 * lamp's bulb and pull chain, the PC's fans and power button (all switched in
 * `DeskScene`), and the notes rising off the speaker. Each screen's glass is
 * left open: what's on it is an HTML layer over the desk (`DeskScene`).
 */

/** pixels to draw, one path per colour */
function Pixels({ cells }: { cells: Cells }) {
  return cells.map(([letter, d]) => <path key={letter} d={d} fill={DESK_FILL[letter]} />);
}

export default function DeskSvg({
  className,
  lampOn = false,
  chainPulled = false,
  pcFans = false,
}: {
  className?: string;
  /** the PC's RGB fans are lit (`PcFanLights`) */
  pcFans?: boolean;
  /** lit, the bulb fills with the glow */
  lampOn?: boolean;
  /** mid-pull: the chain is yanked down, its beads spread (the light flips
   *  at the bottom of the pull, then the chain snaps back — timed in
   *  DeskScene) */
  chainPulled?: boolean;
}) {
  const { x, w, h } = DESK_VIEWBOX;

  return (
    <svg
      viewBox={`${x} 0 ${w} ${h}`}
      className={className}
      aria-hidden
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
    >
      <image
        href={DESK_ART}
        x={DESK_GRID.x}
        y={DESK_GRID.y}
        width={DESK_GRID.cols * DESK_PX}
        height={DESK_GRID.rows * DESK_PX}
        preserveAspectRatio="none"
        style={{ imageRendering: "pixelated" }}
      />
      {/* the live parts, in art pixels */}
      <g
        transform={`translate(${DESK_GRID.x} ${DESK_GRID.y}) scale(${DESK_PX})`}
        shapeRendering="crispEdges"
      >
        {lampOn && <Pixels cells={BULB_LIT} />}
        {/* amber at its foot — the one thing here to grab */}
        <Pixels cells={chainPulled ? CHAIN_PULLED : CHAIN_REST} />
        <PcFanLights on={pcFans} />
        {/* the fans' switch, in the light, lit while they're on */}
        <Pixels cells={pcFans ? POWER_ON : POWER_OFF} />
        {/* a couple of notes drifting up off the speaker a pixel at a time
            and blinking out (`.speaker-note`, globals.css) — it's playing,
            and there to be played with */}
        {NOTES.map((n) => (
          <g key={`${n.x}-${n.delay}`} transform={`translate(${n.x} ${n.y})`}>
            <g className="speaker-note" style={{ animationDelay: `${n.delay}s` } as CSSProperties}>
              <Pixels cells={n.cells} />
            </g>
          </g>
        ))}
      </g>
    </svg>
  );
}
