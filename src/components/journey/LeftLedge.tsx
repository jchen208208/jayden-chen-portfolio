"use client";

import { useEffect, useRef } from "react";

/**
 * First skill ledge — a flat, dark-cyan wedge that juts from the very left
 * screen edge out to a point near screen-centre. Deliberately plain so a 2D
 * card sits on it: a perfectly FLAT top edge, and a textured / kinked diagonal
 * for the underside (hand-placed kinks, no lighting). Sits roughly where the
 * first code-built ledge was (~104vw) and may overlap the waterfall.
 *
 * Parallax: a plain rAF-throttled scroll listener translates it FASTER than
 * the page (≈1.3×), so it clearly slides past the cliff on scroll.
 */

const TOP_VW = 112; // down the scene section
const WIDTH_VW = 50; // left edge → tip ≈ screen centre
const STRENGTH = 0.3; // screen travel ≈ (1 + STRENGTH) × page scroll

const CYAN = "#0c3742"; // outcrop flat fill — darker + more saturated than the cliff
const CYAN_TILE = "#0e5c6c"; // language tiles — a saturated cyan that reads clearly
//                              against BOTH the dark outcrop and the grey-teal cliff
const CYAN_LIGHT = "#8ce6f2"; // heading bar + front layer + permanent tile border — light cyan

const TIP = { x: 986, y: 30 };
const DROP = 344; // underside drop from tip to the left screen edge

