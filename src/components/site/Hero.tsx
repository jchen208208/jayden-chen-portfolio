"use client";

import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { EASE_OUT } from "./motion";

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const k = reduce ? 0 : 1;
  const y = useTransform(scrollYProgress, [0, 1], [0, -80 * k]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, reduce ? 1 : 0]);

  return (
    <section
      ref={ref}
      id="top"
      className="relative isolate flex min-h-[100svh] flex-col items-center justify-center px-6 text-center"
    >
      {/* soft light scrim — lifts the type off the forest without hiding it */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[120%] w-[150%] -translate-x-1/2 -translate-y-1/2"
        style={{
          background:
            "radial-gradient(45% 38% at 50% 42%, color-mix(in srgb, var(--paper) 72%, transparent) 0%, transparent 72%)",
        }}
      />

      <motion.div style={{ y, opacity }} className="flex flex-col items-center">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: EASE_OUT }}
          className="mb-6 font-mono text-[11px] uppercase tracking-[0.42em] text-ink-soft"
        >
          Developer · Builder · Tinkerer
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.28, ease: EASE_OUT }}
          className="font-display text-6xl font-light leading-[0.95] tracking-tight text-ink sm:text-8xl"
        >
          Jayden Chen
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.44, ease: EASE_OUT }}
          className="mt-5 font-display text-2xl italic text-ink-soft sm:text-3xl"
        >
          I build things that ship
          <span className="text-ember">.</span>
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.58, ease: EASE_OUT }}
          className="mt-6 max-w-lg text-pretty text-base text-ink-soft sm:text-lg"
        >
          A portfolio set in a birch forest at golden hour — projects, experience,
          skills and awards, laid out along the river. (Placeholder copy.)
        </motion.p>
      </motion.div>

      <motion.a
        href="#work"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
        className="scroll-cue absolute bottom-10 flex flex-col items-center gap-2 text-ink-faint"
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.3em]">
          Scroll
        </span>
        <span aria-hidden className="text-lg">
          ↓
        </span>
      </motion.a>
    </section>
  );
}
