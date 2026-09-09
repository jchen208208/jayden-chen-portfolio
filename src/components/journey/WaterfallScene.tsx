/* eslint-disable @next/next/no-img-element -- full-bleed painted plate */
"use client";

import Hero from "./Hero";
import HardwareLedge from "./HardwareLedge";
import LeftLedge from "./LeftLedge";
import RightLedge from "./RightLedge";
import PixelScene from "./pixel/PixelScene";
import PixelScene2 from "./pixel/PixelScene2";
import PixelScene3 from "./pixel/PixelScene3";
import { MASTER } from "./plates";

/**
 * The Descent, scene 1. piece1 (sunset falls), piece2 (plunge pool + canopy) and
 * piece3 (jungle interior) are hand-built Minecraft-block <canvas> scenes, each
 * pulled up so it overlaps the one above; the canvas top/bottom mask-feathers
 * blend the joins. piece4 (roots) is still the painted plate, stitched on below.
 */

export default function WaterfallScene() {
  return (
    <section id="top" className="relative bg-dusk">
      <Hero />

      {/* piece1 — Minecraft-block scene (sunset sky, falls, mossy cliffs) */}
      <PixelScene />

      {/* piece2 — plunge pool, mist, forest canopy */}
      <div style={{ marginTop: "-30vw" }}>
        <PixelScene2 />
      </div>

      {/* piece3 — warm jungle interior: trunks, mossy branches, god-rays, motes */}
      <div style={{ marginTop: "-24vw" }}>
        <PixelScene3 />
      </div>

      {/* piece4 — painted roots/ground plate (deep overlap buries the seam) */}
      <img
        src={MASTER.roots}
        alt=""
        className="block w-full"
        style={{
          filter: "brightness(1.02) saturate(0.92)",
          marginTop: "-34vw",
          maskImage: "linear-gradient(180deg,transparent 0,#000 12vw)",
          WebkitMaskImage: "linear-gradient(180deg,transparent 0,#000 12vw)",
        }}
      />

      {/* skill ledge 1 — cyan outcrop from the left edge, parallax */}
      <LeftLedge />

      {/* skill ledge 2 — mirrored outcrop from the right edge */}
      <RightLedge />

      {/* skill ledge 3 — from the left edge again, further down */}
      <HardwareLedge />
    </section>
  );
}
