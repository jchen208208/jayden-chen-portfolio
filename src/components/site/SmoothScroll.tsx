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
 * It also owns a small *gate* at the framed beat (`deskGateY`), so one hard
 * flick can't fly straight past the desk in full frame: the first time the
 * scroll reaches the frame it's caught there, held for `GATE_HOLD_MS`, then
 * let go for good — whether or not you're still scrolling. (It used to stay
 * shut until input went quiet, which with a continuous scroll meant being
 * stuck there; that read as a pause.)
 *
 * Only runs on "/": the section routes lock page scroll (`useScrollLock`)
 * and scroll inside their own `AppWindow`, and a page-level Lenis would
 * keep scrolling the desk behind them. Skipped entirely under
 * `prefers-reduced-motion`.
 */

/** how close (px) the scroll has to get to the frame to count as caught —
 *  the desk is barely moving there, so a few px short looks identical, and
 *  waiting for Lenis's ease to close the last pixel would only lengthen the
 *  catch */
const GATE_REACHED_PX = 12;
/** how long the frame holds once caught before the gate lets go (ms) */
const GATE_HOLD_MS = 150;

export default function SmoothScroll() {
  const pathname = usePathname();
  const reduced = usePrefersReducedMotion();
  const enabled = pathname === "/" && !reduced;

  useEffect(() => {
    if (!enabled) return;

    // already past the frame on load (a restored scroll position) — nothing to gate
    let open = window.scrollY >= deskGateY(window.innerHeight) - GATE_REACHED_PX;

    const lenis = new Lenis({
      autoRaf: true,
      virtualScroll: (data) => {
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
    // back to the frame, and opens the gate once the hold is up.
    let raf = 0;
    let caughtAt: number | null = null;
    const watch = (now: number) => {
      const gate = deskGateY(window.innerHeight);
      if (lenis.targetScroll > gate + 0.5) {
        lenis.scrollTo(gate, { lerp: 0.12, force: true });
      }
      if (caughtAt === null && lenis.animatedScroll >= gate - GATE_REACHED_PX) {
        caughtAt = now;
      }
      if (caughtAt !== null && now - caughtAt >= GATE_HOLD_MS) {
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
