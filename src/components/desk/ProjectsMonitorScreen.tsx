"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { percentBox, screenById } from "@/lib/desk";
import ScreenTitleBar, { titleBarHeight } from "./ScreenTitleBar";

/** three.js plus the board's own geometry is by far the heaviest thing on this
 *  page, and none of it is needed until someone has scrolled to the desk — so
 *  it's split out and fetched after hydration. Client-only: it paints its
 *  textures onto a real <canvas>, which doesn't exist while prerendering. */
const PcbViewer = dynamic(() => import("./pcb/PcbViewer"), { ssr: false });

/**
 * What the monitor (screen 1) shows while it sits on the desk: the section's
 * name across the top and two of Jayden's real boards turning side by side
 * below it — the ESP32-S3 USB dongle on the left, SPARC on the right.
 *
 * Unlike screens 2 and 3, whose contents are drawn straight into `DeskSvg`,
 * this one can't live in the SVG: the board is WebGL. So it's an HTML layer
 * positioned over the same glass rect instead, in `%` of the desk viewBox so
 * it stays glued there at every width. The title strip (`ScreenTitleBar`) is still SVG, drawn in
 * glass-local units, so it scales with the desk exactly like the rest of the
 * line art — and only the board is a separate positioned div.
 *
 * `pointer-events-none` throughout: the real <button> for this screen is a
 * sibling in `DeskScene` and has to keep receiving the clicks.
 */

const MONITOR_GLASS = screenById("projects").glass;
/** the glass's own corner radius (`max(2, r - 4)` for the default `r={8}`) */
const GLASS_R = 4;

const TITLE_H = titleBarHeight(1);
/** everything under the title strip is the boards */
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

  const { w, h } = MONITOR_GLASS;

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute"
      style={percentBox(MONITOR_GLASS)}
    >
      <svg
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
      >
        <ScreenTitleBar x={0} y={0} w={w} r={GLASS_R} lines={["PROJECTS"]} />
      </svg>

      {/* the turning board, filling the rest of the glass */}
      <PcbViewer
        boards={["esp32", "sparc"]}
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
