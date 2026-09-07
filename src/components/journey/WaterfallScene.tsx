/* eslint-disable @next/next/no-img-element -- full-bleed painted plates */
"use client";

import { useEffect, useRef } from "react";
import { MASTER } from "./plates";

/**
 * PREVIEW — the four master paintings stitched into one continuous scroll.
 * Per-piece CSS colour-grade nudges the four generations toward one lighting
 * environment (they drift warm/bright toward the jungle); the intended
 * cool→warm descent is kept, just smoothed. Per-seam overlap + top-feather
 * blends the joins (seam 1→2 is deep to bury piece1's stray splash under
 * piece2's own mist). No pan / sprites yet.
 */

type Plate = {
  src: string;
  /** CSS filter to bring this generation into the group's grade */
  filter?: string;
  /** vw this plate is pulled up into the one above */
  overlap?: number;
  /** vw of top fade-in */
  feather?: number;
};

const PLATES: Plate[] = [
  {
    src: MASTER.waterfall,
    filter: "brightness(1.06) saturate(1.1) sepia(0.07)",
  },
  {
    src: MASTER.canopy,
    filter: "brightness(1.03) saturate(1.05) sepia(0.05)",
    // deep: piece2 must be FULLY opaque by ~176vw (before piece1's bottom
    // edge at 187.75vw) so piece1's edge + its stray side-splash are buried
    // under piece2's own painted mist. feather completes at 153.75+22 = 176vw.
    overlap: 34,
    feather: 22,
  },
  {
    src: MASTER.jungle,
    filter: "brightness(0.9) saturate(0.84) contrast(1.02)",
    overlap: 9,
    feather: 20,
  },
  {
    src: MASTER.roots,
    filter: "brightness(1.05) saturate(0.94)",
    // piece3 & piece4 now share the same vertical tree-trunks across the join
    // (piece4's top was generated straight off piece3's new bottom edge), so
    // the seam is buried under a deep overlap: piece4 is fully opaque by 22vw,
    // well past piece3's hard bottom edge at 24vw, and the 22vw feather
    // cross-dissolves the aligned trunks.
    overlap: 24,
    feather: 22,
  },
];

/* Two clips again — but the falls one now flows the WHOLE column.

   WATERFALL — falls-full.mp4, seeded from a crest→pool strip (piece1 y43.3–100%
   stacked on piece2 y0–39.8%, full width). Only its top ~55% is used here (the
   piece1 part): the water flows from the crest — past the rock-nose (piece1's
   own, which the clip matches: one rock) — all the way down, no static stretch.
   Below ~55% the stacked seed has a visible piece1↔piece2 tone seam, so we fade
   the clip out there and let SPLASH take over.

   SPLASH — splash-loop.mp4 over piece2's plunge pool (churn + spray + drifting
   mist). Overlaps WATERFALL's fade-out band so the water reads continuous.

   Both clips' spray swells over their length and snaps back on loop, so we
   sub-loop the clean head and crossfade two offset copies through each wrap.
   The horizontal mask keeps only the water column (outcrops stay painted). */
const WATERFALL = {
  left: 0, // %
  width: 100, // %
  top: 187.75 * 0.433, // vw ≈ 81.3  (piece1 y43.3% = seed top)
  height: 143.7, // vw  (full seed span 81.3 → 225vw; only ~55% is shown)
  mask:
    // horizontal: the clip is full-width off piece1, so its walls/outcrops
    // line up 1:1 — show almost the whole width (soft edge feathers), motion
    // only shows where there's water, everything else overlays invisibly
    "linear-gradient(90deg,transparent 3%,#000 16%,#000 84%,transparent 97%)," +
    // vertical: let piece1's crisp painted crest show (fade in by ~14%), then
    // fade out over 42–53% (≈141–157vw) — before the seed's piece1↔piece2 tone
    // seam (~167vw) — where SPLASH takes over
    "linear-gradient(180deg,transparent 0,transparent 6%,#000 14%,#000 42%,transparent 53%)",
  subloop: 2.4, // s before the spray cloud swells
  xfade: 0.4,
};

const SPLASH = {
  left: 26.6, // %
  width: 46.75, // %
  top: 153.75, // vw = piece2 top edge (keeps its walls/pool aligned to piece2)
  height: 0.464 * 179.19, // vw ≈ 83.1
  mask:
    "linear-gradient(90deg,transparent 0,#000 9%,#000 91%,transparent 100%)," +
    // fade in from its top (falls column) to meet WATERFALL's tail ~156vw,
    // hold through the pool churn + near ripple rings, fade the pool out by
    // ~221vw before piece2's painted canopy tops
    "linear-gradient(180deg,transparent 0,#000 6%,#000 62%,transparent 78%)",
  subloop: 4.8,
  xfade: 0.5,
  grade: 1, // sits on piece2 — use its colour grade
};

type LoopSpec = {
  left: number;
  width: number;
  top: number;
  height: number;
  mask: string;
  subloop: number;
  xfade: number;
  /** index into PLATES for the colour grade this clip sits on (default 0) */
  grade?: number;
};

function LoopVideo({ src, spec }: { src: string; spec: LoopSpec }) {
  const aRef = useRef<HTMLVideoElement>(null);
  const bRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const a = aRef.current;
    const b = bRef.current;
    if (!a || !b) return;

    let raf = 0;
    const { subloop, xfade } = spec;
    a.currentTime = 0;
    b.currentTime = subloop / 2;
    void a.play().catch(() => {});
    void b.play().catch(() => {});

    // fully opaque except a short dip across the copy's own wrap point
    const fade = (t: number) => {
      const edge = Math.min(t, subloop - t);
      return edge >= xfade ? 1 : Math.max(0, edge / xfade);
    };

    const tick = () => {
      for (const v of [a, b]) {
        if (v.currentTime >= subloop) v.currentTime -= subloop;
        v.style.opacity = String(fade(v.currentTime));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [spec]);

  const style: React.CSSProperties = {
    left: `${spec.left}%`,
    width: `${spec.width}%`,
    top: `${spec.top}vw`,
    height: `${spec.height}vw`,
    objectFit: "fill",
    filter: PLATES[spec.grade ?? 0].filter,
    maskImage: spec.mask,
    maskComposite: "intersect",
    WebkitMaskImage: spec.mask,
    WebkitMaskComposite: "source-in",
  };

  const common = {
    "aria-hidden": true,
    src,
    muted: true,
    playsInline: true,
    className: "pointer-events-none absolute",
    style,
  } as const;

  return (
    <>
      <video ref={aRef} {...common} />
      <video ref={bRef} {...common} />
    </>
  );
}

export default function WaterfallScene() {
  return (
    <section id="top" className="relative bg-dusk">
      {PLATES.map((pl, i) => (
        <img
          key={i}
          src={pl.src}
          alt=""
          className="block w-full"
          style={{
            filter: pl.filter,
            marginTop: pl.overlap ? `-${pl.overlap}vw` : undefined,
            maskImage: pl.feather
              ? `linear-gradient(180deg,transparent 0,#000 ${pl.feather}vw)`
              : undefined,
            WebkitMaskImage: pl.feather
              ? `linear-gradient(180deg,transparent 0,#000 ${pl.feather}vw)`
              : undefined,
          }}
        />
      ))}

      {/* living water — full-column falls clip (crest → down piece1), handed
          off to the piece2 pool splash clip through an overlapping fade */}
      <LoopVideo src="/plates/master/falls-full.mp4" spec={WATERFALL} />
      <LoopVideo src="/plates/master/splash-loop.mp4" spec={SPLASH} />
    </section>
  );
}
