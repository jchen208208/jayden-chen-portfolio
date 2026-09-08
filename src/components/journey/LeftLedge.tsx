"use client";

import { useEffect, useRef } from "react";
import { motion, useInView, useMotionValue, useReducedMotion } from "motion/react";

/**
 * First skill ledge ("Languages") — a stacked dark-cyan outcrop from the left
 * screen edge with a floating panel of language tiles.
 *
 * Reveal: hidden until the section scrolls into view (clicking the "Skills"
 * nav link scrolls it in, which triggers the same thing). Then a fast,
 * near-simultaneous entrance — the three steps overlap rather than wait on
 * each other:
 *   1. the "Languages" letters wave in + the bar drops and bounces (together)
 *   2. the 3 outcrop layers slide in from the left, a hair apart
 *   3. the 6 tiles pop out of the centre, 3 at a time
 *
 * Parallax: several planes, each translated by its own rAF loop at its own
 * rate and with its own lag, so the outcrop layers and the floating panel
 * drift apart a little as you scroll — depth, not one flat slab.
 */

const TOP_VW = 112; // down the scene section
const WIDTH_VW = 50; // left edge → tip ≈ screen centre

/* ── parallax planes ─────────────────────────────────────────────────────────
   `K` = extra screen travel as a fraction of scroll (bigger ⇒ more foreground,
   rushes past faster); `LAG` = how quickly a plane chases its target each frame
   (smaller ⇒ drifts longer after you stop). The rock layers diverge only a
   hair — they have to stay nested — while the panel floats well in front. */
const PANEL_K = 0.3; // the floating panel — the landing math tracks this
const PANEL_LAG = 0.2;
const ROCK_K = 0.14; // the outcrop as a whole (base layer + grain)
const ROCK_LAG = 0.14;
const MID_K = 0.022; // middle layer, extra travel over the base
const MID_LAG = 0.115;
const MID_CAP = 8; // viewBox units — never let it unstack past the gap
const INNER_K = 0.045; // inner layer, extra over the base
const INNER_LAG = 0.095;
const INNER_CAP = 16; // viewBox units

/* The 3 outcrop layers, back→front — evenly spaced in lightness
   (HSL L ≈ 15% / 34% / 54%). CYAN_TILE is also the language-tile fill;
   CYAN_LIGHT is also the heading bar + the permanent tile border. */
const CYAN = "#0c3742"; // furthest / darkest layer
const CYAN_TILE = "#1c7e93"; // middle layer + language tiles
const CYAN_LIGHT = "#48b4cc"; // most-inner layer + bar + tile border

const TIP = { x: 986, y: 30 };
const DROP = 344; // underside drop from tip to the left screen edge

/* ── entrance choreography (seconds) ──────────────────────────────────────────
   All three steps kick off almost together; the small offsets just keep the
   motion from landing in one flat thud. */
const LAYERS_AT = 0.12; // step 2 — almost immediate
const LAYER_GAP = 0.07; // between the 3 layers
const LAYER_DUR = 0.42; // each layer's slide-in
const TILES_AT = 0.28; // step 3 — close on the layers' heels
const ROW_GAP = 0.09; // between the 2 tile rows

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

/* The base underside as a dense polyline, tip → left wall, wobble baked in
   (gentle facet → bend → steeper → bend → steepest, traced off piece1's
   painted rocks). Every layer is built from THIS one curve. */
