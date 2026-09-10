"use client";

import { useEffect, useRef, useState } from "react";
import { buildPiece1Voxels, type Piece1Voxels } from "./scene1v";
import { loadTextures, TILE, WATER_FRAMES, type TexSet } from "./textures";
import { DX, DY, F_FRONT, F_RIGHT, F_TOP, T, drawVox, quad, sx, sy } from "./voxel";

/**
 * piece1 — the opening scene, rendered as a 3D voxel gorge on a <canvas> that
 * CSS-scales to full width. The sky, glows and every static block are painted
 * once to an offscreen buffer; each frame re-blits it and layers on the drifting
 * cloud cubes, the flowing waterfall + pool and the plunge-pool spray.
 *
 * Honours `prefers-reduced-motion`: one static frame, no rAF.
 */

function paintSky(
  g: CanvasRenderingContext2D,
  s: Piece1Voxels,
  W: number,
  H: number,
) {
  const grad = g.createLinearGradient(0, 0, 0, H);
  for (const [o, c] of s.skyStops) grad.addColorStop(o, c);
  g.fillStyle = grad;
  g.fillRect(0, 0, W, H);
  for (const gl of s.glows) {
    const rg = g.createRadialGradient(gl.x, gl.y, 0, gl.x, gl.y, gl.r);
    rg.addColorStop(0, gl.color);
    rg.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = rg;
    g.fillRect(gl.x - gl.r, gl.y - gl.r, gl.r * 2, gl.r * 2);
  }
}

function shade(color: string, k: number) {
  const m = color.match(/\d+/g)!.map(Number);
  const f = (v: number) =>
    Math.max(0, Math.min(255, Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k))));
  return `rgb(${f(m[0])},${f(m[1])},${f(m[2])})`;
}

function paintClouds(
  g: CanvasRenderingContext2D,
  s: Piece1Voxels,
  W: number,
  t: number,
) {
  const { mx, my, wy } = s.proj;
  for (const cloud of s.clouds) {
    const off = Math.round(t * cloud.drift * T) % (W + 400);
    const has = new Set(cloud.blocks.map((b) => `${b.x},${b.y},${b.z}`));
    // far blocks first
    const bs = [...cloud.blocks].sort((a, b) => b.z - a.z || a.y - b.y || a.x - b.x);
    for (const b of bs) {
      const X = sx(mx, b.x, b.z) + off;
      const Y = sy(my, wy, b.y, b.z);
      const topOpen = !has.has(`${b.x},${b.y + 1},${b.z}`);
      const rightOpen = !has.has(`${b.x + 1},${b.y},${b.z}`);
      for (const xx of [X - (W + 400), X, X + (W + 400)]) {
        if (xx > W + 40 || xx < -60) continue;
        if (rightOpen) {
          g.fillStyle = shade(cloud.color, -0.28);
          quad(g, xx + T, Y - T, xx + T + DX, Y - T - DY, xx + T + DX, Y - DY, xx + T, Y);
        }
        if (topOpen) {
          g.fillStyle = shade(cloud.color, 0.3);
          quad(g, xx, Y - T, xx + T, Y - T, xx + T + DX, Y - T - DY, xx + DX, Y - T - DY);
        }
        g.fillStyle = cloud.color;
        g.fillRect(xx, Y - T, T, T);
      }
    }
  }
}

function paintWater(
  g: CanvasRenderingContext2D,
  s: Piece1Voxels,
  tex: TexSet,
  frame: number,
) {
  const { mx, my, wy } = s.proj;
  const sYoff = frame * TILE;
  for (const v of s.water) {
    const X = sx(mx, v.x, v.z);
    const Y = sy(my, wy, v.y, v.z);
    if (v.f & F_RIGHT) {
      g.fillStyle = "rgba(46,78,148,0.82)";
      quad(g, X + T, Y - T, X + T + DX, Y - T - DY, X + T + DX, Y - DY, X + T, Y);
    }
    if (v.f & F_TOP) {
      g.fillStyle = "rgba(120,176,224,0.62)";
      quad(g, X, Y - T, X + T, Y - T, X + T + DX, Y - T - DY, X + DX, Y - T - DY);
    }
    if (v.f & F_FRONT) {
      g.drawImage(tex.water_still, 0, sYoff, TILE, TILE, X, Y - T, T, T);
      if (v.cell.bright) {
        g.fillStyle = `rgba(255,255,255,${v.cell.bright})`;
        g.fillRect(X, Y - T, T, T);
      }
    }
  }
}

function paintSpray(
  g: CanvasRenderingContext2D,
  s: Piece1Voxels,
  t: number,
) {
  for (const p of s.spray) {
    const a = 0.2 + 0.55 * (0.5 + 0.5 * Math.sin(t * 0.004 * p.rate + p.phase));
    const y = p.y - ((t * 0.02 * p.rate) % 44);
    g.fillStyle = `rgba(240,248,255,${a.toFixed(3)})`;
    g.fillRect(Math.round(p.x / 2) * 2, Math.round(y / 2) * 2, p.s, p.s);
  }
}

export default function PixelScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ar, setAr] = useState("620 / 1160");

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
      const s = buildPiece1Voxels();
      const W = s.canvasW;
      const H = s.canvasH;
      canvas.width = W;
      canvas.height = H;
      setAr(`${W} / ${H}`);

      const off = document.createElement("canvas");
      off.width = W;
      off.height = H;
      const og = off.getContext("2d")!;
      og.imageSmoothingEnabled = false;
      paintSky(og, s, W, H);
      for (const v of s.voxels) drawVox(og, tex, s.proj, v);

      ctx.imageSmoothingEnabled = false;

      const frame = (now: number) => {
        ctx.clearRect(0, 0, W, H);
        ctx.drawImage(off, 0, 0);
        paintClouds(ctx, s, W, reduce ? 0 : now);
        const wf = reduce ? 0 : Math.floor(now / 95) % WATER_FRAMES;
        paintWater(ctx, s, tex, wf);
        paintSpray(ctx, s, reduce ? 1400 : now);
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
      aria-hidden
      className="block w-full select-none"
      style={{
        imageRendering: "pixelated",
        aspectRatio: ar,
        background: "linear-gradient(#463a6f, #8f5391 55%, #f7d99e)",
        maskImage: "linear-gradient(180deg,#000 88%,transparent 100%)",
        WebkitMaskImage: "linear-gradient(180deg,#000 88%,transparent 100%)",
      }}
    />
  );
}
