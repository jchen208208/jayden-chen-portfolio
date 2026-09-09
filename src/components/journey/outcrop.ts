"use client";

import { useEffect, type RefObject } from "react";
import { useMotionValue } from "motion/react";

/**
 * Shared machinery for the skill-ledge outcrops (LeftLedge, RightLedge, …):
 * the outline geometry and the multi-plane parallax. Each ledge supplies its
 * own tip/drop/anchors for a unique shape; everything else follows one set of
 * rules so the sections read as a family.
 */

/* ═══════════════════════════════════ geometry ═══════════════════════════════ */

/** seeded PRNG so a "random-looking" outline is identical every render */
export function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Catmull-Rom through the points → a smooth cubic-bezier path segment. */
export function smooth(pts: [number, number][]) {
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

export type OutcropSpec = {
  /** tip corner in viewBox units — x near the right, y = flat-top level */
  tip: { x: number; y: number };
  /** vertical drop from tip level down to where the underside meets the wall */
  drop: number;
  /** underside anchors as [x, f] — f is 0..1 fraction of `drop`. The outer two
      get no hand-wobble so the shape pins to the flat top and the wall. */
  anchors: [number, number][];
  /** PRNG seed for the wobble — change it for a different hand-drawn wiggle */
  seed: number;
  /** [topGap, botGap] (viewBox units) for the middle and inner layers */
  layerGaps: [[number, number], [number, number]];
  /** rounded-tip nub radius [base, inner-two] (viewBox units) */
  rho?: [number, number];
  /** wobble amplitude (viewBox units) */
  wobble?: number;
};

/**
 * The 3 nested outcrop layers, back→front / darkest→lightest. Every layer
 * traces the base underside offset inward by a CONSTANT `botGap` (equal bottom
 * gap all along), with the flat top dropped by a larger `topGap`; the tip is
 * capped with a rounded nub where the layer gets too thin to hold both edges.
 * `body` is the base outline (also handy as a clip path).
 */
export function buildOutcrop(spec: OutcropSpec) {
  const { tip, drop, seed, wobble = 11 } = spec;
  const rnd = mulberry32(seed);

  const anchorPts: [number, number][] = spec.anchors.map(([x, f], i, a) => {
    const w = i === 0 || i === a.length - 1 ? 0 : (rnd() - 0.5) * wobble;
    return [x, tip.y + drop * f + w];
  });

  // dense Catmull-Rom sampling of the underside, tip → wall
  const SEG = 14;
  const underside: [number, number][] = [];
  for (let i = 0; i < anchorPts.length - 1; i++) {
    const p0 = anchorPts[i - 1] ?? anchorPts[i];
    const p1 = anchorPts[i];
    const p2 = anchorPts[i + 1];
    const p3 = anchorPts[i + 2] ?? p2;
    const end = i === anchorPts.length - 2 ? SEG : SEG - 1;
    for (let s = 0; s <= end; s++) {
      const t = s / SEG;
      const t2 = t * t;
      const t3 = t2 * t;
      underside.push([
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

  const layerBody = (topGap: number, botGap: number, rho: number) => {
    const topY = tip.y + topGap;
    const n = underside.length;
    const off = underside.map(([px, py], i): [number, number] => {
      const a = underside[Math.max(0, i - 1)];
      const b = underside[Math.min(n - 1, i + 1)];
      const tx = b[0] - a[0];
      const ty = b[1] - a[1];
      const len = Math.hypot(tx, ty) || 1;
      return [px - (ty / len) * botGap, py + (tx / len) * botGap];
    });

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
  };

  const [rhoBase, rhoInner] = spec.rho ?? [16, 11];
  const body = layerBody(0, 0, rhoBase);
  return {
    body,
    layers: [
      body,
      layerBody(spec.layerGaps[0][0], spec.layerGaps[0][1], rhoInner),
      layerBody(spec.layerGaps[1][0], spec.layerGaps[1][1], rhoInner),
    ] as [string, string, string],
  };
}

/* The 3 outcrop layers, back→front — evenly spaced in lightness (HSL L ≈ 15 /
   34 / 54). TILE is also the label-tile fill; LIGHT is also the heading bar +
   the permanent tile border. Shared across every skill section. */
export const CYAN = "#0c3742";
export const CYAN_TILE = "#1c7e93";
export const CYAN_LIGHT = "#48b4cc";

/* ═══════════════════════════════════ parallax ══════════════════════════════ */

export type ParallaxConfig = {
  frameLower?: number; // px the composition sits below viewport centre at rest
  pastMult?: number; // extra divergence once scrolled past the rest frame
  panelK?: number;
  panelLag?: number;
  rockK?: number;
  rockLag?: number;
  midK?: number;
  midLag?: number;
  midCap?: number; // viewBox units — never unstack past the gap
  innerK?: number;
  innerLag?: number;
  innerCap?: number;
};

const DEFAULTS: Required<ParallaxConfig> = {
  frameLower: 56,
  pastMult: 2,
  panelK: 0.24,
  panelLag: 0.2,
  rockK: 0.15,
  rockLag: 0.14,
  midK: 0.03,
  midLag: 0.115,
  midCap: 10,
  innerK: 0.06,
  innerLag: 0.09,
  innerCap: 20,
};

/** scrollY that frames a ledge's composition (panel-top → outcrop-bottom)
    `frameLower` px below the viewport centre — where the parallax is at rest,
    so the frame reads exactly as laid out. */
export function ledgeLandingY(
  ledge: HTMLElement,
  panel: HTMLElement,
  frameLower = DEFAULTS.frameLower,
) {
  const lt = ledge.style.transform;
  const pt = panel.style.transform;
  ledge.style.transform = "none"; // read untransformed (pre-parallax) geometry
  panel.style.transform = "none";
  const lr = ledge.getBoundingClientRect();
  const pr = panel.getBoundingClientRect();
  ledge.style.transform = lt;
  panel.style.transform = pt;

  const rest = (pr.top + lr.bottom) / 2 + window.scrollY - frameLower;
  return Math.max(0, rest - window.innerHeight / 2);
}

/**
 * Four parallax planes — rock (base layer + grain), the middle layer, the inner
 * layer, and the floating panel — each easing toward its own scroll-linked
 * target at its own rate and lag, so they drift apart while moving and re-settle
 * when the scroll stops. Divergence is multiplied once the reader has scrolled
 * past the rest frame (they're done reading). The rock layers are soft-clamped
 * so they can never unstack. Returns motion values to bind to the SVG + panel.
 */
export function useLedgeParallax<T extends HTMLElement>(
  ref: RefObject<T | null>,
  panelId: string,
  cfg: ParallaxConfig = {},
) {
  const c = { ...DEFAULTS, ...cfg };
  const rockY = useMotionValue(0); // px — the outcrop plane (HTML wrapper)
  const midY = useMotionValue(0); // viewBox units — middle layer, extra drift
  const innerY = useMotionValue(0); // viewBox units — inner layer, extra drift
  const panelY = useMotionValue(0); // px — the floating panel plane

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    let centre = 0; // doc-space y the planes rest at — the composition centre
    let uPerPx = 1; // viewBox units per screen px, for the SVG-child planes
    const measure = () => {
      const r = el.getBoundingClientRect();
      uPerPx = r.width > 0 ? 1010 / r.width : 1;
      const p = document.getElementById(panelId);
      if (p) {
        const pt = p.style.transform;
        p.style.transform = "none";
        const pr = p.getBoundingClientRect();
        p.style.transform = pt;
        centre = (pr.top + r.bottom) / 2 + window.scrollY - c.frameLower;
      } else {
        centre = r.top + window.scrollY + r.height / 2;
      }
    };

    const planes = [
      { mv: rockY, k: c.rockK, lag: c.rockLag, unit: false, cap: 0, cur: 0 },
      { mv: midY, k: c.midK, lag: c.midLag, unit: true, cap: c.midCap, cur: 0 },
      { mv: innerY, k: c.innerK, lag: c.innerLag, unit: true, cap: c.innerCap, cur: 0 },
      { mv: panelY, k: c.panelK, lag: c.panelLag, unit: false, cap: 0, cur: 0 },
    ];
    type Plane = (typeof planes)[number];
    const targetOf = (p: Plane, rel: number) => {
      // rel < 0 ⇒ scrolled past the rest frame: amplify, they're done reading
      let t = rel * p.k * (rel < 0 ? c.pastMult : 1);
      if (p.unit) t *= uPerPx;
      if (p.cap) {
        // soft-clamp; the past-frame (upward) direction is the one with room
        const lim = t < 0 ? p.cap * 2 : p.cap * 0.7;
        t = lim * Math.tanh(t / lim);
      }
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
    // c is derived from static per-section config; ref/panelId are stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, panelId]);

  return { rockY, midY, innerY, panelY };
}
