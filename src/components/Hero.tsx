"use client";

import { motion } from "motion/react";

const NAV = [
  { label: "Projects", href: "#projects" },
  { label: "Skills", href: "#skills" },
  { label: "Awards", href: "#awards" },
  { label: "Contact", href: "#contact" },
];

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function Hero() {
  return (
    <section
      id="top"
      className="relative flex min-h-[100svh] flex-col items-center justify-center px-6 text-center"
    >
      <motion.nav
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease }}
        className="fixed inset-x-0 top-0 z-20 flex items-center justify-between px-6 py-5 text-sm sm:px-10"
      >
        <a href="#top" className="font-mono tracking-widest text-wisp/90">
          JC
        </a>
        <div className="hidden gap-7 sm:flex">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-foreground/60 transition-colors hover:text-gold"
            >
              {item.label}
            </a>
          ))}
        </div>
        <a
          href="/resume"
          className="rounded-full border border-wisp/25 px-4 py-1.5 text-foreground/80 transition-colors hover:border-gold/60 hover:text-gold"
        >
          Résumé
        </a>
      </motion.nav>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease }}
        className="mb-5 font-mono text-xs uppercase tracking-[0.4em] text-teal-glow/80"
      >
        Developer · Builder · Tinkerer
      </motion.p>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.32, ease }}
        className="max-w-4xl text-balance text-5xl font-semibold leading-[1.05] tracking-tight sm:text-7xl"
      >
        Jayden Chen
        <span className="mt-3 block bg-gradient-to-r from-wisp via-gold-bright to-gold bg-clip-text text-2xl font-normal text-transparent sm:text-3xl">
          building things that feel a little magical
        </span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.5, ease }}
        className="mt-7 max-w-xl text-pretty text-base text-foreground/60 sm:text-lg"
      >
        A portfolio in a bioluminescent forest — projects, experience, skills and
        awards, drifting past like spirit wisps. (Placeholder copy.)
      </motion.p>

      <motion.a
        href="#projects"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
        className="scroll-cue absolute bottom-10 flex flex-col items-center gap-2 text-foreground/50"
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
