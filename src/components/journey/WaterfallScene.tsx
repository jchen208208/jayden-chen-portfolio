/* eslint-disable @next/next/no-img-element -- full-bleed painted plates */
"use client";

import Hero from "./Hero";
import HardwareLedge from "./HardwareLedge";
import LeftLedge from "./LeftLedge";
import RightLedge from "./RightLedge";
import PixelScene from "./pixel/PixelScene";
import PixelScene2 from "./pixel/PixelScene2";
import { MASTER } from "./plates";

/**
 * The Descent, scene 1. piece1 (sunset falls) and piece2 (plunge pool + canopy)
 * are now hand-built Minecraft-block <canvas> scenes; piece3 (jungle) and piece4
 * (roots) are still the painted plates, stitched on below with a per-seam
 * overlap + top-feather. `overlap` = vw a plate is pulled up into the one above;
 * `feather` = vw of its top fade-in.
 */

type Plate = { src: string; filter?: string; overlap: number; feather: number };

/* piece3 + piece4 — painted plates below the block scenes */
const PLATES: Plate[] = [
  {
    src: MASTER.jungle,
    filter: "brightness(0.9) saturate(0.84) contrast(1.02)",
    // piece2's block canopy fades out at its base; a deep overlap buries that
    // edge under piece3's painted canopy, a short feather snaps it opaque
    // before the block/paint style change can read as a hard line.
    overlap: 40,
    feather: 8,
  },
  {
    src: MASTER.roots,
    filter: "brightness(1.05) saturate(0.94)",
    // piece4's top ~10% is a raster-composited copy of piece3's bottom edge
    // (scripts/piece4-seam-fix.mjs) squashed ~0.786x, so its trunks sit ~1-2px
    // off piece3's. Deep overlap buries piece3's hard edge; a short feather
    // snaps piece4 opaque before the offset reads as a ghost.
    overlap: 24,
    feather: 10,
  },
];

export default function WaterfallScene() {
  return (
    <section id="top" className="relative bg-dusk">
      <Hero />

      {/* piece1 — Minecraft-block scene (sunset sky, falls, mossy cliffs) */}
      <PixelScene />

      {/* piece2 — Minecraft-block scene (plunge pool, mist, forest canopy);
          pulled up so its falls/pool overlap piece1's */}
      <div style={{ marginTop: "-30vw" }}>
        <PixelScene2 />
      </div>

      {PLATES.map((pl, i) => (
        <img
          key={i}
          src={pl.src}
          alt=""
          className="block w-full"
          style={{
            filter: pl.filter,
            marginTop: `-${pl.overlap}vw`,
            maskImage: `linear-gradient(180deg,transparent 0,#000 ${pl.feather}vw)`,
            WebkitMaskImage: `linear-gradient(180deg,transparent 0,#000 ${pl.feather}vw)`,
          }}
        />
      ))}

      {/* skill ledge 1 — cyan outcrop from the left edge, parallax */}
      <LeftLedge />

      {/* skill ledge 2 — mirrored outcrop from the right edge */}
      <RightLedge />

      {/* skill ledge 3 — from the left edge again, further down */}
      <HardwareLedge />
    </section>
  );
}
