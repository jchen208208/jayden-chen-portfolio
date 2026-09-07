"use client";

import type { CSSProperties } from "react";
import { motion, type MotionValue, useTransform } from "motion/react";
import { MOTE_SPRITES, MOTES_FIELD_SIZE, PLATES } from "./plates";

/** Fixed per-instance timing — hand-picked, not randomized (keeps SSR/CSR
 *  markup identical and avoids every mote breathing in lockstep). */
const TIMING = [
  { duration: 9, delay: 0, flicker: 3.2, fdelay: 0.4 },
  { duration: 11, delay: 1.1, flicker: 4.1, fdelay: 1.2 },
  { duration: 8, delay: 2.3, flicker: 3.6, fdelay: 0 },
  { duration: 12.5, delay: 0.6, flicker: 4.6, fdelay: 2 },
  { duration: 10, delay: 1.8, flicker: 3.9, fdelay: 0.8 },
  { duration: 9.5, delay: 3.1, flicker: 3.3, fdelay: 1.6 },
  { duration: 13, delay: 0.2, flicker: 4.4, fdelay: 0.3 },
  { duration: 8.5, delay: 2.6, flicker: 3.8, fdelay: 2.4 },
  { duration: 11.5, delay: 1.4, flicker: 4.2, fdelay: 1 },
  { duration: 10.5, delay: 0.9, flicker: 3.5, fdelay: 1.9 },
] as const;

/** Scatter positions (viewport %) for each sprite — clustered higher and
 *  denser near the trees, thinning out lower down the cliff. */
const LAYOUT = [
  { left: 18, top: 10, size: 46 },
  { left: 34, top: 6, size: 30 },
  { left: 61, top: 9, size: 40 },
  { left: 78, top: 13, size: 52 },
  { left: 88, top: 4, size: 26 },
  { left: 10, top: 24, size: 34 },
  { left: 46, top: 27, size: 42 },
  { left: 68, top: 22, size: 24 },
  { left: 25, top: 34, size: 30 },
  { left: 56, top: 17, size: 22 },
] as const;

const DEPTH_OPACITY: Record<(typeof MOTE_SPRITES)[number]["depth"], number> = {
  near: 0.95,
  mid: 0.75,
  far: 0.5,
};
const DEPTH_BLUR: Record<(typeof MOTE_SPRITES)[number]["depth"], number> = {
  near: 0,
  mid: 0.5,
  far: 1.4,
};
const DEPTH_K: Record<(typeof MOTE_SPRITES)[number]["depth"], number> = {
  near: 1.4,
  mid: 0.9,
  far: 0.5,
};

/** Spirit motes drifting through the trees and down the cliff. Visible only
 *  in the upper portion of the descent, fading out before the plunge mist.
 *
 *  Deliberately NOT applying that fade as opacity on this wrapper: opacity
 *  would open a stacking context around every sprite, and each sprite's own
 *  `mix-blend-mode: screen` would then only reach this wrapper's (empty)
 *  local backdrop instead of the real scene — same trap as RidgeLayer /
 *  OutcropLayer, just one level higher. Instead the fade is folded into each
 *  sprite's own opacity below, alongside its own blend-mode. */
export default function Motes({
  p,
  window = [0, 0.5, 0.68],
}: {
  p: MotionValue<number>;
  /** scroll-progress fade window: [in-start, in-end, out-start, out-end] or
   *  [in-start, in-end, out-end] (holds fully visible in between). */
  window?: [number, number, number] | [number, number, number, number];
}) {
  const outputs =
    window.length === 3 ? [0, 1, 0] : [0, 1, 1, 0];
  const fieldOpacity = useTransform(p, window, outputs);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {MOTE_SPRITES.map((sprite, i) => {
        const layout = LAYOUT[i % LAYOUT.length];
        const time = TIMING[i % TIMING.length];
        const variant =
          sprite.variant === "a"
            ? "mote-drift-a"
            : sprite.variant === "b"
              ? "mote-drift-b"
              : "mote-drift-c";
        const scale = layout.size / sprite.w;

        return (
          <MoteSprite
            key={i}
            p={p}
            fieldOpacity={fieldOpacity}
            sprite={sprite}
            layout={layout}
            time={time}
            variant={variant}
            scale={scale}
          />
        );
      })}
    </div>
  );
}

function MoteSprite({
  p,
  fieldOpacity,
  sprite,
  layout,
  time,
  variant,
  scale,
}: {
  p: MotionValue<number>;
  fieldOpacity: MotionValue<number>;
  sprite: (typeof MOTE_SPRITES)[number];
  layout: { left: number; top: number; size: number };
  time: (typeof TIMING)[number];
  variant: string;
  scale: number;
}) {
  const k = DEPTH_K[sprite.depth];
  const y = useTransform(p, [0, 1], [0, -k * 34]);
  const opacity = useTransform(fieldOpacity, (f) => f * DEPTH_OPACITY[sprite.depth]);

  return (
    // blend-mode has to sit on this same element, alongside its own y/opacity
    // — see the note on Motes() above and on RidgeLayer/OutcropLayer.
    <motion.div
      aria-hidden
      className="absolute"
      style={{
        left: `${layout.left}%`,
        top: `${layout.top}%`,
        width: layout.size,
        height: layout.size * (sprite.h / sprite.w),
        y,
        opacity,
        mixBlendMode: "screen",
        filter: DEPTH_BLUR[sprite.depth] ? `blur(${DEPTH_BLUR[sprite.depth]}px)` : undefined,
      }}
    >
      {/* wander path (CSS transform loop) */}
      <div
        data-anim
        className="h-full w-full"
        style={{
          animation: `${variant} ${time.duration}s ease-in-out ${time.delay}s infinite alternate`,
        }}
      >
        {/* the sprite itself + its independent flicker */}
        <div
          data-anim
          className="h-full w-full"
          style={
            {
              backgroundImage: `url(${PLATES.motesField})`,
              backgroundRepeat: "no-repeat",
              backgroundSize: `${MOTES_FIELD_SIZE.w * scale}px ${MOTES_FIELD_SIZE.h * scale}px`,
              backgroundPosition: `${-sprite.x * scale}px ${-sprite.y * scale}px`,
              "--mote-min": 0.5,
              "--mote-max": 1,
              animation: `mote-flicker ${time.flicker}s ease-in-out ${time.fdelay}s infinite`,
            } as CSSProperties
          }
        />
      </div>
    </motion.div>
  );
}
