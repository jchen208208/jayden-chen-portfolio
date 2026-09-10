"use client";

import { useEffect, type RefObject } from "react";
import { useMotionValue } from "motion/react";

/**
 * Preserved parallax rig from the (removed) skill-ledge sections — kept because
 * the next journey design still needs multi-plane scroll parallax.
 *
 * `useLedgeParallax` drives N planes, each easing toward its own scroll-linked
 * target at its own rate + lag, so the planes drift apart while the page moves
 * and re-settle when it stops. Divergence is amplified once the reader scrolls
 * past the "rest frame" (they're done reading), and capped planes soft-clamp so
 * stacked layers can never unstack. `ledgeLandingY` computes the scrollY that
 * frames a composition where the parallax is at rest.
 *
 * NOTE: this used `useMotionValue` and returned values to bind onto SVG/HTML
 * planes. The plainer, arguably more reliable pattern proven elsewhere in this
 * project: a rAF-throttled `scroll` listener that sets
 * `el.style.transform = translate3d(0, (baseCentre - viewCentre) * strength, 0)`
 * with `baseCentre` measured once on mount (strength 0.2–0.35 ⇒ element travels
 * 1.2–1.35× the page). Pick per the new design.
 */

/* ── generic helpers (were shared with the outcrop geometry) ────────────────── */

/** seeded PRNG so a "random-looking" layout is identical every render (SSR-safe) */
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

/** scrollY that frames a composition (panel-top → base-bottom) `frameLower` px
    below the viewport centre — where the parallax is at rest, so the frame
    reads exactly as laid out. */
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
 * Four parallax planes — base, middle, inner, and a floating panel — each easing
 * toward its own scroll-linked target at its own rate and lag, so they drift
 * apart while moving and re-settle when the scroll stops. Divergence is
 * multiplied once the reader has scrolled past the rest frame. The middle/inner
 * planes are soft-clamped so they can never unstack. Returns motion values to
 * bind to the plane elements.
 */
export function useLedgeParallax<T extends HTMLElement>(
  ref: RefObject<T | null>,
  panelId: string,
  cfg: ParallaxConfig = {},
) {
  const c = { ...DEFAULTS, ...cfg };
  const rockY = useMotionValue(0); // px — the base plane (HTML wrapper)
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
