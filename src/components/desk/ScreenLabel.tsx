"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { mulberry32 } from "@/lib/svg";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

/**
 * A desk screen's name — its route, `/projects` — lit amber on the glass.
 *
 * When the page loads the letters spin like slot-machine reels, each flicking
 * through random characters. After half a second they come to rest one at a
 * time, in a random order: each letter slows down over its last stretch
 * (`DECEL_MS`) and lands on its own character. The slash stays put — it's the
 * path, not part of the word. VT323 is monospaced, so the spinning never
 * shifts the word's width.
 *
 * It starts on a seeded scramble rather than the word itself, so the first
 * frame — server-rendered — is already mid-spin instead of flashing the
 * answer first. Reduced motion shows the word straight away.
 */

/** what the reels spin through */
const GLYPHS = "abcdefghijklmnopqrstuvwxyz0123456789#$%&*+=?";
/** the first letter lands this long after load… */
const FIRST_LAND_MS = 500;
/** …and the last this much later; the rest are spread evenly between, in a
 *  random order */
const LAND_WINDOW_MS = 900;
/** nudges each landing off the even spacing so the rhythm isn't mechanical —
 *  kept under half the tightest spacing, so the order never changes */
const LAND_JITTER_MS = 40;
/** how often a spinning letter changes at full speed… */
const FAST_MS = 45;
/** …and just before it lands */
const SLOW_MS = 220;
/** how long each letter takes to slow from one to the other */
const DECEL_MS = 500;

function pick(rnd: () => number, avoid: string) {
  let c = avoid;
  while (avoid.includes(c)) c = GLYPHS[Math.floor(rnd() * GLYPHS.length)];
  return c;
}

/** the same scramble of `word` every render, server and client alike */
function seededScramble(word: string) {
  let seed = 0;
  for (const ch of word) seed = (seed * 31 + ch.charCodeAt(0)) | 0;
  const rnd = mulberry32(seed);
  return [...word].map((ch) => pick(rnd, ch)).join("");
}

export default function ScreenLabel({ route, style }: { route: string; style?: CSSProperties }) {
  const word = route.replace(/^\//, "");
  const reduced = usePrefersReducedMotion();
  const [shown, setShown] = useState(() => seededScramble(word));

  useEffect(() => {
    if (reduced) return;
    const n = word.length;
    const chars = [...seededScramble(word)];

    // a random landing order, spread evenly across the window
    const order = [...Array(n).keys()];
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    const land = new Array<number>(n);
    order.forEach((i, k) => {
      const even = n > 1 ? (k * LAND_WINDOW_MS) / (n - 1) : 0;
      land[i] = FIRST_LAND_MS + even + (Math.random() * 2 - 1) * LAND_JITTER_MS;
    });
    const nextSwap = new Array<number>(n).fill(0);

    let start: number | null = null;
    let raf = 0;
    const frame = (ts: number) => {
      if (start === null) start = ts;
      const t = ts - start;
      let changed = false;
      let spinning = false;
      for (let i = 0; i < n; i++) {
        if (t >= land[i]) {
          if (chars[i] !== word[i]) {
            chars[i] = word[i];
            changed = true;
          }
          continue;
        }
        spinning = true;
        if (t < nextSwap[i]) continue;
        // never its own letter while spinning, so the landing is what shows it
        chars[i] = pick(Math.random, chars[i] + word[i]);
        changed = true;
        const p = Math.min(1, Math.max(0, (t - (land[i] - DECEL_MS)) / DECEL_MS));
        nextSwap[i] = t + FAST_MS + (SLOW_MS - FAST_MS) * p * p;
      }
      if (changed) setShown(chars.join(""));
      if (spinning) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [word, reduced]);

  return (
    <span className="screen-label font-screen leading-none" style={style}>
      /{reduced ? word : shown}
    </span>
  );
}
