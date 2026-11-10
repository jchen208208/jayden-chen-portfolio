import { FANS } from "./pixel/deskArt";

/**
 * The PC's RGB fans, lit — laid over the pixel desk's fans. `DeskSvg` draws
 * this inside its art-pixel group, so every coordinate here is a pixel, and
 * each LED is a block of whole pixels (`FANS`, from the desk's generator).
 *
 * Each round fan's blade band is a ring of eight solid LEDs with dark gaps
 * between them, and the side-on fan beside it is four LEDs stacked up its
 * edge. One LED is lit at a time with three behind it, dimming down the
 * light's own ramp (`--glow-pale` → `--glow` → `--glow-deep` →
 * `--glow-bronze`; unlit ones sit in `--screen-deep`), and the light ticks
 * round an LED at a time — each fan a tick behind the one above. The side
 * fans show that same ring seen edge-on: each stacked LED takes the brightest
 * of the ring LEDs level with it.
 *
 * All solid — no blur, no fades, nothing see-through — and every change is a
 * hard tick: `step-end` keyframes, written below from the same model as the
 * first frame, so the side fans can't drift out of step with the rings. With
 * reduced motion the keyframes are off (globals.css) and each LED holds that
 * first frame.
 *
 * `DeskScene` switches them on and off — the case's power button, and now and
 * then by themselves, like the lamp. Only rendered while on, so off means no
 * light at all.
 */

/** LEDs per ring, and stacked up each side-on fan */
const LEDS = FANS.ring.length;
const STACK = FANS.stack.length;
/** the stack, in pixels: half its height, each LED's height, the gap
 *  between them */
const STACK_HALF = 5.5;
const STACK_H = 2;
const STACK_GAP = 1;
/** how long the light rests on each LED */
const TICK_MS = 220;

/** unlit, then dimmest to hottest */
const SHADES = [
  "var(--screen-deep, #1a1106)",
  "var(--glow-bronze, #8f7442)",
  "var(--glow-deep, #c18a2e)",
  "var(--glow, #ffbe5c)",
  "var(--glow-pale, #ffe3b0)",
];
/** the lit LED, then the three behind it */
const TRAIL = [4, 3, 2, 1];

const mod = (n: number, m: number) => ((n % m) + m) % m;
const f = (n: number) => n.toFixed(2);

/** ring LED `k`'s shade while the light is on LED `head` */
const ringShade = (k: number, head: number) => TRAIL[mod(head - k, LEDS)] ?? 0;

/** which stacked LED each ring LED is level with, seen edge-on — by the
 *  height of its middle */
const LEVEL_OF = Array.from({ length: LEDS }, (_, k) => {
  const y = Math.sin(((k + 0.5) * 2 * Math.PI) / LEDS) * STACK_HALF;
  const level = Math.floor((y + STACK_HALF + STACK_GAP / 2) / (STACK_H + STACK_GAP));
  return Math.min(STACK - 1, Math.max(0, level));
});

/** stacked LED `s`'s shade while the light is on ring LED `head` */
const stackShade = (s: number, head: number) =>
  Math.max(0, ...LEVEL_OF.map((level, k) => (level === s ? ringShade(k, head) : 0)));

/** a loop of shades, one per tick, as hard-stepped fill keyframes */
const keyframes = (name: string, shadeAt: (head: number) => number) =>
  `@keyframes ${name}{${Array.from(
    { length: LEDS },
    (_, head) => `${f((head * 100) / LEDS)}%{fill:${SHADES[shadeAt(head)]}}`,
  ).join("")}}`;

/** every ring LED runs `pc-led` (ring LED 0's loop), started as far round as
 *  it sits; each stacked LED runs its own loop. Play state is left alone, so
 *  globals.css can pause them while a section covers the desk. */
const CSS = [
  keyframes("pc-led", (head) => ringShade(0, head)),
  ...Array.from({ length: STACK }, (_, s) => keyframes(`pc-led-stack-${s}`, (head) => stackShade(s, head))),
  `.pc-led{animation-name:pc-led;animation-duration:${LEDS * TICK_MS}ms;` +
    `animation-timing-function:step-end;animation-iteration-count:infinite}`,
].join("");

export default function PcFanLights({ on }: { on: boolean }) {
  if (!on) return null;
  return (
    <g>
      <style>{CSS}</style>
      {FANS.at.map(([cx, cy], row) => {
        // where this fan's light starts — a tick behind the fan above
        const head = mod(-row, LEDS);
        return (
          <g key={cy} transform={`translate(${cx} ${cy})`}>
            {FANS.ring.map((d, k) => (
              <path
                key={k}
                className="pc-led"
                d={d}
                fill={SHADES[ringShade(k, head)]}
                style={{ animationDelay: `${-mod(head - k, LEDS) * TICK_MS}ms` }}
              />
            ))}
            {FANS.stack.map((d, s) => (
              <path
                key={`stack-${s}`}
                className="pc-led"
                d={d}
                fill={SHADES[stackShade(s, head)]}
                style={{ animationName: `pc-led-stack-${s}`, animationDelay: `${-head * TICK_MS}ms` }}
              />
            ))}
          </g>
        );
      })}
    </g>
  );
}
