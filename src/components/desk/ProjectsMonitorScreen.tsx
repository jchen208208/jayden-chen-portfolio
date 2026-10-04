"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { percentBox, screenById } from "@/lib/desk";

/** three.js plus the board's own geometry is by far the heaviest thing on this
 *  page, and none of it is needed until someone has scrolled to the desk — so
 *  it's split out and fetched after hydration. Client-only: it paints its
 *  textures onto a real <canvas>, which doesn't exist while prerendering. */
const PcbViewer = dynamic(() => import("./pcb/PcbViewer"), { ssr: false });

/**
 * What the monitor (screen 1) shows while it sits on the desk: two of
 * Jayden's real boards turning side by side, filling the glass — the ESP32-S3
 * USB dongle on the left, SPARC on the right. (Its name is on the neon sign
 * above it, `NeonSigns`.)
 *
 * Unlike screens 2 and 3, whose contents are drawn straight into `DeskSvg`,
 * this one can't live in the SVG: the board is WebGL. So it's an HTML layer
 * positioned over the same glass rect instead, in `%` of the desk viewBox so
 * it stays glued there at every width.
 *
 * `pointer-events-none` throughout: the real <button> for this screen is a
 * sibling in `DeskScene` and has to keep receiving the clicks.
 */

const MONITOR_GLASS = screenById("projects").glass;

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

  return (
    <div
      ref={ref}
      aria-hidden
      data-light="projects"
      className="screen-light pointer-events-none absolute"
      style={percentBox(MONITOR_GLASS)}
    >
      <PcbViewer boards={["esp32", "sparc"]} running={inView} className="absolute inset-0" />
    </div>
  );
}
