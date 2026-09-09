"use client";

import { useEffect, useRef } from "react";
import { paintStatic } from "./render";
import { buildScene3, COLS, ROWS, type Scene3 } from "./scene3";
import { loadTextures, TILE } from "./textures";

/**
 * piece3 — the warm jungle interior, as a Minecraft-block <canvas>. Static layer
 * (amber haze, glows, canopy underside, trunks, mossy branches, ferns, drapes)
 * is painted once to an offscreen buffer; each frame re-blits it and layers on
 * the pulsing god-rays, the warm haze wash at the trunk feet, drifting leaves
 * and the dense spirit-motes. Honours `prefers-reduced-motion`.
 */

const W = COLS * TILE;
const H = ROWS * TILE;
const RAY_SLOPE = 0.46;

function paintGodRays(g: CanvasRenderingContext2D, scene: Scene3, t: number) {
  g.globalCompositeOperation = "lighter";
  for (const ray of scene.godrays) {
    const pulse = 0.7 + 0.3 * Math.sin(t * 0.00055 + ray.phase);
    const x = ray.x * TILE + Math.sin(t * 0.00013 + ray.phase) * 6;
    const w = ray.w * TILE;
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x + w, 0);
    g.lineTo(x + w - H * RAY_SLOPE, H);
    g.lineTo(x - H * RAY_SLOPE, H);
    g.closePath();
    const grd = g.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, `rgba(255,236,196,${(ray.alpha * pulse).toFixed(3)})`);
    grd.addColorStop(0.7, `rgba(255,224,176,${(ray.alpha * pulse * 0.5).toFixed(3)})`);
    grd.addColorStop(1, "rgba(255,224,176,0)");
    g.fillStyle = grd;
    g.fill();
  }
  g.globalCompositeOperation = "source-over";
}

function paintHaze(g: CanvasRenderingContext2D, scene: Scene3) {
  const [t0, t1] = scene.hazeBand;
  const grd = g.createLinearGradient(0, t0 * TILE, 0, t1 * TILE);
  grd.addColorStop(0, "rgba(244,206,162,0)");
  grd.addColorStop(0.6, "rgba(244,208,166,0.32)");
  grd.addColorStop(1, "rgba(246,214,176,0.6)");
  g.fillStyle = grd;
  g.fillRect(0, t0 * TILE, W, (t1 - t0) * TILE);
}

function paintLeaves(g: CanvasRenderingContext2D, scene: Scene3, t: number) {
  for (const lf of scene.leaves) {
    const y = (lf.y + t * 0.012 * lf.fall) % (H + 40) - 20;
    const x = lf.x + Math.sin(t * 0.0011 + lf.phase) * lf.sway;
    const s = Math.abs(Math.sin(t * 0.002 + lf.phase)) < 0.4 ? 2 : 4; // tumble
    g.fillStyle = lf.color;
    g.fillRect(Math.round(x / 2) * 2, Math.round(y / 2) * 2, s, 3);
  }
}

function paintMotes(g: CanvasRenderingContext2D, scene: Scene3, t: number) {
  g.globalCompositeOperation = "lighter";
  for (const m of scene.motes) {
    const a = 0.3 + 0.45 * (0.5 + 0.5 * Math.sin(t * 0.0017 + m.phase));
    const x = m.x + Math.sin(t * 0.00045 + m.phase) * m.drift;
    const y = m.y + Math.sin(t * 0.0006 + m.phase * 1.6) * m.rise;
    const grd = g.createRadialGradient(x, y, 0, x, y, m.r);
    grd.addColorStop(0, `rgba(255,238,190,${a.toFixed(3)})`);
    grd.addColorStop(0.5, `rgba(255,214,150,${(a * 0.36).toFixed(3)})`);
    grd.addColorStop(1, "rgba(255,206,140,0)");
    g.fillStyle = grd;
    g.fillRect(x - m.r, y - m.r, m.r * 2, m.r * 2);
  }
  g.globalCompositeOperation = "source-over";
}

export default function PixelScene3() {
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
      const scene = buildScene3();

      const off = document.createElement("canvas");
      off.width = W;
      off.height = H;
      paintStatic(off.getContext("2d")!, scene, tex);

      ctx.imageSmoothingEnabled = false;

      const frame = (now: number) => {
        ctx.clearRect(0, 0, W, H);
        ctx.drawImage(off, 0, 0);
        paintGodRays(ctx, scene, reduce ? 0 : now);
        paintHaze(ctx, scene);
        if (!reduce) paintLeaves(ctx, scene, now);
        paintMotes(ctx, scene, reduce ? 2400 : now);
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
        background: "linear-gradient(#7c6f66, #f0c79a 46%, #ecccaa)",
        maskImage:
          "linear-gradient(180deg,transparent 0,#000 4%,#000 90%,transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(180deg,transparent 0,#000 4%,#000 90%,transparent 100%)",
      }}
    />
  );
}
