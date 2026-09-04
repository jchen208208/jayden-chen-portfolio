"use client";

import { useEffect } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";

/* -------------------------------------------------------------------------- */
/*  A single stylised birch                                                    */
/* -------------------------------------------------------------------------- */

function Birch({
  x,
  h,
  w,
  tint = "var(--leaf-far)",
  baseline = 520,
}: {
  x: number;
  h: number;
  w: number;
  tint?: string;
  baseline?: number;
}) {
  const topY = baseline - h; // trunk top (tucked under the canopy)
  const crownY = topY + h * 0.32; // canopy centre
  return (
    <g transform={`translate(${x} 0)`}>
      {/* trunk — rounded top, gentle taper */}
      <path
        d={`M ${-w / 2} ${baseline}
            C ${-w / 2} ${topY + h * 0.22}, ${-w * 0.42} ${topY}, 0 ${topY}
            C ${w * 0.42} ${topY}, ${w / 2} ${topY + h * 0.22}, ${w / 2} ${baseline} Z`}
        fill="var(--bark)"
      />
      {/* shaded side */}
      <path
        d={`M ${w * 0.1} ${baseline}
            C ${w * 0.12} ${topY + h * 0.3}, ${w * 0.3} ${topY + 4}, 0 ${topY}
            C ${w * 0.42} ${topY}, ${w / 2} ${topY + h * 0.22}, ${w / 2} ${baseline} Z`}
        fill="var(--bark-shadow)"
        opacity="0.4"
      />
      {/* bark ticks on the exposed lower trunk */}
      <g fill="var(--bark-tick)" opacity="0.4">
        <rect x={-w / 2} y={topY + h * 0.55} width={w * 0.5} height={2} rx={1} />
        <rect x={-w / 8} y={topY + h * 0.7} width={w * 0.45} height={1.8} rx={1} />
        <rect x={-w / 2} y={topY + h * 0.85} width={w * 0.4} height={2.2} rx={1} />
      </g>
      {/* canopy — soft overlapping cluster, painted last so it covers the trunk top */}
      <ellipse cx={0} cy={crownY - h * 0.12} rx={w * 3} ry={h * 0.26} fill={tint} />
      <ellipse
        cx={-w * 1.5}
        cy={crownY + h * 0.07}
        rx={w * 2.1}
        ry={h * 0.18}
        fill="var(--leaf)"
        opacity="0.8"
      />
      <ellipse
        cx={w * 1.6}
        cy={crownY + h * 0.03}
        rx={w * 1.9}
        ry={h * 0.16}
        fill="var(--leaf-far)"
        opacity="0.85"
      />
    </g>
  );
}

/* -------------------------------------------------------------------------- */
/*  Parallax layer wrapper                                                     */
/* -------------------------------------------------------------------------- */