const UNDERSIDE: [number, number][] = (() => {
  const rnd = mulberry32(0x0c2d19); // same seed ⇒ the hand-drawn wobble is fixed
  const anchors: [number, number][] = (
    [
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
    ] as [number, number][]
  ).map(([x, f], i): [number, number] => {
    const wob = i === 0 || i === 11 ? 0 : (rnd() - 0.5) * 11;
    return [x, TIP.y + DROP * f + wob];
  });

  const SEG = 14; // Catmull-Rom samples per anchor span
  const out: [number, number][] = [];
  for (let i = 0; i < anchors.length - 1; i++) {
    const p0 = anchors[i - 1] ?? anchors[i];
    const p1 = anchors[i];
    const p2 = anchors[i + 1];
    const p3 = anchors[i + 2] ?? p2;
    const end = i === anchors.length - 2 ? SEG : SEG - 1;
    for (let s = 0; s <= end; s++) {
      const t = s / SEG;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push([
        0.5 *
          (2 * p1[0] +
            (p2[0] - p0[0]) * t +
            (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
            (3 * p1[0] - p0[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 *
          (2 * p1[1] +
            (p2[1] - p0[1]) * t +
            (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
            (3 * p1[1] - p0[1] - 3 * p2[1] + p3[1]) * t3),
      ]);
    }
  }
  return out;
})();

/* Every layer traces the base underside offset inward by a CONSTANT distance:
   `botGap` all along the underside — so the bottom edges stay an equal, small
   distance apart — with the flat top dropped by a larger `topGap`, so the top
   edges stay an equal, wider distance apart. `rho` is the radius of the rounded
   tip nub, where the offset flat top and underside are eased together. The base
   layer is layerBody(0, 0). */
function layerBody(topGap: number, botGap: number, rho = 11) {
  const topY = TIP.y + topGap;
  const n = UNDERSIDE.length;

  // underside pushed in along its local normal by botGap (small ⇒ never folds)
  const off = UNDERSIDE.map(([px, py], i): [number, number] => {
    const a = UNDERSIDE[Math.max(0, i - 1)];
    const b = UNDERSIDE[Math.min(n - 1, i + 1)];
    const tx = b[0] - a[0];
    const ty = b[1] - a[1];
    const len = Math.hypot(tx, ty) || 1;
    return [px - (ty / len) * botGap, py + (tx / len) * botGap];
  });

  // cap the tip where the layer is 2·rho thick (its messy bulge samples fall
  // inside the nub); the four points ease the nub into the underside, no kink
  const capYB = topY + 2 * rho;
  let k = 1;
  while (k < n - 1 && off[k][1] < capYB) k++;
  const [x1, y1] = off[k - 1];
  const [x2, y2] = off[k];
  const capX = x1 + ((capYB - y1) / (y2 - y1 || 1)) * (x2 - x1);

  const edge: [number, number][] = [
    [capX, topY],
    [capX + rho * 0.7, topY + rho * 0.3],
    [capX + rho, topY + rho],
    [capX + rho * 0.7, capYB - rho * 0.3],
    [capX, capYB],
    ...off.slice(k),
  ];
  const lastY = edge[edge.length - 1][1];
  return (
    `M0,${topY.toFixed(1)} L${capX.toFixed(1)},${topY.toFixed(1)} ` +
    smooth(edge) +
    `L0,${lastY.toFixed(1)} Z`
  );
}

/* Three nested layers for a layered-depth look, drawn back→front /
   darkest→lightest — each traces the base's edges, its bottom edge a hair off,
   its top edge further off. */
const BODY = layerBody(0, 0, 16); // also the clip path
const LAYERS = [
  { fill: CYAN, d: BODY },
  { fill: CYAN_TILE, d: layerBody(25, 9) },
  { fill: CYAN_LIGHT, d: layerBody(50, 18) },
];

const LANGUAGES = ["Python", "C", "C++", "JavaScript", "SQL", "HTML/CSS"];

function LanguagesPanel({ show, reduce }: { show: boolean; reduce: boolean }) {
  const T = (config: object) => (reduce ? { duration: 0 } : config);

  return (
    <div>
      <div className="flex items-center gap-4">
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
          className="font-display text-[3rem] leading-[0.95] tracking-tight text-white [text-shadow:0_3px_20px_rgba(10,7,20,0.85)] sm:text-[4rem]"
          aria-label="Languages"
        >
          {"Languages".split("").map((ch, i) => (
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
        {LANGUAGES.map((lang, i) => {
          const col = i % 3;
          const row = Math.floor(i / 3);
          const hidden = { opacity: 0, scale: 0.55, x: (1 - col) * 46, y: 8 };
          return (
            <motion.li
              key={lang}
              className="flex aspect-[9/5] items-center justify-center rounded-xl border px-3 text-center font-title text-xl tracking-wide text-white shadow-[0_8px_24px_rgba(10,7,20,0.4)] hover:shadow-[0_18px_36px_rgba(10,7,20,0.55)] sm:text-3xl"
              style={{ backgroundColor: CYAN_TILE, borderColor: CYAN_LIGHT }}
              initial={hidden}
              animate={show ? { opacity: 1, scale: 1, x: 0, y: 0 } : hidden}
              transition={T({
                type: "spring",
                stiffness: 460,
                damping: 19,
                delay: TILES_AT + row * ROW_GAP,
              })}
              whileHover={{
                y: -8,
                transition: { type: "spring", stiffness: 400, damping: 22 },
              }}
            >
              {lang}
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}

/* px the landed panel sits BELOW the exact viewport centre (positive = lower) */
const LAND_OFFSET = 64;

/* ── hold the reader on the section while the entrance plays ──────────────────
   A fast scroll could blow straight past the pop-in. Once the scroll reaches
   the point where the Languages panel is ~centred, freeze the page for LOCK_MS,
   then let go. */
const LOCK_MS = 780;
let navScrollAt = 0; // set by scrollToLanguages so a "Skills" click isn't pinned

/** scrollY at which the Languages panel lands ~centred in the viewport (nudged
    down by LAND_OFFSET), accounting for the parallax. */
function languagesLandingY(ledge: HTMLElement, panel: HTMLElement) {
  const lt = ledge.style.transform;
  const pt = panel.style.transform;
  ledge.style.transform = "none"; // read untransformed (pre-parallax) geometry
  panel.style.transform = "none";
  const lr = ledge.getBoundingClientRect();
  const pr = panel.getBoundingClientRect();
  ledge.style.transform = lt;
  panel.style.transform = pt;

  const sy = window.scrollY;
  const baseCentre = lr.top + sy + lr.height / 2;
  const panelCentre = pr.top + sy + pr.height / 2;
  const delta = panelCentre - baseCentre;
  return Math.max(
    0,
    baseCentre - window.innerHeight / 2 + (delta - LAND_OFFSET) / (1 + PANEL_K),
  );
}

/**
 * Scroll so the Languages panel lands near the viewport's vertical centre.
 * The entrance plays on its own once the section scrolls into view. Wired to
 * "Skills".
 */
export function scrollToLanguages() {
  const ledge = document.getElementById("ledge-languages");
  const panel = document.getElementById("skills");
  if (!ledge || !panel) return;

  navScrollAt = Date.now();
  window.scrollTo({ top: languagesLandingY(ledge, panel), behavior: "smooth" });
}

export default function LeftLedge() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion() ?? false;

  const show = useInView(ref, { once: true, amount: 0.15 });

  const rockY = useMotionValue(0); // px — the outcrop plane (HTML wrapper)
  const midY = useMotionValue(0); //  viewBox units — middle layer, extra drift
  const innerY = useMotionValue(0); // viewBox units — inner layer, extra drift
  const panelY = useMotionValue(0); // px — the floating panel plane

  /* multi-plane parallax: each plane eases toward its own scroll-linked target
     at its own rate, so they separate a little while moving and re-settle when
     the scroll stops */
  useEffect(() => {
    const el = ref.current;
    if (!el || reduce) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    let centre = 0;
    let uPerPx = 1; // viewBox units per screen px, for the SVG-child planes
    const measure = () => {
      const r = el.getBoundingClientRect();
      centre = r.top + window.scrollY + r.height / 2;
      uPerPx = r.width > 0 ? 1010 / r.width : 1;
    };

    const planes = [
      { mv: rockY, k: ROCK_K, lag: ROCK_LAG, unit: false, cap: 0, cur: 0 },
      { mv: midY, k: MID_K, lag: MID_LAG, unit: true, cap: MID_CAP, cur: 0 },
      { mv: innerY, k: INNER_K, lag: INNER_LAG, unit: true, cap: INNER_CAP, cur: 0 },
      { mv: panelY, k: PANEL_K, lag: PANEL_LAG, unit: false, cap: 0, cur: 0 },
    ];
    type Plane = (typeof planes)[number];
    const targetOf = (p: Plane, rel: number) => {
      let t = rel * p.k;
      if (p.unit) t *= uPerPx;
      if (p.cap) t = p.cap * Math.tanh(t / p.cap); // soft-clamp so it never unstacks
      return t;
    };

    let raf = 0;
    const tick = () => {
      const rel = centre - (window.scrollY + window.innerHeight / 2);
      let live = false;
      for (const p of planes) {
        const target = targetOf(p, rel);
        const next = p.cur + (target - p.cur) * p.lag;
        if (Math.abs(target - next) > 0.02) live = true;
        p.cur = next;
        p.mv.set(next);
      }
      raf = live ? requestAnimationFrame(tick) : 0;
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const snap = () => {
      const rel = centre - (window.scrollY + window.innerHeight / 2);
      for (const p of planes) {
        p.cur = targetOf(p, rel);
        p.mv.set(p.cur);
      }
    };
    const onResize = () => {
      measure();
      snap();
    };

    measure();
    snap();
    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", kick);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
    };
  }, [reduce, rockY, midY, innerY, panelY]);

  /* Hold the reader on the section until the entrance animation finishes.
     When the scroll reaches the point where the Languages panel is ~centred,
     freeze the page hard — overflow:hidden plus swallowed wheel/touch/key
     input, no scroll-position tweaking so there's nothing to rubber-band
     against — then release once the animation's had its ~LOCK_MS. */
  useEffect(() => {
    if (!show || reduce) return;
    if (Date.now() - navScrollAt < 1600) return; // a nav click drives its own scroll
    const el = ref.current;
    const panel = document.getElementById("skills");
    if (!el || !panel) return;
    if (panel.getBoundingClientRect().bottom < window.innerHeight * 0.3) return; // section already gone

    const root = document.documentElement;
    const body = document.body;
    const pinY = languagesLandingY(el, panel); // panel ~centred
    const releaseAt = Date.now() + LOCK_MS;

    let raf = 0;
    let holdTimer = 0;
    let frozen = false;

    const swallow = (e: Event) => e.preventDefault();
    const SCROLL_KEYS = new Set([
      " ", "Spacebar", "PageDown", "PageUp", "ArrowDown", "ArrowUp", "Home", "End",
    ]);
    const onKey = (e: KeyboardEvent) => {
      if (SCROLL_KEYS.has(e.key)) e.preventDefault();
    };

    const thaw = () => {
      if (!frozen) return;
      frozen = false;
      root.style.overflow = "";
      body.style.overflow = "";
      root.style.paddingRight = "";
      window.removeEventListener("wheel", swallow);
      window.removeEventListener("touchmove", swallow);
      window.removeEventListener("keydown", onKey, true);
    };
    const freeze = () => {
      frozen = true;
      // reserve the scrollbar's width so hiding it doesn't reflow the page
      const sbw = window.innerWidth - root.clientWidth;
      root.style.overflow = "hidden";
      body.style.overflow = "hidden";
      if (sbw > 0) root.style.paddingRight = `${sbw}px`;
      window.addEventListener("wheel", swallow, { passive: false });
      window.addEventListener("touchmove", swallow, { passive: false });
      window.addEventListener("keydown", onKey, true);
      holdTimer = window.setTimeout(thaw, Math.max(150, releaseAt - Date.now()));
    };

    const cleanup = () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
      clearTimeout(holdTimer);
      thaw();
    };
    const check = () => {
      raf = 0;
      if (frozen) return;
      if (Date.now() >= releaseAt) return cleanup();
      if (window.scrollY >= pinY) freeze();
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };

    if (window.scrollY >= pinY) freeze(); // already there — hold in place
    else window.addEventListener("scroll", onScroll, { passive: true });
    // safety: drop the listener if the pin line is never reached in time
    const guard = window.setTimeout(() => {
      if (!frozen) cleanup();
    }, LOCK_MS + 400);
    return () => {
      clearTimeout(guard);
      cleanup();
    };
  }, [show, reduce]);

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
      id="ledge-languages"
      className="pointer-events-none absolute left-0 z-[6]"
      style={{ top: `${TOP_VW}vw`, width: `${WIDTH_VW}vw` }}
    >
      {/* outcrop plane — base layer + grain move as one */}
      <motion.div style={{ y: rockY }} className="will-change-transform">
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

          <motion.path
            d={LAYERS[0].d}
            fill={LAYERS[0].fill}
            stroke="#06222a"
            strokeWidth="2.5"
            {...slideIn(0)}
          />
          <motion.g
            clipPath="url(#ledge-clip)"
            initial={{ opacity: 0 }}
            animate={{ opacity: show ? 0.4 : 0 }}
            transition={T({ delay: LAYERS_AT + 0.15, duration: 0.45 })}
          >
            <rect
              x="-40"
              y="-40"
              width="1120"
              height="400"
              filter="url(#ledge-grain)"
            />
          </motion.g>
          {/* middle + inner layers: no stroke (fill is the only edge), and each
              drifts a touch further than the base for depth */}
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

      {/* panel plane — floats in front of the outcrop, travels fastest.
          anchored to the BASE layer's top edge (BODY y=30 ⇒ ≈ 98.93% up). */}
      <motion.div
        id="skills"
        className="pointer-events-auto absolute will-change-transform"
        style={{
          y: panelY,
          left: "3vw",
          bottom: "calc(98.93% + 12px)",
          width: "39vw",
        }}
      >
        <LanguagesPanel show={show} reduce={reduce} />
      </motion.div>
    </div>
  );
}
