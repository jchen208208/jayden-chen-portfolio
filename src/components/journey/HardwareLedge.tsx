"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import {
  buildOutcrop,
  ledgeLandingY,
  useLedgeParallax,
  CYAN,
  CYAN_LIGHT,
  CYAN_TILE,
} from "./outcrop";

/**
 * Third skill ledge ("Hardware") — same family as LeftLedge, from the LEFT edge
 * again but a third distinct outline: a steep drop off the tip onto a wide flat
 * plateau, which breaks over one bend into a steep face down to the foot.
 * Same 3 nested layers, colours, and parallax rules (all in ./outcrop).
 *
 * PLACEHOLDER — title + tile labels are stand-ins.
 */

const TOP_VW = 188; // as far below RightLedge (150) as it is below LeftLedge (112)
const WIDTH_VW = 50; // left edge → tip ≈ screen centre

const DROP = 300;
const VB_H = DROP + 30; // svg viewBox height (4u above the tip + drop + ~26u foot)
const TOP_PCT = ((1 - 4 / VB_H) * 100).toFixed(2); // flat-top's % up from box bottom

const { body: BODY, layers: LAYER_D } = buildOutcrop({
  tip: { x: 986, y: 30 },
  drop: DROP,
  seed: 0x5c1e88,
  wobble: 12,
  anchors: [
    [952, 0], // end of the flat top
    [988, 0.06], // rounded tip
    [930, 0.22], // steep drop straight off the tip
    [878, 0.33],
    [836, 0.4],
    [770, 0.44], // wide flat plateau …
    [660, 0.46],
    [560, 0.47],
    [510, 0.49], // — bend: the plateau breaks —
    [484, 0.58], // steep face
    [458, 0.68],
    [434, 0.76],
    [400, 0.83], // rounds out …
    [320, 0.89],
    [180, 0.95], // … to the foot
    [0, 1], // into the left screen edge
  ],
  layerGaps: [
    [25, 11],
    [50, 22],
  ],
});
const LAYERS = [
  { fill: CYAN, d: LAYER_D[0] },
  { fill: CYAN_TILE, d: LAYER_D[1] },
  { fill: CYAN_LIGHT, d: LAYER_D[2] },
];

/* entrance choreography (seconds) — mirrors LeftLedge */
const LAYERS_AT = 0.12;
const LAYER_GAP = 0.07;
const LAYER_DUR = 0.42;
const TILES_AT = 0.28;
const ROW_GAP = 0.09;

const HARDWARE = ["Verilog", "FPGA", "KiCad", "STM32", "RTL", "SPICE"];

