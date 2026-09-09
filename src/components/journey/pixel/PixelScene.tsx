"use client";

import { useEffect, useRef } from "react";
import { buildScene, COLS, ROWS, type Scene } from "./scene";
import { loadTextures, TILE, WATER_FRAMES, type TexSet } from "./textures";

/**
 * piece1 — the opening scene, rendered as a Minecraft-block grid on a <canvas>
 * that CSS-scales to full width (`image-rendering: pixelated`). The sky gradient,
 * warm glows and all terrain blocks are painted once to an offscreen canvas;
 * each frame re-blits that and layers on the drifting clouds, the flowing
 * waterfall (32-frame vanilla water strip) and the plunge-pool spray.
 *
 * Honours `prefers-reduced-motion`: one static frame, no rAF.
 */

const W = COLS * TILE;
const H = ROWS * TILE;
const POOL_TOP = 112;

function drawCell(
  g: CanvasRenderingContext2D,
  scene: Scene,
  tex: TexSet,
  r: number,
  c: number,
) {
  const cell = scene.cells[r]?.[c];
  if (!cell) return;
  const x = c * TILE;
  const y = r * TILE;
  g.drawImage(tex[cell.base], 0, 0, TILE, TILE, x, y, TILE, TILE);
  if (cell.overlay) g.drawImage(tex[cell.overlay], 0, 0, TILE, TILE, x, y, TILE, TILE);
  if (cell.dark) {
    g.fillStyle = `rgba(4,6,16,${cell.dark})`;
    g.fillRect(x, y, TILE, TILE);
  }
  if (cell.bright) {
    g.fillStyle = `rgba(255,252,240,${cell.bright})`;
    g.fillRect(x, y, TILE, TILE);
  }
}

function paintStatic(g: CanvasRenderingContext2D, scene: Scene, tex: TexSet) {
  g.imageSmoothingEnabled = false;

  const grad = g.createLinearGradient(0, 0, 0, H);
  for (const [o, c] of scene.skyStops) grad.addColorStop(o, c);
  g.fillStyle = grad;
  g.fillRect(0, 0, W, H);

  for (const gl of scene.glows) {
    const rg = g.createRadialGradient(gl.x, gl.y, 0, gl.x, gl.y, gl.r);
    rg.addColorStop(0, gl.color);
    rg.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = rg;
    g.fillRect(gl.x - gl.r, gl.y - gl.r, gl.r * 2, gl.r * 2);
  }

  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) drawCell(g, scene, tex, r, c);
}

function paintClouds(g: CanvasRenderingContext2D, scene: Scene, t: number) {
  const wrap = W + 240;
  for (const cloud of scene.clouds) {
    const off = t * cloud.drift * TILE;
    for (const b of cloud.blocks) {
      const x = ((((b.x * TILE + off) % wrap) + wrap) % wrap) - 120;
      const y = b.y * TILE;
      if (y + TILE > scene.cloudFloorPx) continue;
      for (const dx of [x - wrap, x, x + wrap]) {
        if (dx > W || dx < -TILE) continue;
        g.fillStyle = cloud.color;
        g.fillRect(dx, y, TILE, TILE);
        g.fillStyle = "rgba(255,255,255,0.14)";
        g.fillRect(dx, y, TILE, 2);
        g.fillStyle = "rgba(60,40,80,0.06)";
        g.fillRect(dx, y + TILE - 2, TILE, 2);
      }
    }
  }
}

function paintWater(
  g: CanvasRenderingContext2D,
  scene: Scene,
  tex: TexSet,
  frame: number,
) {
  const sy = frame * TILE;
  for (const w of scene.water) {
    const x = w.c * TILE;
    const y = w.r * TILE;
    g.drawImage(tex.water_still, 0, sy, TILE, TILE, x, y, TILE, TILE);
    if (w.bright) {
      g.fillStyle = `rgba(255,255,255,${w.bright})`;
      g.fillRect(x, y, TILE, TILE);
    }
  }
}

function paintSpray(g: CanvasRenderingContext2D, scene: Scene, t: number) {
  // rising mist band over the pool
  const mg = g.createLinearGradient(0, (POOL_TOP - 9) * TILE, 0, H);
  mg.addColorStop(0, "rgba(233,243,255,0)");
  mg.addColorStop(0.55, "rgba(233,243,255,0.16)");
  mg.addColorStop(1, "rgba(233,243,255,0.32)");
  g.fillStyle = mg;
  g.fillRect(0, (POOL_TOP - 9) * TILE, W, H - (POOL_TOP - 9) * TILE);

  for (const p of scene.spray) {
    const a = 0.2 + 0.55 * (0.5 + 0.5 * Math.sin(t * 0.004 * p.rate + p.phase));
    const y = p.y - ((t * 0.018 * p.rate) % 44);
    g.fillStyle = `rgba(240,248,255,${a.toFixed(3)})`;
    g.fillRect(Math.round(p.x / 2) * 2, Math.round(y / 2) * 2, p.s, p.s);
  }
}

export default function PixelScene() {
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
      const scene = buildScene();

      const off = document.createElement("canvas");
      off.width = W;
      off.height = H;
      paintStatic(off.getContext("2d")!, scene, tex);

      ctx.imageSmoothingEnabled = false;

      const frame = (now: number) => {
        ctx.clearRect(0, 0, W, H);
        ctx.drawImage(off, 0, 0);
        paintClouds(ctx, scene, now);
        // tree crowns sit in front of the clouds — repaint just their leaf cells
        for (const [bc, br, bw, bh] of scene.treeBoxes)
          for (let r = br; r < br + bh; r++)
            for (let c = bc; c < bc + bw; c++) drawCell(ctx, scene, tex, r, c);
        const wf = reduce ? 0 : Math.floor(now / 95) % WATER_FRAMES;
        paintWater(ctx, scene, tex, wf);
        paintSpray(ctx, scene, reduce ? 1400 : now);
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
        background: "linear-gradient(#2b2350, #8a5787 60%, #f7d79b)",
        maskImage: "linear-gradient(180deg,#000 87%,transparent 100%)",
        WebkitMaskImage: "linear-gradient(180deg,#000 87%,transparent 100%)",
      }}
    />
  );
}
