"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

/**
 * Lenis smooth scrolling for the main page ("/") —
 * https://github.com/darkroomengineering/lenis
 *
 * Lenis eases the real window scroll position rather than faking it with a
 * transform, so `DeskStage`'s own `window.scrollY` listener keeps working
 * unchanged — it just receives smoothed values, which makes the desk's
 * pan/zoom glide instead of stepping with each wheel notch.
 *
 * Only runs on "/": the section routes lock page scroll (`useScrollLock`)
 * and scroll inside their own `AppWindow`, and a page-level Lenis would
 * keep scrolling the desk behind them. Skipped entirely under
 * `prefers-reduced-motion`.
 */
export default function SmoothScroll() {
  const pathname = usePathname();
  const reduced = usePrefersReducedMotion();
  const enabled = pathname === "/" && !reduced;

  useEffect(() => {
    if (!enabled) return;
    const lenis = new Lenis({ autoRaf: true });
    return () => lenis.destroy();
  }, [enabled]);

  return null;
}
