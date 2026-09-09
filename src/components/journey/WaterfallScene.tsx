/* eslint-disable @next/next/no-img-element -- full-bleed painted plates */
"use client";

import { useEffect, useRef } from "react";
import Hero from "./Hero";
import HardwareLedge from "./HardwareLedge";
import LeftLedge from "./LeftLedge";
import RightLedge from "./RightLedge";
import PixelScene from "./pixel/PixelScene";
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
    // piece2's bottom canopy and piece3's top canopy are the SAME painted
    // trees (piece3 was generated i2i off piece2's bottom edge) and register
    // tightly. Two things went wrong before: (1) overlap 9 < feather 20 left
    // piece2's HARD bottom edge showing at ~45% opacity — a tonal line;
    // (2) bumping the feather to 20+ to hide that then held piece3 semi-
    // transparent across piece2's dark central tree for ~15vw, so its dark
    // crown + trunk ghosted through piece3's lit leaves ("see-through
    // leaves"). Fix: deep overlap (26) buries the edge, and a SHORT feather
    // (5) — safe *because* the content matches — snaps piece3 opaque before
    // its leaves cross piece2's dark tree. The cool→warm grade shift over
    // those 5vw reads as light catching the same tree, not a border.
    overlap: 26,
    feather: 5,
  },
  {
    src: MASTER.roots,
    filter: "brightness(1.05) saturate(0.94)",
    // piece4's top ~10% is a raster-composited copy of piece3's bottom edge
    // (scripts/piece4-seam-fix.mjs step 3) — but squashed into a shorter strip,
    // so its trunks sit ~1–2px off piece3's real trunks. The old 22vw feather
    // held both visible across that whole span → doubled trunk outlines. Same
    // fix as the piece2→3 seam: deep overlap (24) buries piece3's hard edge,
    // a SHORT feather (10) snaps piece4 opaque before the offset can register
    // as a ghost, while still being long enough to ease the cool→warm grade
    // step. piece4's baked-in top strip carries piece3's linework on down.
    overlap: 24,
    feather: 10,
  },
];

/* SPLASH — splash-loop.mp4 over piece2's plunge pool (churn + spray + drifting
   mist). Fades in from its own top (falls column). piece1's own falls are now
   the animated Minecraft water blocks in <PixelScene>, so the old WATERFALL clip
   is gone; this clip just adds churn where piece2's painted pool begins.

   The clip's spray swells over its length and snaps back on loop, so we sub-loop
   the clean head and crossfade two offset copies through each wrap. */
const SPLASH = {
  left: 26.6, // %
  width: 46.75, // %
  top: 153.75, // vw = piece2 top edge (keeps its walls/pool aligned to piece2)
  height: 0.464 * 179.19, // vw ≈ 83.1
  mask:
    "linear-gradient(90deg,transparent 0,#000 9%,#000 91%,transparent 100%)," +
    // fade in from its top (falls column) to meet WATERFALL's tail ~156vw,
    // then hold ALL the way through the falls-hits-pool impact, the churning
    // plunge basin AND the concentric ripple rings (clip frac ~.69–.86 ≈
    // 211–224vw — the old 58%/68% cut-off killed all of this, leaving the
    // pool painted-static). Fade out 79%→89% (≈219–227vw): the ripple rings
    // in the clip stay a tight centred circle (~60% of the clip width, well
    // inside the h-mask) so they never spread onto piece2's side foliage, and
    // the fade completes just as the clip's own canopy corners + piece2's
    // painted canopy tops (~223–230vw) would come into frame.
    "linear-gradient(180deg,transparent 0,#000 6%,#000 79%,transparent 89%)",
  // splash-loop.mp4 is 5.0417s. subloop ≥ that = "no manual seek" — the two
  // offset copies just run on the native <video loop> and cross-dissolve
  // through each wrap (see LoopVideo). The old 4.8 sub-loop trimmed only 0.24s
  // of mist but paid for it with a currentTime seek every cycle, which at
  // rate 1.5 hitched hard enough to read as a jump-cut on the loop.
  subloop: 5.05,
  xfade: 0.7, // slower dissolve so the wrap is imperceptible
  grade: 1, // sits on piece2 — use its colour grade
  // the clip's ripple/churn motion is very gentle — it read slow + laggy once
  // the pool was un-masked. Speed playback up to match WATERFALL (also tightens
  // the shared falls-column handoff at ~154–159vw). Can't raise the source fps
  // without a re-encode; this is the lever we have.
  rate: 1.5,
};

type LoopSpec = {
  left: number;
  width: number;
  top: number;
  height: number;
  mask: string;
  /** >0 sub-loops just the clean head + crossfades two offset copies to hide
   *  mist that builds over the full clip. 0 / omitted = one plain <video loop>
   *  — the smoothest playback; use it when the mask already crops the mist. */
  subloop?: number;
  xfade?: number;
  /** index into PLATES for the colour grade this clip sits on (default 0) */
  grade?: number;
  /** playback speed — the clips are gentle/slow; >1 makes the water read as
   *  actually falling. Default 1. */
  rate?: number;
};

function LoopVideo({ src, spec }: { src: string; spec: LoopSpec }) {
  const aRef = useRef<HTMLVideoElement>(null);
  const bRef = useRef<HTMLVideoElement>(null);
  const crossfade = !!spec.subloop && spec.subloop > 0;

  useEffect(() => {
    const a = aRef.current;
    if (!a) return;
    const b = bRef.current;

    const rate = spec.rate ?? 1;

    // plain loop — no rAF, no opacity juggling, just let it play
    if (!crossfade || !b) {
      a.playbackRate = rate;
      void a.play().catch(() => {});
      return;
    }
    a.playbackRate = rate;
    b.playbackRate = rate;

    let raf = 0;
    const subloop = spec.subloop as number;
    const xfade = spec.xfade ?? 0.4;
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
  }, [spec, crossfade]);

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
    loop: true,
    playsInline: true,
    className: "pointer-events-none absolute",
    style,
  } as const;

  if (!crossfade) return <video ref={aRef} {...common} />;
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
      <Hero />

      {/* piece1 — Minecraft-block scene (sunset sky, falls, mossy cliffs) */}
      <PixelScene />

      {PLATES.slice(1).map((pl, i) => (
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

      {/* skill ledge 1 — cyan outcrop from the left edge, parallax */}
      <LeftLedge />

      {/* churn where piece2's painted plunge pool begins */}
      <LoopVideo src="/plates/master/splash-loop.mp4" spec={SPLASH} />

      {/* skill ledge 2 — mirrored outcrop from the right edge */}
      <RightLedge />

      {/* skill ledge 3 — from the left edge again, further down */}
      <HardwareLedge />
    </section>
  );
}
