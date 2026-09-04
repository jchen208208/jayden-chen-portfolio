"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { EASE_OUT, inView } from "./motion";

type RevealProps = {
  children: ReactNode;
  /** seconds to delay — use for manual staggering */
  delay?: number;
  /** travel distance in px */
  y?: number;
  className?: string;
  as?: "div" | "li" | "section" | "span";
};

/**
 * Fades + lifts its children into view once. Respects prefers-reduced-motion
 * (renders immediately, no transform).
 */
export default function Reveal({
  children,
  delay = 0,
  y = 22,
  className,
  as = "div",
}: RevealProps) {
  const reduce = useReducedMotion();
  const MotionTag = motion[as];

  if (reduce) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={inView}
      transition={{ duration: 0.7, ease: EASE_OUT, delay }}
    >
      {children}
    </MotionTag>
  );
}
