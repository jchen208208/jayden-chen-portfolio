"use client";

import { useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "motion/react";
import type { Project } from "@/lib/site";
import { EASE_OUT } from "./motion";

export default function ProjectCard({ project }: { project: Project }) {
  const reduce = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const rx = useSpring(useMotionValue(0), { stiffness: 150, damping: 18 });
  const ry = useSpring(useMotionValue(0), { stiffness: 150, damping: 18 });
  const transform = useMotionTemplate`perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;

  function onMove(e: React.MouseEvent) {
    if (reduce || !cardRef.current) return;
    const r = cardRef.current.getBoundingClientRect();
    const cx = (e.clientX - r.left) / r.width - 0.5;
    const cy = (e.clientY - r.top) / r.height - 0.5;
    ry.set(cx * 6);
    rx.set(-cy * 6);
  }
  function onLeave() {
    rx.set(0);
    ry.set(0);
  }

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ transform: reduce ? undefined : transform }}
      whileHover={reduce ? undefined : { y: -4 }}
      transition={{ duration: 0.3, ease: EASE_OUT }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-card"
    >
      {/* preview plate */}
      <div
        className="relative aspect-[16/10] w-full overflow-hidden"
        style={{
          background:
            "linear-gradient(140deg, var(--ember) 0%, var(--water-deep) 55%, var(--violet-deep) 130%)",
        }}
      >
        <div className="absolute inset-0 grain opacity-60" />
        <span className="absolute bottom-3 left-4 font-mono text-[10px] uppercase tracking-[0.3em] text-white/85">
          {project.slug}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="font-display text-xl text-ink">{project.name}</h3>
          <span className="font-mono text-xs text-ink-faint">
            {project.period}
          </span>
        </div>

        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          {project.blurb}
        </p>

        <ul className="mt-4 flex flex-wrap gap-2">
          {project.tags.map((t) => (
            <li
              key={t}
              className="rounded-full border border-line px-2.5 py-1 font-mono text-[11px] text-ink-soft"
            >
              {t}
            </li>
          ))}
        </ul>

        <div className="mt-5 flex items-center gap-4 border-t border-line pt-4 text-sm">
          {project.href && (
            <a
              href={project.href}
              className="text-ink transition-colors hover:text-ember"
            >
              Visit ↗
            </a>
          )}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-faint transition-colors hover:text-ink"
          >
            {open ? "Hide spec" : "Tech spec"}
          </button>
        </div>

        <AnimatePresence initial={false}>
          {open && (
            <motion.ul
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: EASE_OUT }}
              className="overflow-hidden"
            >
              <div className="mt-3 space-y-1.5">
                {project.spec.map((s) => (
                  <li
                    key={s}
                    className="flex gap-2 text-sm text-ink-soft"
                  >
                    <span className="text-ember">—</span>
                    {s}
                  </li>
                ))}
              </div>
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
