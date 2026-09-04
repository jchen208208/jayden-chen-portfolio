import type { Transition } from "motion/react";

/** Calm, confident easing — no overshoot. Matches the reference "motion philosophy". */
export const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const revealTransition: Transition = {
  duration: 0.7,
  ease: EASE_OUT,
};

/** Viewport config so reveals fire a little before the element is fully on screen. */
export const inView = { once: true, margin: "0px 0px -12% 0px" } as const;
