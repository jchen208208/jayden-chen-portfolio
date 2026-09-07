"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { MASTER } from "./plates";

/** Generated clip: piece2-canopy pushing into the focal tree's leaves.
 *  Real duration is read off the element once metadata loads (see below);
 *  this is only the pre-load fallback so the remap has something to divide
 *  by before then. */
const FALLBACK_DURATION = 5.04;

/**
 * The source clip barely moves for its first ~70% and rushes through the
 * actual push in the last ~30% (measured by sampling frames — see chat).
 * Scrubbing scroll -> currentTime *linearly* would spend most of the user's
 * scroll on a frame that isn't visibly changing, then blow through the
 * interesting part in a flick. This curve fixes that without touching the
 * clip itself: f^k with k<1 rises steeply near f=0 (fast-forwards through
 * the static stretch in a small slice of scroll) and flattens near f=1
 * (fine, slow control through the actual push). No kink, one knob (k).
 */
const REMAP_K = 0.22;
function remap(f: number) {
  return Math.pow(Math.min(Math.max(f, 0), 1), REMAP_K);
}

/**
 * Scene 2 — continues straight off WaterfallScene (no fade between them).
 * Scroll scrubs the transition video's currentTime through most of the
 * section; the video's own final frame still shows a hint of branch
 * structure, so the last stretch of scroll adds a further CSS push-in on
 * top of it, landing on an even, textured close-up for the text.
 */
export default function CanopyScene() {
  const ref = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const reduce = useReducedMotion();
  const k = reduce ? 0 : 1;

  const [duration, setDuration] = useState(FALLBACK_DURATION);

  const { scrollYProgress: p } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  /* video scrubs across the first 75% of the section's scroll */
  const scrubT = useTransform(p, [0, 0.75], [0, 1]);
  useMotionValueEvent(scrubT, "change", (f) => {
    const v = videoRef.current;
    if (!v || Number.isNaN(v.duration)) return;
    v.currentTime = remap(f) * duration;
  });

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onMeta = () => setDuration(v.duration || FALLBACK_DURATION);
    v.addEventListener("loadedmetadata", onMeta);
    v.pause();
    return () => v.removeEventListener("loadedmetadata", onMeta);
  }, []);

  /* final push once the clip has landed on its last frame — crops out the
     remaining branch hint in that frame's bottom-right corner */
  const endScale = useTransform(p, [0.75, 0.88], [1, 1 + 0.24 * k]);

  /* text arrives once the leaves have fully settled */
  const textOpacity = useTransform(p, [0.86, 0.96], [0, 1]);
  const textY = useTransform(p, [0.86, 0.96], [22 * k, 0]);

  return (
    <section ref={ref} className="relative h-[280vh] bg-paper">
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
        {/* ---------- TRANSITION (scroll-scrubbed) ---------- */}
        <motion.video
          ref={videoRef}
          aria-hidden
          muted
          playsInline
          preload="auto"
          poster={MASTER.canopy}
          src="/plates/master/transition-canopy-leaves.mp4"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ scale: endScale, transformOrigin: "45% 40%" }}
        />

        {/* ---------- GRADE / VIGNETTE ---------- */}
        <div
          className="pointer-events-none absolute inset-0 grain"
          style={{
            background:
              "radial-gradient(120% 90% at 50% 55%,transparent 45%,rgba(6,4,14,0.5) 100%)",
          }}
        />

        {/* ---------- TEXT (over the settled leaves) ---------- */}
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
          style={{ opacity: textOpacity, y: textY }}
        >
          <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.42em] text-sun-soft/90 [text-shadow:0_1px_14px_rgba(0,0,0,0.6)]">
            02 — The Canopy
          </p>
          <h2 className="max-w-2xl font-display text-4xl font-light leading-tight text-ink [text-shadow:0_2px_24px_rgba(0,0,0,0.65)] sm:text-6xl">
            Beneath the leaves,
            <br />
            the work begins<span className="text-ember">.</span>
          </h2>
        </motion.div>
      </div>
    </section>
  );
}
