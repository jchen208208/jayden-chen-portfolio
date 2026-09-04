"use client";

import { motion, useScroll, useSpring } from "motion/react";

/** A thin vertical "river" on the left edge that fills as the page scrolls. */
export default function ScrollRiver() {
  const { scrollYProgress } = useScroll();
  const scaleY = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 24,
    restDelta: 0.001,
  });

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed left-3 top-1/2 z-30 hidden h-[42vh] w-px -translate-y-1/2 bg-line lg:block"
    >
      <motion.div
        style={{ scaleY, transformOrigin: "top" }}
        className="h-full w-full"
      >
        <div
          className="h-full w-full"
          style={{
            background:
              "linear-gradient(180deg, var(--sun) 0%, var(--river-deep) 100%)",
          }}
        />
      </motion.div>
    </div>
  );
}
