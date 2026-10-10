"use client";

import type { CSSProperties } from "react";
import { useSlotReel } from "@/hooks/useSlotReel";

/**
 * A desk screen's name — its route, `/projects` — lit amber on the glass.
 *
 * When the page loads the letters spin like slot-machine reels
 * (`useSlotReel`), each flicking through random characters. After half a
 * second they come to rest one at a time, in a random order, each slowing
 * down before it lands. The slash stays put — it's the path, not part of the
 * word. VT323 is monospaced, so the spinning never shifts the word's width.
 *
 * It starts on a seeded scramble rather than the word itself, so the first
 * frame — server-rendered — is already mid-spin instead of flashing the
 * answer first. Reduced motion shows the word straight away.
 */
export default function ScreenLabel({ route, style }: { route: string; style?: CSSProperties }) {
  const word = route.replace(/^\//, "");
  const shown = useSlotReel(word, { play: 1, startScrambled: true });

  return (
    <span className="screen-label font-screen leading-none" style={style}>
      /{shown}
    </span>
  );
}
