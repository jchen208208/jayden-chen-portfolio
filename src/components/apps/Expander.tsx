"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { EASE_OUT } from "@/components/site/motion";

/**
 * A labelled row that expands to reveal `children`. Height-animates unless
 * reduced motion is set. Ported from the old ProjectCard "Tech spec" toggle.
 */
export default function Expander({
  summary,
  defaultOpen = false,
  children,
}: {
  summary: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const reduce = useReducedMotion();

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 text-left font-mono text-xs text-[color:var(--app-fg-soft)] transition-colors hover:text-[color:var(--app-fg)]"
      >
        <span
          aria-hidden
          className="inline-block transition-transform"
          style={{ transform: open ? "rotate(90deg)" : "none" }}
        >
          ▸
        </span>
        {summary}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: EASE_OUT }}
            className="overflow-hidden"
          >
            <div className="pt-2">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
