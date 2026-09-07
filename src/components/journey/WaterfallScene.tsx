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

/* Two clips: WATERFALL (piece1) + SPLASH (piece2 pool).

   WATERFALL — falls-loop.mp4, the tight clip seeded 1:1 from piece1 x30–70%,
   y40–78.2%. Placed back at exactly that rectangle so the clip's crest,
   rock-nose and cliff walls land on their painted twins — one rock, no ghost,
   and the clip downscales into a 40vw box (native 716px → ~480px) so it stays
   sharp (falls-full.mp4 was full-width upscaled → blurry, and glitchy). height
   is stretched ~1.1× so the moving water reaches SPLASH with no static gap.
   The clip's own painted SKY (top ~19%) is masked off; everything from the
   crest down is shown.

   SPLASH — splash-loop.mp4 over piece2's plunge pool (churn + spray + drifting
   mist). Fades in from its own top (falls column) to meet WATERFALL's tail.

   Both clips' spray swells over their length and snaps back on loop, so we
   sub-loop the clean head and crossfade two offset copies through each wrap. */
const WATERFALL = {
  left: 30, // %
  width: 40, // %
  top: 187.75 * 0.4, // vw ≈ 75.1  (seed = piece1 y40%)
  height: 187.75 * 0.42, // vw ≈ 78.9 (seed span y40–78.2% ≈ 0.382, +~1.1× to
  //                                    close the gap down to SPLASH ~154vw)
  mask:
    // horizontal: clip is 1:1 off piece1 x30–70%, so its walls line up —
    // show near the full width with soft edge feathers
    "linear-gradient(90deg,transparent 4%,#000 14%,#000 86%,transparent 96%)," +
    // vertical: keep piece1's crisp painted crest + upper rock-nose (video
    // hidden to ~24%), then fade the moving water in over the lower rock-nose
    // (~95–103vw) where the two streams merge into the column, down to ~154vw
    "linear-gradient(180deg,transparent 0,transparent 24%,#000 34%,#000 84%,transparent 100%)",
  rate: 1.5, // the clip's water motion is gentle — speed it up so it reads as
  //           actually falling
  // crossfade near the FULL clip length (not a short sub-loop): two offset
  // copies dissolve through the wrap so the native loop seam never shows, and
  // the dip is infrequent enough not to read as a pulse. The clip's edge mist
  // is already cropped by the mask.
  subloop: 5.6,
  xfade: 0.5,
};

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

      {/* living water — the tight piece1 falls clip (crest → down), handed off
          to the piece2 pool splash clip through an overlapping fade */}
      <LoopVideo src="/plates/master/falls-loop.mp4" spec={WATERFALL} />
      <LoopVideo src="/plates/master/splash-loop.mp4" spec={SPLASH} />
    </section>
  );
}
