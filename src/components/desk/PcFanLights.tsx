/**
 * The PC's RGB fans, lit — in the PC tower's own coordinates (`DeskSvg` draws
 * it inside the tower's group), laid over the ink fans drawn there.
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
 *
 * Every attribute is explicit because this sits inside `DeskSvg`'s outer
 * `<g stroke={INK} strokeWidth={2.4}>`.
 */

/** the fans as `DeskSvg` draws them: round ones facing us (ring r 26, hub
 *  r 7), and the side-on ones beside each */
const FAN_CX = 573;
const FAN_ROWS = [482, 548, 614];
const SIDE = { x: 613, w: 19, h: 48 };

/** the ring: LEDs per fan, the dark gap between neighbours (degrees), and
 *  the band they fill — well clear of the fan's ring and hub lines */
const LEDS = 8;
const LED_GAP_DEG = 9;
const LED_IN = 10;
const LED_OUT = 23;
/** the side fan's stack: LEDs, the gap between them, and how far inside the
 *  fan's outline (its 2.4 line, plus a hair) */
const STACK = 4;
const STACK_GAP = 2;
const STACK_INSET = 3;
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
const at = (r: number, deg: number) => {
  const a = (deg * Math.PI) / 180;
  return `${f(r * Math.cos(a))} ${f(r * Math.sin(a))}`;
};

/** ring LED `k` (clockwise from 3 o'clock), centred on the origin */
const LED_PATHS = Array.from({ length: LEDS }, (_, k) => {
  const step = 360 / LEDS;
  const a0 = k * step + LED_GAP_DEG / 2;
  const a1 = (k + 1) * step - LED_GAP_DEG / 2;
  return `M${at(LED_OUT, a0)} A${LED_OUT} ${LED_OUT} 0 0 1 ${at(LED_OUT, a1)}
    L${at(LED_IN, a1)} A${LED_IN} ${LED_IN} 0 0 0 ${at(LED_IN, a0)} Z`;
});

/** the stack's box inside the side fan (y from its row's centre line), and
 *  each stacked LED's height */
const STACK_BOX = {
  x: SIDE.x + STACK_INSET,
  y: -SIDE.h / 2 + STACK_INSET,
  w: SIDE.w - STACK_INSET * 2,
  h: SIDE.h - STACK_INSET * 2,
};
const STACK_H = (STACK_BOX.h - STACK_GAP * (STACK - 1)) / STACK;

/** ring LED `k`'s shade while the light is on LED `head` */
const ringShade = (k: number, head: number) => TRAIL[mod(head - k, LEDS)] ?? 0;

/** which stacked LED each ring LED is level with, seen edge-on — by the
 *  height of its middle */
const LEVEL_OF = Array.from({ length: LEDS }, (_, k) => {
  const y = Math.sin(((k + 0.5) * 2 * Math.PI) / LEDS) * (STACK_BOX.h / 2);
  const level = Math.floor((y + STACK_BOX.h / 2 + STACK_GAP / 2) / (STACK_H + STACK_GAP));
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
    <g stroke="none">
      <style>{CSS}</style>
      {FAN_ROWS.map((cy, row) => {
        // where this fan's light starts — a tick behind the fan above
        const head = mod(-row, LEDS);
        return (
          <g key={cy}>
            <g transform={`translate(${FAN_CX} ${cy})`}>
              {LED_PATHS.map((d, k) => (
                <path
                  key={k}
                  className="pc-led"
                  d={d}
                  fill={SHADES[ringShade(k, head)]}
                  style={{ animationDelay: `${-mod(head - k, LEDS) * TICK_MS}ms` }}
                />
              ))}
            </g>
            {Array.from({ length: STACK }, (_, s) => (
              <rect
                key={s}
                className="pc-led"
                x={STACK_BOX.x}
                y={f(cy + STACK_BOX.y + s * (STACK_H + STACK_GAP))}
                width={STACK_BOX.w}
                height={f(STACK_H)}
                rx={1.5}
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
