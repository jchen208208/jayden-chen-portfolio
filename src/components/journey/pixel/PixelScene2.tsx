"use client";

import { useEffect, useRef } from "react";
import { paintStatic } from "./render";
import { buildScene2, COLS, ROWS, type Scene2 } from "./scene2";
import { loadTextures, TILE, WATER_FRAMES } from "./textures";

/**
 * piece2 — the plunge pool + forest canopy, as a Minecraft-block <canvas>.
 * Static layer (haze gradient, warm backlight, every leaf/log/rock block) is
 * painted once to an offscreen buffer; each frame re-blits it and layers on the
 * animated falls + pool, drifting mist banks and the additive spirit-light
 * motes. Honours `prefers-reduced-motion` (one static frame, no rAF).
 */

const W = COLS * TILE;
const H = ROWS * TILE;
type TexSet = Awaited<ReturnType<typeof loadTextures>>;

function paintWater(
  g: CanvasRenderingContext2D,
  scene: Scene2,
  tex: TexSet,
  frame: number,
) {
  const sy = frame * TILE;
  for (const w of scene.water) {
    const x = w.c * TILE;
    const y = w.r * TILE;
    g.drawImage(tex.water_still, 0, sy, TILE, TILE, x, y, TILE, TILE);
    if (w.bright) {
      g.fillStyle = `rgba(242,249,255,${w.bright})`;
      g.fillRect(x, y, TILE, TILE);
    }
  }
}

function paintMist(g: CanvasRenderingContext2D, scene: Scene2, t: number) {
  // static haze band settling over the pool (softens the pool → canopy seam)
  const [t0, tp, t1] = scene.mistBand;
  const bg = g.createLinearGradient(0, t0 * TILE, 0, t1 * TILE);
  bg.addColorStop(0, "rgba(223,230,236,0)");
  bg.addColorStop((tp - t0) / (t1 - t0), "rgba(223,230,236,0.5)");
  bg.addColorStop(1, "rgba(223,230,236,0)");
  g.fillStyle = bg;
  g.fillRect(0, t0 * TILE, W, (t1 - t0) * TILE);

  const wrap = W + 200;
  for (const m of scene.mist) {
    const off = t * m.drift * TILE;
    for (const b of m.blocks) {
      const x = ((((b.x * TILE + off) % wrap) + wrap) % wrap) - 100;
      const y = b.y * TILE;
      for (const dx of [x - wrap, x, x + wrap]) {
        if (dx > W || dx < -TILE) continue;
        g.fillStyle = m.color;
        g.fillRect(dx, y, TILE, TILE);
      }
    }
  }
}

function paintMotes(g: CanvasRenderingContext2D, scene: Scene2, t: number) {
  g.globalCompositeOperation = "lighter";
  for (const m of scene.motes) {
    const a = 0.28 + 0.42 * (0.5 + 0.5 * Math.sin(t * 0.0016 + m.phase));
    const x = m.x + Math.sin(t * 0.00042 + m.phase) * m.drift;
    const y = m.y + Math.sin(t * 0.00055 + m.phase * 1.7) * m.rise;
    const grd = g.createRadialGradient(x, y, 0, x, y, m.r);
    grd.addColorStop(0, `rgba(255,235,188,${a.toFixed(3)})`);
    grd.addColorStop(0.5, `rgba(255,208,150,${(a * 0.38).toFixed(3)})`);
    grd.addColorStop(1, "rgba(255,200,140,0)");
    g.fillStyle = grd;
    g.fillRect(x - m.r, y - m.r, m.r * 2, m.r * 2);
  }
  g.globalCompositeOperation = "source-over";
}

export default function PixelScene2() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    let raf = 0;
    let cancelled = false;

    loadTextures().then((tex) => {
      if (cancelled) return;
      const scene = buildScene2();

      const off = document.createElement("canvas");
      off.width = W;
      off.height = H;
      paintStatic(off.getContext("2d")!, scene, tex);

      ctx.imageSmoothingEnabled = false;

      const frame = (now: number) => {
        ctx.clearRect(0, 0, W, H);
        ctx.drawImage(off, 0, 0);
        const wf = reduce ? 0 : Math.floor(now / 95) % WATER_FRAMES;
        paintWater(ctx, scene, tex, wf);
        paintMist(ctx, scene, reduce ? 0 : now);
        paintMotes(ctx, scene, reduce ? 3000 : now);
      };

      if (reduce) {
        frame(0);
        return;
      }
      let last = 0;
      const loop = (now: number) => {
        if (cancelled) return;
        if (now - last >= 32) {
          frame(now);
          last = now;
        }
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      aria-hidden
      className="block w-full select-none"
      style={{
        imageRendering: "pixelated",
        aspectRatio: `${COLS} / ${ROWS}`,
        background: "linear-gradient(#2b333b, #7b756a 55%, #b09a80)",
        maskImage:
          "linear-gradient(180deg,transparent 0,#000 5%,#000 92%,transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(180deg,transparent 0,#000 5%,#000 92%,transparent 100%)",
      }}
    />
  );
}
