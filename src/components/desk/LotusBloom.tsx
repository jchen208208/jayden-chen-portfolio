"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { LOTUS_FRAMES, LOTUS_H, LOTUS_W } from "./lotusFrames";

/**
 * A pixel-art lotus on a still pond, beside the sign-off under the desk,
 * that blooms as the sign-off arrives: eight frames (`lotusFrames`, drawn by
 * `scripts/lotus.mjs`) from a closed bud to the open flower, played once the
 * sign-off has risen fully into view. When it fades away again (scrolling
 * back up to the desk), the flower closes back into its bud, ready to bloom
 * the next time.
 *
 * The petals take the theme's glow shades — a pink lotus on the pink theme,
 * a golden one on amber — and the pads, stem and water fixed greys. Canvas
 * can't read CSS variables, so the shades are read off `<html>` and re-read
 * whenever the theme bar changes them. The canvas holds the art at its own
 * size and CSS scales it up with `image-rendering: pixelated`, so every pixel
 * stays crisp. Under `prefers-reduced-motion` it's simply the open flower.
 */

/** how many screen px each of the art's pixels takes */
const SCALE = 4;
/** how long each frame holds before the next, in ms: slow to stir, quicker
 *  through the middle, settling slowly into the open flower */
const HOLDS = [320, 220, 170, 150, 160, 200, 260];
/** the sign-off's opacity (`DeskStage` fades it in as it rises) at which it
 *  counts as arrived, and below which it counts as gone */
const ARRIVED = 0.9;
const GONE = 0.05;

type Rgb = [number, number, number];

/** the pond's greys, light → darkest */
const GREYS: Record<string, Rgb> = {
  a: [0x9c, 0x9c, 0xa2],
  b: [0x5a, 0x5a, 0x60],
  c: [0x3a, 0x3a, 0x40],
  e: [0x26, 0x26, 0x2b],
};

const FALLBACK: Record<string, Rgb> = {
  "--glow-pale": [0xff, 0xe3, 0xb0],
  "--glow": [0xff, 0xbe, 0x5c],
  "--glow-deep": [0xc1, 0x8a, 0x2e],
  "--glow-bronze": [0x8f, 0x74, 0x42],
};

/** a `#rrggbb` token off `<html>`, as RGB */
function readToken(name: string): Rgb {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const m = /^#([0-9a-f]{6})$/i.exec(raw);
  if (!m) return FALLBACK[name];
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** the art's letters as colours: the petals pale → glow → deep → bronze in
 *  the theme's shades, the rest greys */
function readPalette(): Record<string, Rgb> {
  const pale = readToken("--glow-pale");
  const glow = readToken("--glow");
  const half: Rgb = [0, 1, 2].map((i) => Math.round((pale[i] + glow[i]) / 2)) as Rgb;
  return {
    v: pale,
    w: half,
    x: glow,
    y: readToken("--glow-deep"),
    z: readToken("--glow-bronze"),
    ...GREYS,
  };
}

/** every frame as pixels, in the given colours */
function paint(palette: Record<string, Rgb>) {
  return LOTUS_FRAMES.map((rows) => {
    const img = new ImageData(LOTUS_W, LOTUS_H);
    rows.forEach((row, y) => {
      for (let x = 0; x < LOTUS_W; x++) {
        const rgb = palette[row[x]];
        if (!rgb) continue;
        const at = (y * LOTUS_W + x) * 4;
        img.data[at] = rgb[0];
        img.data[at + 1] = rgb[1];
        img.data[at + 2] = rgb[2];
        img.data[at + 3] = 255;
      }
    });
    return img;
  });
}

export default function LotusBloom({ className = "", style }: { className?: string; style?: CSSProperties }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const last = LOTUS_FRAMES.length - 1;

    let images = paint(readPalette());
    let frame = reduced ? last : 0;
    let timer = 0;
    let raf = 0;
    const show = () => ctx.putImageData(images[frame], 0, 0);
    show();

    // the theme bar swaps the glow's shades on <html>
    const mo = new MutationObserver(() => {
      images = paint(readPalette());
      show();
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    if (reduced) return () => mo.disconnect();

    /** play on from the current frame to the open flower */
    const bloom = () => {
      if (frame >= last) {
        timer = 0;
        return;
      }
      timer = window.setTimeout(() => {
        frame++;
        show();
        bloom();
      }, HOLDS[frame]);
    };

    // the sign-off's own opacity says whether it's arrived or gone
    const section = canvas.closest("section");
    const check = () => {
      raf = 0;
      const shown = Number(section?.style.opacity || 0);
      if (shown >= ARRIVED && frame === 0 && !timer) bloom();
      else if (shown <= GONE && (frame > 0 || timer)) {
        window.clearTimeout(timer);
        timer = 0;
        frame = 0;
        show();
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      mo.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [reduced]);

  return (
    <canvas
      ref={ref}
      width={LOTUS_W}
      height={LOTUS_H}
      aria-hidden
      className={`pointer-events-none [image-rendering:pixelated] ${className}`}
      style={{ width: LOTUS_W * SCALE, height: LOTUS_H * SCALE, ...style }}
    />
  );
}
