"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

/** three.js plus the board's own geometry is by far the heaviest thing on this
 *  page, and none of it is needed until someone has scrolled to the desk — so
 *  it's split out and fetched after hydration. Client-only: it paints its
 *  textures onto a real <canvas>, which doesn't exist while prerendering. */
const PcbViewer = dynamic(() => import("./pcb/PcbViewer"), { ssr: false });

/**
 * What the monitor (screen 1) shows while it sits on the desk: the section's
 * name across the top and the real ESP32 board turning below it, filling the
 * glass.
 *
 * Unlike screens 2 and 3, whose contents are drawn straight into `DeskSvg`,
 * this one can't live in the SVG: the board is WebGL. So it's an HTML layer
 * positioned over the same glass rect instead, in `%` of the desk viewBox so
 * it stays glued there at every width. The title bar is still SVG — drawn in
 * glass-local units, so it scales with the desk exactly like the rest of the
 * line art — and only the board is a separate positioned div.
 *
 * `pointer-events-none` throughout: the real <button> for this screen is a
 * sibling in `DeskScene` and has to keep receiving the clicks.
 */

const INK = "var(--ink, #f4f6f8)";
const PAPER = "var(--paper, #000)";
const MONO = "var(--font-mono), ui-monospace, monospace";

/** the monitor's glass — must track `Screen x={382} y={239} w={202} h={138}`
 *  (default inset 10) in `DeskSvg`, and `SCREENS` in `DeskScene` */
export const MONITOR_GLASS = { x: 392, y: 249, w: 182, h: 118 };
/** the glass's own corner radius, so the title bar's top corners can follow it
 *  instead of poking out square */
const GLASS_R = 4;

/** Matches the "SKILLS" and "# EXPERIENCE" headings on screens 2 and 3 — all
 *  three sections name themselves at the same size, in the same units. */
const TITLE_SIZE = 20;
/** deep enough to give `TITLE_SIZE` room to breathe */
const TITLE_H = 27;

/** everything under the title bar is the board */
const BODY = {
  x: 0,
  y: TITLE_H,
  w: MONITOR_GLASS.w,
  h: MONITOR_GLASS.h - TITLE_H,
};

const pct = (v: number, total: number) => `${(v / total) * 100}%`;

export default function ProjectsMonitorScreen() {
  const ref = useRef<HTMLDivElement>(null);
  // The board spins on the landing page, so it stops rendering once it's
  // scrolled away — see `running` in `PcbViewer`. It starts true: the desk is
  // on screen on load, and waiting for the observer's first callback only
  // delays the board appearing.
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), {
      rootMargin: "120px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const { x, y, w, h } = MONITOR_GLASS;

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute"
      style={{
        left: pct(x, 1600),
        top: pct(y, 740),
        width: pct(w, 1600),
        height: pct(h, 740),
      }}
    >
      <svg
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
      >
        {/* Title bar, edge to edge. Rounded along the top so it sits inside
            the glass's own corners, square along the bottom where it meets
            the board. */}
        <path
          d={`M0 ${GLASS_R} A${GLASS_R} ${GLASS_R} 0 0 1 ${GLASS_R} 0
              L${w - GLASS_R} 0 A${GLASS_R} ${GLASS_R} 0 0 1 ${w} ${GLASS_R}
              L${w} ${TITLE_H} L0 ${TITLE_H} Z`}
          fill={INK}
        />
        <text
          x={w / 2}
          y={TITLE_H / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={TITLE_SIZE}
          fontFamily={MONO}
          fill={PAPER}
        >
          PROJECTS
        </text>
      </svg>

      {/* the turning board, filling the rest of the glass */}
      <PcbViewer
        running={inView}
        className="absolute"
        style={{
          left: pct(BODY.x, w),
          top: pct(BODY.y, h),
          width: pct(BODY.w, w),
          height: pct(BODY.h, h),
        }}
      />
    </div>
  );
}