function HardwarePanel({ show, reduce }: { show: boolean; reduce: boolean }) {
  const T = (config: object) => (reduce ? { duration: 0 } : config);

  return (
    <div>
      <div className="flex items-center gap-4">
        <motion.span
          aria-hidden
          className="h-[3rem] w-[14px] shrink-0 rounded-[2px] sm:h-[4rem]"
          style={{ backgroundColor: CYAN_LIGHT }}
          initial={{ opacity: 0, y: -78 }}
          animate={show ? { opacity: 1, y: 0 } : { opacity: 0, y: -78 }}
          transition={T({ type: "spring", stiffness: 620, damping: 11, mass: 0.7 })}
        />
        <h3
          className="font-display text-[3rem] leading-[0.95] tracking-tight text-white [text-shadow:0_3px_20px_rgba(10,7,20,0.85)] sm:text-[4rem]"
          aria-label="Hardware"
        >
          {"Hardware".split("").map((ch, i) => (
            <motion.span
              key={i}
              aria-hidden
              className="inline-block"
              initial={{ opacity: 0, y: 34, rotate: -7 }}
              animate={
                show
                  ? { opacity: 1, y: 0, rotate: 0 }
                  : { opacity: 0, y: 34, rotate: -7 }
              }
              transition={T({
                type: "spring",
                stiffness: 520,
                damping: 15,
                delay: i * 0.02,
              })}
            >
              {ch}
            </motion.span>
          ))}
        </h3>
      </div>

      <ul className="mt-11 grid grid-cols-3 gap-[clamp(1.15rem,3.2vw,3rem)]">
        {HARDWARE.map((item, i) => {
          const col = i % 3;
          const row = Math.floor(i / 3);
          const hidden = { opacity: 0, scale: 0.55, x: (1 - col) * 46, y: 8 };
          return (
            <motion.li
              key={item}
              className="aspect-[9/5]"
              initial={hidden}
              animate={show ? { opacity: 1, scale: 1, x: 0, y: 0 } : hidden}
              transition={T({
                type: "spring",
                stiffness: 460,
                damping: 19,
                delay: TILES_AT + row * ROW_GAP,
              })}
            >
              <motion.div
                className="flex h-full w-full items-center justify-center rounded-xl border px-3 text-center font-title text-xl tracking-wide text-white shadow-[0_8px_24px_rgba(10,7,20,0.4)] hover:shadow-[0_18px_36px_rgba(10,7,20,0.55)] sm:text-3xl"
                style={{ backgroundColor: CYAN_TILE, borderColor: CYAN_LIGHT }}
                whileHover={{ y: -8 }}
                transition={{ type: "spring", stiffness: 400, damping: 26 }}
              >
                {item}
              </motion.div>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}

/** Scroll so the Hardware composition sits framed in the viewport. */
export function scrollToHardware() {
  const ledge = document.getElementById("ledge-hardware");
  const panel = document.getElementById("hardware");
  if (!ledge || !panel) return;
  window.scrollTo({ top: ledgeLandingY(ledge, panel), behavior: "smooth" });
}

export default function HardwareLedge() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion() ?? false;
  const show = useInView(ref, { once: true, amount: 0.15 });
  const { rockY, midY, innerY, panelY } = useLedgeParallax(ref, "hardware");

  const T = (config: object) => (reduce ? { duration: 0 } : config);
  const slideIn = (i: number) => ({
    initial: { x: -1200 },
    animate: { x: show ? 0 : -1200 },
    transition: T({
      delay: LAYERS_AT + i * LAYER_GAP,
      duration: LAYER_DUR,
      ease: [0.22, 1, 0.36, 1] as const,
    }),
  });

  return (
    <div
      ref={ref}
      id="ledge-hardware"
      className="pointer-events-none absolute left-0 z-[6]"
      style={{ top: `${TOP_VW}vw`, width: `${WIDTH_VW}vw` }}
    >
      <motion.div style={{ y: rockY }} className="will-change-transform">
        <svg viewBox={`0 26 1010 ${VB_H}`} className="block w-full" aria-hidden>
          <defs>
            <filter id="hw-grain">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.9"
                numOctaves="2"
                seed="11"
              />
              <feColorMatrix
                type="matrix"
                values="0 0 0 0 0.03  0 0 0 0 0.13  0 0 0 0 0.16  0 0 0 0.7 0"
              />
            </filter>
            <clipPath id="hw-clip">
              <path d={BODY} />
            </clipPath>
          </defs>

          <motion.path
            d={LAYERS[0].d}
            fill={LAYERS[0].fill}
            stroke="#06222a"
            strokeWidth="2.5"
            {...slideIn(0)}
          />
          <motion.g
            clipPath="url(#hw-clip)"
            initial={{ opacity: 0 }}
            animate={{ opacity: show ? 0.4 : 0 }}
            transition={T({ delay: LAYERS_AT + 0.15, duration: 0.45 })}
          >
            <rect
              x="-40"
              y="-40"
              width="1120"
              height="400"
              filter="url(#hw-grain)"
            />
          </motion.g>
          <motion.path
            d={LAYERS[1].d}
            fill={LAYERS[1].fill}
            style={{ y: midY }}
            {...slideIn(1)}
          />
          <motion.path
            d={LAYERS[2].d}
            fill={LAYERS[2].fill}
            style={{ y: innerY }}
            {...slideIn(2)}
          />
        </svg>
      </motion.div>

      {/* panel plane — anchored just above the BASE layer's top edge */}
      <motion.div
        id="hardware"
        className="pointer-events-auto absolute will-change-transform"
        style={{
          y: panelY,
          left: "3vw",
          bottom: `calc(${TOP_PCT}% + 0.75rem)`,
          width: "39vw",
        }}
      >
        <HardwarePanel show={show} reduce={reduce} />
      </motion.div>
    </div>
  );
}
