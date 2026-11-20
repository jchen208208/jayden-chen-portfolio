"use client";

import type { CSSProperties } from "react";
import type { TimelineStage } from "@/lib/sparcTimeline";
import { NOTES, Sprite } from "./Sprite";
import type { Stages } from "./useStages";

/**
 * Each LED's colour, the way SPARC's firmware colours its strip
 * (`barColour` in `sketch_esp_hid_v2`): one hue running from a light shade
 * on the first LED to a dark shade on the last. Here the hue is the theme's
 * light — lightened toward white over the first half, then full strength in
 * the middle, darkened toward black over the second — so the shades step
 * down evenly without going grey.
 */
function ledColour(i: number, n: number) {
  const t = n > 1 ? i / (n - 1) : 0;
  return t <= 0.5
    ? `color-mix(in srgb, var(--glow) ${Math.round(45 + 110 * t)}%, white)`
    : `color-mix(in srgb, var(--glow) ${Math.round(100 - 100 * (t - 0.5))}%, black)`;
}

/**
 * The build on SPARC's own LED strip: one LED per stage, lit up to the
 * chosen one in the device's own light-to-dark run. Moving plays the swipe
 * SPARC itself plays for next and previous — a run of light across the whole
 * strip, rightward going later and leftward going earlier — and a pair of
 * pixel music notes bobs over the chosen LED. A row on a wide screen, a 3×3
 * block on a phone.
 */
export function LedTimeline({ stages, s }: { stages: TimelineStage[]; s: Stages }) {
  const n = stages.length;

  return (
    <div className="tl-strip">
      <p className="tl-strip-silk font-screen" aria-hidden>
        <span>DIN →</span>
        <span>WS2812B × {n}</span>
      </p>
      <div className="tl-leds" {...s.trackProps}>
        {stages.map((st, i) => {
          // the swipe reaches each LED in turn from the side it starts on
          const order = s.dir > 0 ? i : n - 1 - i;
          return (
            <button
              key={st.tag}
              {...s.stopProps(i, `${st.date}: ${st.title}`)}
              className={`tl-led-cell${i < s.index ? " tl-past" : ""}${i === s.index ? " tl-here" : ""}`}
              style={{ "--led": ledColour(i, n) } as CSSProperties}
            >
              <span className="tl-obj-slot" aria-hidden>
                {i === s.index && (
                  <span key={s.index} className="tl-obj">
                    <Sprite rows={NOTES} px={3} />
                  </span>
                )}
              </span>
              <span className="tl-led" aria-hidden>
                <span className="tl-led-die" />
                {s.moves > 0 && (
                  <span
                    key={s.moves}
                    className="tl-led-swipe"
                    style={{ animationDelay: `${order * 45}ms` }}
                  />
                )}
              </span>
              <span className="tl-led-label font-screen">
                <span className="tl-led-tag">{st.tag}</span>
                <span className="tl-led-mark">{st.mark}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
