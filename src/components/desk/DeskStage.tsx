"use client";

import { useEffect, useRef } from "react";
import Hero from "./Hero";
import DeskScene from "./DeskScene";
import { clamp } from "@/lib/svg";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

/**
 * Persistent title + desk. Lives in the `(desk)` layout so it stays mounted
 * while a section overlay is open.
 *
 * The desk is fully visible from the first frame — scrolling is only a camera
 * move: it pans/zooms the desk from "sitting low, title on top" to "fully
 * framed", and lifts the title out of the way. Driven by one rAF-throttled
 * scroll listener writing styles directly (the plain, reliable pattern — no
 * motion-value rig). Falls back to a static stacked layout under
 * `prefers-reduced-motion`.
 */
export default function DeskStage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const deskRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) {
      for (const el of [heroRef.current, deskRef.current]) {
        if (el) el.style.cssText = "";
      }
      return;
    }
    const hero = heroRef.current;
    const desk = deskRef.current;
    if (!hero || !desk) return;

    let raf = 0;
    const apply = () => {
      raf = 0;
      const p = clamp(window.scrollY / (window.innerHeight * 0.82), 0, 1);
      const ease = 1 - Math.pow(1 - p, 3); // ease-out cubic

      // title: fully visible at rest, fades + lifts quickly as the desk takes over
      hero.style.opacity = String(clamp(1 - p * 2.1, 0, 1));
      hero.style.transform = `translate3d(0, ${(-56 * ease).toFixed(1)}px, 0)`;
      hero.style.pointerEvents = p > 0.45 ? "none" : "auto";

      // desk: always visible; starts low at rest size, rises and zooms slightly
      // closer as the scroll brings it into full frame
      const ty = (1 - ease) * 184;
      const scale = 1 + 0.08 * ease;
      desk.style.transform = `translate3d(0, ${ty.toFixed(1)}px, 0) scale(${scale.toFixed(4)})`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };

    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [reduced]);

  if (reduced) {
    return (
      <div className="flex flex-col gap-16 py-16">
        <Hero />
        <DeskScene />
      </div>
    );
  }

  return (
    <div className="desk-runway" style={{ height: "155vh" }}>
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* desk — visible from the first frame, the scroll only reframes it */}
        <div
          ref={deskRef}
          className="absolute inset-0 flex items-center justify-center will-change-transform"
        >
          <DeskScene className="w-full" />
        </div>
        {/* title — sits over the desk, lifts away on scroll */}
        <div
          ref={heroRef}
          className="absolute inset-x-0 top-0 flex justify-center pt-[11vh] will-change-transform sm:pt-[13vh]"
        >
          <Hero />
        </div>
      </div>
    </div>
  );
}