function Layer({
  children,
  y,
  x,
  className,
  style,
}: {
  children: React.ReactNode;
  y: MotionValue<number>;
  x: MotionValue<number>;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <motion.div
      aria-hidden
      className={`absolute inset-x-0 bottom-0 ${className ?? ""}`}
      style={{ y, x, ...style }}
    >
      {children}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */

export default function ForestBackdrop() {
  const reduce = useReducedMotion();
  const k = reduce ? 0 : 1; // motion multiplier
  const { scrollYProgress } = useScroll();

  // pointer parallax (-1 .. 1), gently sprung
  const pxRaw = useMotionValue(0);
  const pyRaw = useMotionValue(0);
  const px = useSpring(pxRaw, { stiffness: 60, damping: 20, mass: 0.6 });
  const py = useSpring(pyRaw, { stiffness: 60, damping: 20, mass: 0.6 });

  useEffect(() => {
    if (reduce) return;
    const onMove = (e: PointerEvent) => {
      pxRaw.set((e.clientX / window.innerWidth - 0.5) * 2);
      pyRaw.set((e.clientY / window.innerHeight - 0.5) * 2);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduce, pxRaw, pyRaw]);

  // --- scroll parallax (hooks always called; range scaled by k) ---
  const skyY = useTransform(scrollYProgress, [0, 1], [0, -16 * k]);
  const sunY = useTransform(scrollYProgress, [0, 1], [0, -100 * k]);
  const ridgeY = useTransform(scrollYProgress, [0, 1], [0, -60 * k]);
  const mistY = useTransform(scrollYProgress, [0, 1], [0, -34 * k]);
  const midY = useTransform(scrollYProgress, [0, 1], [0, -120 * k]);
  const riverY = useTransform(scrollYProgress, [0, 1], [0, -90 * k]);
  const nearY = useTransform(scrollYProgress, [0, 1], [0, -220 * k]);

  const dayWash = useTransform(scrollYProgress, [0, 0.5, 1], [0, 0.18, 0.34]);
  const mistOpacity = useTransform(
    scrollYProgress,
    [0, 0.4, 1],
    [0.45, 0.8, 0.35],
  );

  // --- pointer parallax (one hook per layer, factor scaled by k) ---
  const sunX = useTransform(px, (v) => v * -14 * k);
  const ridgeX = useTransform(px, (v) => v * -6 * k);
  const mistX = useTransform(px, (v) => v * 4 * k);
  const midX = useTransform(px, (v) => v * -16 * k);
  const midYp = useTransform(py, (v) => v * -6 * k);
  const riverX = useTransform(px, (v) => v * 8 * k);
  const nearX = useTransform(px, (v) => v * -30 * k);

  const midYTotal = useTransform(() => midY.get() + midYp.get());

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-paper">
      {/* Sky */}
      <motion.div className="absolute inset-0" style={{ y: skyY }} aria-hidden>
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, #f7ede0 0%, #f4e6d0 32%, #f6dcb8 54%, #e9e7d4 72%, #e4ece6 100%)",
          }}
        />
        <motion.div
          className="absolute inset-0"
          style={{
            opacity: dayWash,
            background:
              "linear-gradient(180deg, #cfe0e8 0%, #dbe8e2 40%, transparent 80%)",
          }}
        />
      </motion.div>

      {/* Sun glow */}
      <motion.div
        aria-hidden
        className="absolute"
        style={{
          top: "8%",
          right: "14%",
          width: 460,
          height: 460,
          y: sunY,
          x: sunX,
          background:
            "radial-gradient(circle, rgba(247,220,172,0.95) 0%, rgba(243,176,90,0.5) 32%, rgba(243,176,90,0.12) 55%, transparent 72%)",
          filter: "blur(6px)",
        }}
      >
        <div
          className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: "var(--sun-soft)", filter: "blur(4px)" }}
        />
      </motion.div>

      {/* Far ridge */}
      <Layer y={ridgeY} x={ridgeX} className="h-[34vh] min-h-[220px]">
        <svg
          viewBox="0 0 1440 320"
          preserveAspectRatio="xMidYMax slice"
          className="h-full w-full"
        >
          <path
            d="M0 210 C 220 140, 360 250, 620 190 S 1040 120, 1440 200 L1440 320 L0 320 Z"
            fill="#cdd8c8"
            opacity="0.55"
          />
          <path
            d="M0 260 C 260 210, 480 290, 760 240 S 1180 200, 1440 260 L1440 320 L0 320 Z"
            fill="#bccbb6"
            opacity="0.5"
          />
        </svg>
      </Layer>

      {/* Mist */}
      <motion.div
        aria-hidden
        data-drift
        className="absolute inset-x-[-6%] bottom-[19vh] h-[20vh] min-h-[110px]"
        style={{
          y: mistY,
          x: mistX,
          opacity: mistOpacity,
          animation: reduce ? "none" : "drift 26s ease-in-out infinite alternate",
        }}
      >
        <div
          className="h-full w-full"
          style={{
            background:
              "radial-gradient(60% 80% at 20% 60%, rgba(255,255,255,0.9), transparent 70%), radial-gradient(50% 70% at 55% 50%, rgba(255,255,255,0.75), transparent 72%), radial-gradient(55% 75% at 85% 65%, rgba(255,255,255,0.85), transparent 70%)",
            filter: "blur(10px)",
          }}
        />
      </motion.div>

      {/* Mid birches */}
      <Layer
        y={midYTotal}
        x={midX}
        className="h-[44vh] min-h-[300px]"
        style={{ animation: reduce ? "none" : "sway 11s ease-in-out infinite" }}
      >
        <svg
          viewBox="0 0 1440 520"
          preserveAspectRatio="xMidYMax slice"
          className="h-full w-full"
        >
          <Birch x={90} h={300} w={22} />
          <Birch x={310} h={232} w={18} tint="var(--leaf)" />
          <Birch x={540} h={330} w={26} />
          <Birch x={805} h={210} w={16} tint="var(--leaf)" />
          <Birch x={1015} h={300} w={23} />
          <Birch x={1285} h={250} w={20} tint="var(--leaf)" />
        </svg>
      </Layer>

      {/* River */}
      <Layer y={riverY} x={riverX} className="h-[26vh] min-h-[170px]">
        <svg
          viewBox="0 0 1440 260"
          preserveAspectRatio="xMidYMax slice"
          className="h-full w-full"
        >
          <defs>
            <linearGradient id="river-g" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--river)" />
              <stop offset="1" stopColor="var(--river-deep)" />
            </linearGradient>
          </defs>
          <path
            d="M0 96 C 300 70, 520 132, 820 108 S 1200 80, 1440 120 L1440 260 L0 260 Z"
            fill="url(#river-g)"
          />
          <path
            d="M0 96 C 300 70, 520 132, 820 108 S 1200 80, 1440 120 L1440 138 C 1200 100, 1020 120, 820 128 S 300 92, 0 116 Z"
            fill="#e8e0cd"
            opacity="0.7"
          />
          <g stroke="var(--glint)" strokeLinecap="round" fill="none">
            <path
              d="M120 150 q 40 -8 80 0"
              strokeWidth="3"
              style={{ animation: reduce ? "none" : "shimmer 4.5s ease-in-out infinite" }}
            />
            <path
              d="M520 176 q 50 -10 100 0"
              strokeWidth="3"
              style={{ animation: reduce ? "none" : "shimmer 5.5s ease-in-out infinite 0.8s" }}
            />
            <path
              d="M960 158 q 45 -9 90 0"
              strokeWidth="3"
              style={{ animation: reduce ? "none" : "shimmer 6s ease-in-out infinite 1.6s" }}
            />
            <path
              d="M1180 190 q 40 -8 80 0"
              strokeWidth="2.5"
              style={{ animation: reduce ? "none" : "shimmer 5s ease-in-out infinite 2.4s" }}
            />
          </g>
        </svg>
      </Layer>

      {/* Near foreground */}
      <Layer
        y={nearY}
        x={nearX}
        className="h-[20vh] min-h-[130px]"
        style={{
          filter: "blur(2px)",
          animation: reduce ? "none" : "sway 8s ease-in-out infinite reverse",
        }}
      >
        <svg
          viewBox="0 0 1440 240"
          preserveAspectRatio="xMidYMax slice"
          className="h-full w-full"
        >
          <Birch x={40} h={240} w={44} tint="var(--leaf)" baseline={240} />
          <Birch x={1410} h={240} w={50} tint="var(--leaf)" baseline={240} />
          <g fill="var(--pine)">
            <path d="M0 240 q 20 -70 34 0 Z" opacity="0.8" />
            <path d="M60 240 q 16 -54 30 0 Z" opacity="0.7" />
            <path d="M120 240 q 22 -80 40 0 Z" opacity="0.85" />
            <path d="M1320 240 q 20 -66 34 0 Z" opacity="0.8" />
            <path d="M1380 240 q 18 -50 30 0 Z" opacity="0.7" />
          </g>
        </svg>
      </Layer>

      {/* Atmosphere */}
      <div
        className="pointer-events-none absolute inset-0 grain"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 20%, transparent 45%, rgba(43,54,48,0.10) 100%)",
        }}
      />
    </div>
  );
}
