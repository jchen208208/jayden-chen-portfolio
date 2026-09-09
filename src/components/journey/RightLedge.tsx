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
 * Second skill ledge ("Tools/Frameworks") — same family as LeftLedge, mirrored
 * to jut from the RIGHT screen edge with a different outline: a broad shallow
 * shelf that breaks over a hard knee into a steep face, then flares to a foot.
 * Same 3 nested layers, same colours, same parallax rules (all in ./outcrop).
 *
 * PLACEHOLDER — title + tile labels are stand-ins.
 */

const TOP_VW = 150; // up-ish from LeftLedge (112) — nudge freely
const WIDTH_VW = 50; // right edge → tip ≈ screen centre

/* shorter than LeftLedge (drop 344): a steep drop right off the tip into a
   shallow shelf, which breaks over one slightly-sharp bend into a steep
   diagonal, then a short low ledge notches the way down to the foot */
const DROP = 285;
const VB_H = DROP + 30; // svg viewBox height (4u above the tip + drop + ~26u foot)
const TOP_PCT = ((1 - 4 / VB_H) * 100).toFixed(2); // flat-top's % up from box bottom

const { body: BODY, layers: LAYER_D } = buildOutcrop({
  tip: { x: 986, y: 30 },
  drop: DROP,
  seed: 0x3d9a71,
  wobble: 12,
  anchors: [
    [956, 0], // end of the flat top
    [982, 0.07], // rounded tip
    [912, 0.2], // steep descent straight off the tip (so it isn't a thin spit)
    [842, 0.3],
    [776, 0.36],
    [712, 0.4], // shallow shelf
    [650, 0.42],
    [620, 0.5], // — bend: the shelf breaks over here —
    [586, 0.63], // steep diagonal
    [556, 0.75],
    [530, 0.78], // — kink onto a short low ledge …
    [494, 0.795],
    [470, 0.8],
    [452, 0.88], // — … and kink off it —
    [418, 0.91],
    [300, 0.95], // the foot
    [150, 0.98],
    [0, 1], // into the right screen edge
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

const TOOLS = ["React", "Next.js", "Tailwind", "Node.js", "Docker", "Git"];

function ToolsPanel({ show, reduce }: { show: boolean; reduce: boolean }) {
  const T = (config: object) => (reduce ? { duration: 0 } : config);
  const title = "Tools/Frameworks";

  return (
    <div className="text-right">
      <div className="flex flex-row-reverse items-center gap-4">
        {/* bar — drops in and bounces */}
        <motion.span
          aria-hidden
          className="h-[3rem] w-[14px] shrink-0 rounded-[2px] sm:h-[4rem]"
          style={{ backgroundColor: CYAN_LIGHT }}
          initial={{ opacity: 0, y: -78 }}
          animate={show ? { opacity: 1, y: 0 } : { opacity: 0, y: -78 }}
          transition={T({ type: "spring", stiffness: 620, damping: 11, mass: 0.7 })}
        />
        {/* heading — letters wave in */}
        <h3
          className="whitespace-nowrap font-display text-[2.4rem] leading-[0.95] tracking-tight text-white [text-shadow:0_3px_20px_rgba(10,7,20,0.85)] sm:text-[3.25rem]"
          aria-label={title}
        >
          {title.split("").map((ch, i) => (
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
        {TOOLS.map((tool, i) => {
          const col = i % 3;
          const row = Math.floor(i / 3);
          // mirror the pop-out origin: tiles fan from the right-hand column
          const hidden = { opacity: 0, scale: 0.55, x: (col - 1) * 46, y: 8 };
          return (
            <motion.li
              key={tool}
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
                {tool}
              </motion.div>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}

/** Scroll so the Tools/Frameworks composition sits framed in the viewport. */
export function scrollToTools() {
  const ledge = document.getElementById("ledge-tools");
  const panel = document.getElementById("tools");
  if (!ledge || !panel) return;
  window.scrollTo({ top: ledgeLandingY(ledge, panel), behavior: "smooth" });
}

export default function RightLedge() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion() ?? false;
  const show = useInView(ref, { once: true, amount: 0.15 });
  const { rockY, midY, innerY, panelY } = useLedgeParallax(ref, "tools");

  const T = (config: object) => (reduce ? { duration: 0 } : config);
  // paths translate -1200 in pre-mirror space ⇒ the SVG's scaleX(-1) flips it,
  // so the layers slide in from the RIGHT
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
      id="ledge-tools"
      className="pointer-events-none absolute right-0 z-[6]"
      style={{ top: `${TOP_VW}vw`, width: `${WIDTH_VW}vw` }}
    >
      {/* outcrop plane — base layer + grain move as one; the SVG is mirrored so
          the outline juts from the right edge toward centre */}
      <motion.div style={{ y: rockY }} className="will-change-transform">
        <svg
          viewBox={`0 26 1010 ${VB_H}`}
          className="block w-full"
          style={{ transform: "scaleX(-1)" }}
          aria-hidden
        >
          <defs>
            <filter id="tools-grain">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.9"
                numOctaves="2"
                seed="7"
              />
              <feColorMatrix
                type="matrix"
                values="0 0 0 0 0.03  0 0 0 0 0.13  0 0 0 0 0.16  0 0 0 0.7 0"
              />
            </filter>
            <clipPath id="tools-clip">
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
            clipPath="url(#tools-clip)"
            initial={{ opacity: 0 }}
            animate={{ opacity: show ? 0.4 : 0 }}
            transition={T({ delay: LAYERS_AT + 0.15, duration: 0.45 })}
          >
            <rect
              x="-40"
              y="-40"
              width="1120"
              height="400"
              filter="url(#tools-grain)"
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

      {/* panel plane — floats in front, anchored just above the BASE layer's
          top edge (BODY y=30 ⇒ TOP_PCT% up the box), hovering over the rock */}
      <motion.div
        id="tools"
        className="pointer-events-auto absolute will-change-transform"
        style={{
          y: panelY,
          right: "3vw",
          bottom: `calc(${TOP_PCT}% + 0.75rem)`,
          width: "39vw",
        }}
      >
        <ToolsPanel show={show} reduce={reduce} />
      </motion.div>
    </div>
  );
}
