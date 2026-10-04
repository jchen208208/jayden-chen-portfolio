"use client";

import { useEffect, useRef } from "react";
import Hero from "./Hero";
import DeskScene from "./DeskScene";
import { clamp } from "@/lib/svg";
import { DESK_RUNWAY_VH, DESK_SCROLL, deskRise, deskZoom } from "@/lib/deskScroll";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

/**
 * Persistent title + desk. Lives in the `(desk)` layout so it stays mounted
 * while a section overlay is open.
 *
 * The desk is fully visible from the first frame — scrolling is only a camera
 * move over the runway (`lib/deskScroll`), one continuous glide with no
 * stops: the desk rises from "sitting low, title on top" while the title
 * lifts away, swells to full frame as it passes the centre (slowing down
 * there, never halting), then shrinks back to its rest size and rides up out
 * of the way as the next section rises into the space it leaves behind.
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
/** ease-in-out sine — sets off and settles without a jolt */
const easeInOut = (t: number) => (1 - Math.cos(Math.PI * t)) / 2;

/** the stretch of the move (as progress, 0–1) over which each piece plays */
const BEATS = {
  /** the title has faded out by here */
  heroFade: 0.21,
  /** …and finished lifting by here */
  heroLift: 0.44,
  /** the next section starts rising here, a beat behind the desk, and has
   *  arrived by the end of the move */
  nextIn: 0.62,
} as const;

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
      // progress through the whole move, 0 → 1
      const t = clamp(window.scrollY / (window.innerHeight * DESK_SCROLL), 0, 1);

      // title: fully visible at rest, fades + lifts quickly as the desk takes over
      const fade = clamp(t / BEATS.heroFade, 0, 1);
      const lift = easeOut(clamp(t / BEATS.heroLift, 0, 1));
      hero.style.opacity = String(1 - fade);
      hero.style.transform = `translate3d(0, ${(-56 * lift).toFixed(1)}px, 0)`;
      hero.style.pointerEvents = fade > 0.95 ? "none" : "auto";

      // desk: always visible, always moving. It rises steadily from `restY`
      // below centre to `restY` above it — slowest as it passes the centre —
      // while it swells to its framed size and back, peaking right there.
      const ty = DESK_POSE.restY * (1 - 2 * deskRise(t));
      const scale = 1 + (DESK_POSE.framed - 1) * deskZoom(t);
      desk.style.transform = `translate3d(0, ${ty.toFixed(1)}px, 0) scale(${scale.toFixed(4)})`;

      // next section: rises into the room the shrinking desk vacates, a beat
      // behind it so the two moves read as one handover rather than a crossfade
      const n = easeInOut(clamp((t - BEATS.nextIn) / (1 - BEATS.nextIn), 0, 1));
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
          className="absolute inset-x-0 top-0 flex justify-center pt-[6vh] will-change-transform sm:pt-[7vh]"
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