/* seeded PRNG so the (random-looking) outline is identical every render */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Catmull-Rom through the points -> a smooth cubic-bezier path segment. */
function smooth(pts: [number, number][]) {
  let d = "";
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)} `;
  }
  return d;
}

/* One outcrop layer. `topInset` pushes the flat top DOWN, `bottomInset` pulls
   the underside UP, `tipPull` shortens the reach — so a layer is genuinely
   nested INSIDE the one below (following its outline), not a scaled copy that
   pokes through. topInset > bottomInset makes it skew toward the bottom edge.
   The cascading underside (a gentle facet → bend → steeper → bend → steepest,
   traced off piece1's painted rocks) is the same for every layer. */
function layerBody(topInset: number, bottomInset: number, tipPull: number) {
  const yTop = TIP.y + topInset;
  const tipX = TIP.x - tipPull;
  const k = tipX / TIP.x; // squeeze x so the tip lands at tipX (left edge stays 0)
  const dropTotal = DROP - topInset - bottomInset;
  const rnd = mulberry32(0x0c2d19); // same seed ⇒ the hand-drawn wobble matches
  const anchors: [number, number][] = [
    [TIP.x - 34, 0], // end of the flat top (tip is rounded past it)
    [TIP.x + 4, 0.05], // rounded tip bulges out a touch
    [TIP.x - 46, 0.12],
    [820, 0.17], // gentle facet
    [672, 0.26],
    [628, 0.33], // — bend 1 —
    [520, 0.45], // steeper facet
    [372, 0.58],
    [330, 0.66], // — bend 2 —
    [214, 0.82], // steepest facet
    [86, 0.95],
    [0, 1], // into the left screen edge
  ];
  const pts: [number, number][] = anchors.map(([x, f], i) => {
    const wob = i === 0 || i >= anchors.length - 1 ? 0 : (rnd() - 0.5) * 11;
    return [x * k, yTop + dropTotal * f + wob];
  });
  return (
    `M0,${yTop} L${((TIP.x - 34) * k).toFixed(1)},${yTop} ` +
    smooth(pts) +
    `L0,${(yTop + dropTotal).toFixed(1)} Z`
  );
}

const BODY = layerBody(0, 0, 0); // base outline (also the clip path)

/* Three nested layers for a layered-depth look — each inset (more at the top
   than the bottom, so it skews toward the bottom edge) so it fits cleanly
   inside the one below. Drawn back→front, darkest→lightest. The scroll effect
   will pull these apart later. */
const LAYERS = [
  { fill: CYAN, d: BODY },
  { fill: CYAN_TILE, d: layerBody(22, 7, 46) },
  { fill: CYAN_LIGHT, d: layerBody(46, 15, 96) },
];

const LANGUAGES = ["Python", "C", "C++", "JavaScript", "SQL", "HTML/CSS"];

/* Draft 1 — bare "Languages" label + a rounded-square tile per language,
   floating just above the ledge's top surface. Text only (no brand logos):
   reads instantly, stays on-theme, no colour clash, no ambiguous glyphs. */
function LanguagesPanel() {
  return (
    <div id="skills" className="pointer-events-auto">
      <div className="flex items-center gap-4">
        <span
          aria-hidden
          className="h-[3rem] w-[14px] shrink-0 rounded-[2px] sm:h-[4rem]"
          style={{ backgroundColor: CYAN_LIGHT }}
        />
        <h3 className="font-display text-[3rem] leading-[0.95] tracking-tight text-white [text-shadow:0_3px_20px_rgba(10,7,20,0.85)] sm:text-[4rem]">
          Languages
        </h3>
      </div>
      <ul className="mt-11 grid grid-cols-3 gap-[clamp(1.15rem,3.2vw,3rem)]">
        {LANGUAGES.map((lang) => (
          <li
            key={lang}
            className="flex aspect-[9/5] items-center justify-center rounded-xl border px-3 text-center font-title text-xl tracking-wide text-white shadow-[0_8px_24px_rgba(10,7,20,0.4)] transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-2 hover:shadow-[0_18px_36px_rgba(10,7,20,0.55)] sm:text-3xl"
            style={{ backgroundColor: CYAN_TILE, borderColor: CYAN_LIGHT }}
          >
            {lang}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* px the landed panel sits BELOW the exact viewport centre (positive = lower) */
const LAND_OFFSET = 64;

/**
 * Scroll so the Languages panel lands near the viewport's vertical centre
 * (nudged down by LAND_OFFSET) — accounting for the parallax (the panel
 * travels at 1+STRENGTH× the page). Wired to the "Skills" nav link.
 */
export function scrollToLanguages() {
  const ledge = document.getElementById("ledge-languages");
  const panel = document.getElementById("skills");
  if (!ledge || !panel) return;

  const prev = ledge.style.transform;
  ledge.style.transform = "none"; // read untransformed geometry
  const lr = ledge.getBoundingClientRect();
  const pr = panel.getBoundingClientRect();
  ledge.style.transform = prev;

  const sy = window.scrollY;
  const baseCentre = lr.top + sy + lr.height / 2;
  const panelCentre = pr.top + sy + pr.height / 2;
  const delta = panelCentre - baseCentre;
  const target =
    baseCentre -
    window.innerHeight / 2 +
    (delta - LAND_OFFSET) / (1 + STRENGTH);

  window.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
}

export default function LeftLedge() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    el.style.transform = ""; // clear any leftover (StrictMode re-run / HMR)
    const r = el.getBoundingClientRect();
    const baseCentre = r.top + window.scrollY + r.height / 2;

    let raf = 0;
    const apply = () => {
      raf = 0;
      const px = (baseCentre - (window.scrollY + window.innerHeight / 2)) * STRENGTH;
      el.style.transform = `translate3d(0, ${px.toFixed(1)}px, 0)`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };

    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
      el.style.transform = "";
    };
  }, []);

  return (
    <div
      ref={ref}
      id="ledge-languages"
      className="pointer-events-none absolute left-0 z-[6] will-change-transform"
      style={{ top: `${TOP_VW}vw`, width: `${WIDTH_VW}vw` }}
    >
      {/* viewBox starts just above the flat top so the element box ≈ the
          painted surface (keeps the panel's gap math honest) */}
      <svg viewBox="0 26 1010 374" className="block w-full" aria-hidden>
        <defs>
          <filter id="ledge-grain">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.9"
              numOctaves="2"
              seed="5"
            />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.03  0 0 0 0 0.13  0 0 0 0 0.16  0 0 0 0.7 0"
            />
          </filter>
          <clipPath id="ledge-clip">
            <path d={BODY} />
          </clipPath>
        </defs>

        {/* base (darkest) layer + its grain */}
        <path d={LAYERS[0].d} fill={LAYERS[0].fill} stroke="#06222a" strokeWidth="2.5" />
        <g clipPath="url(#ledge-clip)">
          <rect
            x="-40"
            y="-40"
            width="1120"
            height="400"
            filter="url(#ledge-grain)"
            opacity="0.4"
          />
        </g>
        {/* the two lighter, nested layers on top */}
        {LAYERS.slice(1).map((layer) => (
          <path
            key={layer.fill}
            d={layer.d}
            fill={layer.fill}
            stroke="rgba(4,18,24,0.45)"
            strokeWidth="1.5"
          />
        ))}
      </svg>

      {/* content anchored to the BASE (darkest, highest) layer's top edge — its
          top is at BODY's y=30 in the "0 26 1010 374" box ⇒ (30-26)/374 ≈
          1.07% down ⇒ 98.93% up. Anchoring by % keeps the gap fixed at any
          viewport width. */}
      <div
        className="absolute"
        style={{
          left: "3vw", // small margin in from the outcrop's left edge
          bottom: "calc(98.93% + 12px)",
          width: "39vw", // leaves a margin before the outcrop's tip too
        }}
      >
        <LanguagesPanel />
      </div>
    </div>
  );
}
