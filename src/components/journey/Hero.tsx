"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { PROFILE } from "@/lib/site";
import { EASE_OUT } from "@/components/site/motion";

/**
 * Hero — name + one-line positioning + primary actions, laid over the top
 * viewport of the waterfall plate. The container is click-through so the
 * painting/scroll stay interactive; only the links re-enable pointer events.
 * A soft radial scrim sits behind the text so it stays legible over the
 * brightest parts of the painting.
 */

const rise = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export default function Hero() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex h-[100svh] flex-col items-center justify-center px-6 text-center">
      {/* legibility scrim */}
      <div
        aria-hidden
        className="absolute left-1/2 top-1/2 h-[95vh] w-[130vw] -translate-x-1/2 -translate-y-1/2"
        style={{
          background:
            "radial-gradient(closest-side, rgba(10,7,20,0.62), rgba(10,7,20,0.28) 55%, transparent 78%)",
        }}
      />

      <motion.div
        initial="hidden"
        animate="show"
        transition={{ staggerChildren: 0.12, delayChildren: 0.2 }}
        className="relative max-w-3xl font-title [&_a]:pointer-events-auto"
      >
        <motion.h1
          variants={rise}
          transition={{ duration: 0.8, ease: EASE_OUT }}
          className="text-6xl leading-[0.95] text-ink sm:text-8xl lg:text-[9rem] [text-shadow:0_3px_30px_rgba(10,7,20,0.85)]"
        >
          {PROFILE.name}
        </motion.h1>

        <motion.p
          variants={rise}
          transition={{ duration: 0.7, ease: EASE_OUT }}
          className="mt-6 text-lg font-medium text-ink sm:text-xl [text-shadow:0_2px_14px_rgba(10,7,20,0.95),0_1px_3px_rgba(10,7,20,0.95)]"
        >
          {PROFILE.tagline}
        </motion.p>

        <motion.div
          variants={rise}
          transition={{ duration: 0.7, ease: EASE_OUT }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <Link
            href="#work"
            className="rounded-full bg-ember px-8 py-4 text-lg text-[#1b1206] transition-colors hover:bg-sun"
          >
            View work
          </Link>
          <Link
            href="/resume"
            className="rounded-full border border-ink/40 bg-paper/30 px-8 py-4 text-lg text-ink backdrop-blur-sm transition-colors hover:border-ember hover:text-ember"
          >
            Résumé
          </Link>
        </motion.div>

        <motion.div
          variants={rise}
          transition={{ duration: 0.7, ease: EASE_OUT }}
          className="mt-6 flex flex-wrap items-center justify-center gap-6 text-base text-ink [text-shadow:0_2px_12px_rgba(10,7,20,0.95)]"
        >
          <a
            href={PROFILE.github}
            target="_blank"
            rel="noreferrer"
            className="underline decoration-ink/40 underline-offset-4 transition-colors hover:text-ember hover:decoration-ember"
          >
            GitHub
          </a>
          <a
            href={PROFILE.linkedin}
            target="_blank"
            rel="noreferrer"
            className="underline decoration-ink/40 underline-offset-4 transition-colors hover:text-ember hover:decoration-ember"
          >
            LinkedIn
          </a>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1, duration: 0.8, ease: EASE_OUT }}
        className="scroll-cue absolute bottom-8 left-1/2 -translate-x-1/2 text-ink"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M12 5v14M6 13l6 6 6-6" />
        </svg>
      </motion.div>
    </div>
  );
}
