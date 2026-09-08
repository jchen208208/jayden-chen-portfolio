"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { PROFILE } from "@/lib/site";
import { EASE_OUT } from "@/components/site/motion";

/**
 * Hero — name + one-line positioning + primary actions, laid over the top
 * viewport of the waterfall plate. The container is click-through so the
 * painting/scroll stay interactive; only the links re-enable pointer events.
 */

const rise = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export default function Hero() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex h-[100svh] flex-col items-center justify-center px-6 text-center">
      <motion.div
        initial="hidden"
        animate="show"
        transition={{ staggerChildren: 0.12, delayChildren: 0.2 }}
        className="max-w-2xl [&_*]:[text-shadow:0_2px_22px_rgba(10,7,20,0.7)] [&_a]:pointer-events-auto"
      >
        <motion.h1
          variants={rise}
          transition={{ duration: 0.8, ease: EASE_OUT }}
          className="font-display text-5xl font-normal tracking-tight text-ink sm:text-7xl"
        >
          {PROFILE.name}
        </motion.h1>

        <motion.p
          variants={rise}
          transition={{ duration: 0.7, ease: EASE_OUT }}
          className="mt-5 text-base text-ink-soft sm:text-lg"
        >
          {PROFILE.tagline}
        </motion.p>

        <motion.div
          variants={rise}
          transition={{ duration: 0.7, ease: EASE_OUT }}
          className="mt-9 flex flex-wrap items-center justify-center gap-3"
        >
          <Link
            href="#work"
            className="rounded-full bg-ember px-5 py-2.5 text-sm font-medium text-[#1b1206] transition-colors hover:bg-sun"
          >
            View work
          </Link>
          <Link
            href="/resume"
            className="rounded-full border border-line px-5 py-2.5 text-sm text-ink transition-colors hover:border-ember hover:text-ember"
          >
            Résumé
          </Link>
          <span aria-hidden className="mx-1 hidden h-4 w-px bg-line sm:block" />
          <a
            href={PROFILE.github}
            target="_blank"
            rel="noreferrer"
            className="rounded-full px-3 py-2.5 text-sm text-ink-soft transition-colors hover:text-ink"
          >
            GitHub
          </a>
          <a
            href={PROFILE.linkedin}
            target="_blank"
            rel="noreferrer"
            className="rounded-full px-3 py-2.5 text-sm text-ink-soft transition-colors hover:text-ink"
          >
            LinkedIn
          </a>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1, duration: 0.8, ease: EASE_OUT }}
        className="scroll-cue absolute bottom-8 left-1/2 -translate-x-1/2 text-ink-soft"
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
