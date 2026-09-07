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

/* Two generated water clips composited over the painted falls:

   FALLS  — falls-loop.mp4 over piece1's crevice (left 30% / width 40%),
            stretched the length of piece1. Its top mask hard-cuts the clip's
            own painted sky + crest + rock-nose (which ghosted a second
            clifftop) so piece1's lip is the only crest; motion fades in below
            the crown where the clip's water is one clean column.

   SPLASH — splash-loop.mp4 over piece2's plunge pool. Seeded from piece2's
            own top 46% (falls column → spray cloud → churning pool → drifting
            mist), so its walls line up with piece2's painting. Overlaps the
            bottom of FALLS by ~20vw; the two fade through that band so the
            water reads as continuous across the seam (the clips share no
            timeline — this is a crossfade in the misty zone, not a frame
            sync).

   Both clips grow faint edge mist over their length that snaps back on loop,
   so we never play them straight through: sub-loop the clean head and run two
   offset copies that crossfade through each wrap for a seamless short loop. */
/* The clip was seeded from piece1 x30–70%, y40–78.2%, so at left:30 / width:40
   / top:(187.75*0.40) / height:(187.75*0.382) its frame maps 1:1 back onto
   piece1 — the clip's crest, rock-nose and wall plants land exactly on piece1's
   painted ones. We don't want the clip's own crest/rock-nose at all (they never
   line up cleanly enough → a doubled rock), so the vertical mask hides the clip
   entirely down to ~43% — just below the rock-nose, where its water is one
   clean moving column. Above that the ONLY rock is piece1's painted one; the
   moving water picks up exactly at its tip. */
const FALLS = {
  left: 30, // %
  width: 40, // %
  top: 187.75 * 0.4, // vw ≈ 75.1
  height: 187.75 * 0.382, // vw ≈ 71.7 (matches the seed crop 1:1)
  mask:
    // horizontal: show only the clip's water band (~x41–68%); crop the rock
    // outcrops it carries down each side (they ghosted a faint second outcrop
    // over piece1's painted ones)
    "linear-gradient(90deg,transparent 0,transparent 28%,#000 38%,#000 72%,transparent 82%,transparent 100%)," +
    // vertical: hide the clip's sky + crest + rock-nose (top ~43%); the moving
    // water fades in at piece1's rock-nose tip and runs down from there
    "linear-gradient(180deg,transparent 0,transparent 40%,#000 47%,#000 90%,transparent 100%)",
  subloop: 2.15, // s of clip that stays mist-free
  xfade: 0.4, // s crossfade across each wrap
};

/* piece2 top edge sits at 187.75 − 34(overlap) = 153.75vw; piece2 is
   179.19vw tall at 100vw wide. The seed was piece2 x26.6–73.4%, y0–46.4%. */
const SPLASH = {
  left: 26.6, // %
  width: 46.75, // %
  top: 153.75, // vw
  height: 0.464 * 179.19, // vw ≈ 83.1
  mask:
    "linear-gradient(90deg,transparent 0,#000 9%,#000 91%,transparent 100%)," +
    // fade in fast to pick up where FALLS leaves off (~147vw); keep the near
    // ripple rings but fade the pool out by ~221vw, before piece2's painted
    // canopy tops (~225vw), so the rings don't read as sitting on the treetops
    "linear-gradient(180deg,transparent 0,#000 8%,#000 64%,transparent 80%)",
  subloop: 4.8, // s (clip is 5.04s; last ~0.2s carries the heaviest mist)
  xfade: 0.5,
  grade: 1, // use PLATES[1] (piece2) colour grade — it sits on piece2
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

      {/* living water — two crossfaded sub-loops: the falls down piece1, the
          plunge-pool splash + drifting mist on piece2, overlapping at the seam */}
      <LoopVideo src="/plates/master/falls-loop.mp4" spec={FALLS} />
      <LoopVideo src="/plates/master/splash-loop.mp4" spec={SPLASH} />
    </section>
  );
}
