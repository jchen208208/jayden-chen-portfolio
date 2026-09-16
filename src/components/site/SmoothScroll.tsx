"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { deskGateY } from "@/lib/deskScroll";

/**
 * Lenis smooth scrolling for the main page ("/") —
 * https://github.com/darkroomengineering/lenis
 *
 * Lenis eases the real window scroll position rather than faking it with a
 * transform, so `DeskStage`'s own `window.scrollY` listener keeps working
 * unchanged — it just receives smoothed values, which makes the desk's
 * pan/zoom glide instead of stepping with each wheel notch.
 *
 * It also owns the *gate* at the framed beat (`deskGateY`): the desk-in-frame
 * moment is the point of the whole runway, so a single hard flick must not be
 * able to fly straight past it into the section below. While the gate is shut
 * every downward delta is trimmed to whatever room is left in front of it;
 * it opens once the page has actually settled on the frame.
 *
 * Only runs on "/": the section routes lock page scroll (`useScrollLock`)
 * and scroll inside their own `AppWindow`, and a page-level Lenis would
 * keep scrolling the desk behind them. Skipped entirely under
 * `prefers-reduced-motion`.
 */

/** the gate opens once the frame is reached and input has been quiet this long (ms) */
const GATE_DWELL = 180;

export default function SmoothScroll() {
  const pathname = usePathname();
  const reduced = usePrefersReducedMotion();
  const enabled = pathname === "/" && !reduced;

  useEffect(() => {
    if (!enabled) return;

    // already past the frame on load (a restored scroll position) — nothing to gate
    let open = window.scrollY >= deskGateY(window.innerHeight) - 1;
    let lastInput = 0;

    const lenis = new Lenis({
      autoRaf: true,
      virtualScroll: (data) => {
        lastInput = performance.now();
        if (open || data.deltaY <= 0) return true;
        const room = deskGateY(window.innerHeight) - lenis.targetScroll;
        if (data.deltaY > room) {
          // never trim to exactly 0: Lenis reads a zero delta as "not a scroll
          // gesture", bails before `preventDefault()`, and the browser's own
          // wheel scrolling carries the page straight past the gate.
          data.deltaY = Math.max(room, 0.001);
        }
        return true;
      },
    });

    // The delta trim above covers wheel and touch-drag. Touch *inertia*,
    // keyboard paging and scrollbar drags reach the scroll position by other
    // routes, so while the gate is shut a frame loop also pulls any overshoot
    // back to the frame, and decides when to open.
    let raf = 0;
    const watch = () => {
      const gate = deskGateY(window.innerHeight);
      if (lenis.targetScroll > gate + 0.5) {
        lenis.scrollTo(gate, { lerp: 0.12, force: true });
      }
      if (
        lenis.animatedScroll >= gate - 1 &&
        performance.now() - lastInput > GATE_DWELL
      ) {
        open = true;
        raf = 0;
        return;
      }
      raf = requestAnimationFrame(watch);
    };
    if (!open) raf = requestAnimationFrame(watch);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, [enabled]);

  return null;
}
