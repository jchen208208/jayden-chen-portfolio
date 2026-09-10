"use client";

import Hero from "./Hero";
import HardwareLedge from "./HardwareLedge";
import LeftLedge from "./LeftLedge";
import RightLedge from "./RightLedge";
import PixelScene from "./pixel/PixelScene";
import PixelScene2 from "./pixel/PixelScene2";
import PixelScene3 from "./pixel/PixelScene3";
import PixelScene4 from "./pixel/PixelScene4";

/**
 * The Descent, scene 1 — now four hand-built Minecraft-block <canvas> scenes
 * stitched into one continuous scroll: piece1 (sunset falls) → piece2 (plunge
 * pool + canopy) → piece3 (jungle interior) → piece4 (roots + deep earth). Each
 * is pulled up so it overlaps the one above; the canvas top/bottom mask-feathers
 * blend the joins. No painted plates left.
 */

export default function WaterfallScene() {
  return (
    <section id="top" className="relative bg-dusk">
      <Hero />

      {/* piece1 — sunset sky, falls, mossy cliffs */}
      <PixelScene />

      {/* piece2 — plunge pool, mist, forest canopy */}
      <div style={{ marginTop: "-30vw" }}>
        <PixelScene2 />
      </div>

      {/* piece3 — warm jungle interior: trunks, mossy branches, god-rays, motes */}
      <div style={{ marginTop: "-24vw" }}>
        <PixelScene3 />
      </div>

      {/* piece4 — the end of the descent: shrub band, root systems, deep earth */}
      <div style={{ marginTop: "-26vw" }}>
        <PixelScene4 />
      </div>

      {/* skill ledge 1 — cyan outcrop from the left edge, parallax */}
      <LeftLedge />

      {/* skill ledge 2 — mirrored outcrop from the right edge */}
      <RightLedge />

      {/* skill ledge 3 — from the left edge again, further down */}
      <HardwareLedge />
    </section>
  );
}
