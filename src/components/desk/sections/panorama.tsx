"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import densityMap from "@/assets/experience/shanghai-density.png";

/**
 * Experience's backdrop: Shanghai's Bund skyline at night along the bottom
 * of the view, edge to edge — the Oriental Pearl Tower on the left, the
 * Shanghai Tower on the right, the moon beside it — drawn as a field of
 * small amber dots, dimmed (not cut) under the column of roles so the text
 * stays readable. After matthewhamilton.dev's dotted mountains, minus their
 * cursor glow: this is drawn once (and again if the window is resized) and
 * then just sits there — no pointer listeners, nothing redrawn per frame.
 *
 * The picture is a density map (`shanghai-density.png`, grey = how many
 * dots, black = sky), built offline from `designs/reference/
 * experience_background.jpg`: cropped from the Pearl Tower's spire down to
 * the waterline, the sky cut out (each pixel compared with the sky's own
 * colour at that height, so the Shanghai Tower's blue glass survives), and
 * each building's brightness turned into density, with a floor so dark
 * facades still read as a silhouette. It's drawn at its own proportions —
 * the window's full width, standing on the bottom edge, squashed a little
 * rather than cropped when the view is too short for all of it — and
 * sampled on an even
 * lattice, each point kept or dropped by an 8×8 Bayer matrix, so the tones
 * come out as an ordered dither. Denser stretches also draw their dots
 * brighter, so lit facades stand out.
 *
 * It rises in from the bottom edge once it's drawn (`.panorama` in
 * globals.css). Phones don't get it: the column is the whole width there.
 */

/** px between dots */
const STEP = 4;
/** a dot's radius, px */
const DOT = 0.95;
/** how many brightness levels the dots share — each is one path, one fill */
const LEVELS = 8;

const BAYER = [
  0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60,
  28, 52, 20, 62, 30, 54, 22, 3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47,
  7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21,
];

type Tones = { data: Uint8ClampedArray; w: number; h: number };

/** the map's grey values, one byte a pixel */
async function readTones(src: string): Promise<Tones> {
  const img = new Image();
  img.src = src;
  await img.decode();
  const c = document.createElement("canvas");
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("no 2d context");
  ctx.drawImage(img, 0, 0);
  const rgba = ctx.getImageData(0, 0, c.width, c.height).data;
  const data = new Uint8ClampedArray(c.width * c.height);
  for (let i = 0; i < data.length; i++) data[i] = rgba[i * 4];
  return { data, w: c.width, h: c.height };
}

function draw(canvas: HTMLCanvasElement, tones: Tones) {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (!w || !h) return false;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  const ctx = canvas.getContext("2d");
  if (!ctx) return false;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  // the map's own proportions: the full width, standing on the bottom edge.
  // Nothing is ever cropped — a view too short for its full height squashes
  // it a little instead, so the Pearl Tower keeps its spire.
  const sx = w / tones.w;
  const sy = Math.min(sx, h / tones.h);
  const top = h - tones.h * sy;

  const paths = Array.from({ length: LEVELS }, () => new Path2D());
  for (let j = 0; j * STEP < h; j++) {
    const cy = j * STEP + STEP / 2;
    const my = Math.floor((cy - top) / sy);
    if (my < 0) continue;
    const row = Math.min(tones.h - 1, my) * tones.w;
    for (let i = 0; i * STEP < w; i++) {
      const cx = i * STEP + STEP / 2;
      const v = tones.data[row + Math.min(tones.w - 1, Math.floor(cx / sx))] / 255;
      if (v <= (BAYER[(j % 8) * 8 + (i % 8)] + 0.5) / 64) continue;
      const p = paths[Math.min(LEVELS - 1, Math.floor(v * LEVELS))];
      p.moveTo(cx + DOT, cy);
      p.arc(cx, cy, DOT, 0, Math.PI * 2);
    }
  }
  ctx.fillStyle =
    getComputedStyle(document.documentElement).getPropertyValue("--glow").trim() || "#ffbe5c";
  paths.forEach((p, k) => {
    // a faint dot where the map is thin, a full one where it's dense
    ctx.globalAlpha = 0.3 + 0.7 * ((k + 0.5) / LEVELS);
    ctx.fill(p);
  });
  return true;
}

export function Panorama() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let tones: Tones | null = null;
    let timer = 0;
    let gone = false;
    const redraw = () => {
      if (tones && draw(canvas, tones)) setDrawn(true);
    };
    readTones(densityMap.src)
      .then((t) => {
        if (gone) return;
        tones = t;
        redraw();
      })
      .catch(() => {});
    // a resize redraws once it's settled, not on every step of the drag
    const ro = new ResizeObserver(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(redraw, 150);
    });
    ro.observe(canvas);
    // the dots are painted in the glow, so a new theme repaints them
    const mo = new MutationObserver(redraw);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => {
      gone = true;
      ro.disconnect();
      mo.disconnect();
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      data-drawn={drawn || undefined}
      className="panorama"
      // the CSS sizes the canvas to the map's proportions
      style={{ "--map-aspect": densityMap.width / densityMap.height } as CSSProperties}
    />
  );
}
