"use client";

import { useEffect, useRef } from "react";
import Hero from "./Hero";
import DeskScene from "./DeskScene";
import { clamp } from "@/lib/svg";
import { DESK_RUNWAY_VH, DESK_TIMELINE } from "@/lib/deskScroll";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

/**
 * Persistent title + desk. Lives in the `(desk)` layout so it stays mounted
 * while a section overlay is open.
 *
 * The desk is fully visible from the first frame — scrolling is only a camera
 * move over the `DESK_TIMELINE` runway:
 *
 *   1. *zoom in* — the desk pans up from "sitting low, title on top" into full
 *      frame while the title lifts away;
 *   2. *hold* — the framed desk, the beat `SmoothScroll` gates on;
 *   3. *zoom out* — the reverse move: the desk shrinks past its rest size and
 *      rides up out of the way as the next section rises into the space it
 *      leaves behind.
 *
 * Driven by one rAF-throttled scroll listener writing styles directly (the
 * plain, reliable pattern — no motion-value rig). Falls back to a static
 * stacked layout under `prefers-reduced-motion`.
 */

/**
 * The desk's pose at each beat of the runway. The two ends are mirror images:
 * the desk starts at its natural size sitting `restY` *below* centre with the
 * title above it, and parks at that same size `restY` *above* centre with the
 * next section below it — the opening composition, flipped.
 */
const DESK_POSE = {
  /** px off centre the desk sits at either end — below at rest, above once parked */
  restY: 184,
  /** scale at the framed beat in the middle; both ends sit at 1 */
  framed: 1.35,
} as const;

/** ease-out cubic */
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

export default function DeskStage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const deskRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) {
      for (const el of [heroRef.current, deskRef.current, nextRef.current]) {
        if (el) el.style.cssText = "";
      }
      return;
    }
    const hero = heroRef.current;
    const desk = deskRef.current;
    const next = nextRef.current;
    if (!hero || !desk || !next) return;

    let raf = 0;
    const apply = () => {
      raf = 0;
      const vh = window.innerHeight;
      const y = window.scrollY;

      // phase 1 — zoom in
      const p = clamp(y / (vh * DESK_TIMELINE.zoomIn), 0, 1);
      const zin = easeOut(p);
      // phase 2 — zoom out, starting once the hold is over
      const outStart = vh * (DESK_TIMELINE.zoomIn + DESK_TIMELINE.hold);
      const q = clamp((y - outStart) / (vh * DESK_TIMELINE.zoomOut), 0, 1);
      const zout = easeOut(q);

      // title: fully visible at rest, fades + lifts quickly as the desk takes over
      hero.style.opacity = String(clamp(1 - p * 2.1, 0, 1));
      hero.style.transform = `translate3d(0, ${(-56 * zin).toFixed(1)}px, 0)`;
      hero.style.pointerEvents = p > 0.45 ? "none" : "auto";

      // desk: always visible; starts low at its natural size, rises and zooms
      // in to fill the frame, then runs the same move backwards — back down to
      // that same natural size, but parked above centre instead of below it
      const ty = (1 - zin) * DESK_POSE.restY - zout * DESK_POSE.restY;
      const scale = 1 + (DESK_POSE.framed - 1) * (zin - zout);
      desk.style.transform = `translate3d(0, ${ty.toFixed(1)}px, 0) scale(${scale.toFixed(4)})`;

      // next section: rises into the room the shrinking desk vacates, a beat
      // behind it so the two moves read as one handover rather than a crossfade
      const n = easeOut(clamp((q - 0.22) / 0.78, 0, 1));
      next.style.opacity = String(n);
      next.style.transform = `translate3d(0, ${((1 - n) * 56).toFixed(1)}px, 0)`;
      next.style.pointerEvents = n > 0.5 ? "auto" : "none";
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
        <NextSection />
      </div>
    );
  }

  return (
    <div className="desk-runway" style={{ height: `${DESK_RUNWAY_VH}vh` }}>
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
        {/* next section — hidden under the framed desk until it zooms back out */}
        <NextSection
          ref={nextRef}
          className="absolute inset-x-0 bottom-0 flex justify-center pb-[11vh] opacity-0 will-change-transform sm:pb-[13vh]"
        />
      </div>
    </div>
  );
}

/** placeholder for whatever follows the desk. */
function NextSection({
  ref,
  className = "",
}: {
  ref?: React.Ref<HTMLElement>;
  className?: string;
}) {
  return (
    <section ref={ref} aria-labelledby="after-desk" className={className}>
      <h2
        id="after-desk"
        className="font-title text-[clamp(2.5rem,7vw,5rem)] leading-none text-white"
      >
        Hi! Let&apos;s build something! #opentowork
      </h2>
    </section>
  );
}
