"use client";

import { useEffect, useState } from "react";
import { mulberry32 } from "@/lib/svg";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

/**
 * Letters that spin like slot-machine reels, each flicking through random
 * characters, then come to rest one at a time in a random order — each
 * slowing down over its last stretch (`decelMs`) and landing on its own
 * character. The desk screens' names (`ScreenLabel`) spin like this as the
 * page loads; the Experience cards' dates spin each time one is hovered.
 *
 * Anything `fixed` matches (spaces and punctuation, by default) holds still —
 * it's the frame round the word, not part of it. In a monospaced face the
 * spinning never shifts the word's width. Reduced motion shows the word
 * straight away.
 */

export type ReelTiming = {
  /** the first letter lands this long after a spin starts… */
  firstLandMs: number;
  /** …and the last this much later; the rest are spread evenly between, in
   *  a random order */
  landWindowMs: number;
  /** nudges each landing off the even spacing so the rhythm isn't
   *  mechanical — kept under half the tightest spacing, so the order never
   *  changes */
  jitterMs: number;
  /** how often a spinning letter changes at full speed… */
  fastMs: number;
  /** …and just before it lands */
  slowMs: number;
  /** how long each letter takes to slow from one to the other */
  decelMs: number;
};

/** the desk screens' spin, as the page loads */
export const SCREEN_REEL: ReelTiming = {
  firstLandMs: 500,
  landWindowMs: 900,
  jitterMs: 40,
  fastMs: 45,
  slowMs: 220,
  decelMs: 500,
};

/** what the reels spin through */
const GLYPHS = "abcdefghijklmnopqrstuvwxyz0123456789#$%&*+=?";
/** what holds still unless told otherwise */
const FIXED = /[^a-z0-9]/i;

function pick(rnd: () => number, avoid: string) {
  let c = avoid;
  while (avoid.includes(c)) c = GLYPHS[Math.floor(rnd() * GLYPHS.length)];
  return c;
}

/** the same scramble of `word` every render, server and client alike */
function seededScramble(word: string, fixed: RegExp) {
  let seed = 0;
  for (const ch of word) seed = (seed * 31 + ch.charCodeAt(0)) | 0;
  const rnd = mulberry32(seed);
  return [...word].map((ch) => (fixed.test(ch) ? ch : pick(rnd, ch))).join("");
}

/**
 * `word` as it should be shown right now. A spin starts whenever `play`
 * changes to a new number above 0 — so `1` spins once on mount, and a counter
 * bumped on each hover spins every time.
 *
 * `startScrambled` renders a seeded scramble before the first spin rather
 * than the word, so a spin that plays on load doesn't flash the answer first
 * (the server renders the same scramble).
 */
export function useSlotReel(
  word: string,
  {
    play,
    startScrambled = false,
    timing = SCREEN_REEL,
    fixed = FIXED,
  }: { play: number; startScrambled?: boolean; timing?: ReelTiming; fixed?: RegExp },
) {
  const reduced = usePrefersReducedMotion();
  const [shown, setShown] = useState(() => (startScrambled ? seededScramble(word, fixed) : word));

  useEffect(() => {
    if (reduced || play <= 0) return;
    const { firstLandMs, landWindowMs, jitterMs, fastMs, slowMs, decelMs } = timing;
    const chars = [...seededScramble(word, fixed)];
    const spins = [...word].map((ch) => !fixed.test(ch));
    const reels = spins.flatMap((s, i) => (s ? [i] : []));
    const n = reels.length;

    // a random landing order, spread evenly across the window
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [reels[i], reels[j]] = [reels[j], reels[i]];
    }
    const land = new Array<number>(word.length).fill(0);
    reels.forEach((i, k) => {
      const even = n > 1 ? (k * landWindowMs) / (n - 1) : 0;
      land[i] = firstLandMs + even + (Math.random() * 2 - 1) * jitterMs;
    });
    const nextSwap = new Array<number>(word.length).fill(0);

    let start: number | null = null;
    let raf = 0;
    const frame = (ts: number) => {
      if (start === null) start = ts;
      const t = ts - start;
      let changed = false;
      let spinning = false;
      for (let i = 0; i < word.length; i++) {
        if (!spins[i] || t >= land[i]) {
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
        const p = Math.min(1, Math.max(0, (t - (land[i] - decelMs)) / decelMs));
        nextSwap[i] = t + fastMs + (slowMs - fastMs) * p * p;
      }
      if (changed) setShown(chars.join(""));
      if (spinning) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      // cut short, a spin settles on the word rather than freezing mid-reel
      setShown(word);
    };
  }, [word, play, reduced, timing, fixed]);

  return reduced ? word : shown;
}
