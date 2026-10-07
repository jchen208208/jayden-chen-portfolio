/**
 * The PC's RGB fans, lit — in the PC tower's own coordinates (`DeskSvg` draws
 * it inside the tower's group), laid over the ink fans drawn there.
 *
 * The light fills each round fan's blade area — the band between its outer
 * ring and its hub — and the inside of each side-on fan beside it, in the
 * room's one light colour (`--glow`): a blurred halo under the lit shape
 * itself. Three effects, each a seamless loop (timing in globals.css):
 *
 *   spin    — a soft glow circles each fan, fading off along a long tail;
 *             seen edge-on, the side fans' light rides up and down with it
 *   wave    — bands of light roll across the case, left to right, without a
 *             break
 *   breathe — every fan slowly glows up to full and slowly dims away again
 *
 * `DeskScene` decides which is playing, if any — the fans switch themselves
 * on and off now and then, like the lamp, and the case's power button toggles
 * them. Only rendered while on, so off means no light at all.
 *
 * Every attribute is explicit because this sits inside `DeskSvg`'s outer
 * `<g stroke={INK} strokeWidth={2.4}>`.
 */

import type { SVGProps } from "react";

export type PcFanMode = "off" | "spin" | "wave" | "breathe";

const NEON = "var(--glow, #ffbe5c)";
const HALO_ID = "desk-pc-halo";
const SOFT_ID = "desk-pc-soft";
const WAVE_MASK_ID = "desk-pc-wave";
const WAVE_BANDS_ID = "desk-pc-wave-bands";
const SIDE_MASK_ID = "desk-pc-side";
const SIDE_BAND_ID = "desk-pc-side-band";

/** the fans as `DeskSvg` draws them: round ones facing us (ring r 26, hub
 *  r 7, both 2.4 lines), and the side-on ones beside each */
const FAN_CX = 573;
const FAN_ROWS = [482, 548, 614];
const SIDE = { x: 613, w: 19, h: 48, rx: 4 };
/** the lit band, just inside the ring's line and just outside the hub's */
const BAND_OUT = 24.6;
const BAND_IN = 8.4;
/** the wave's bands repeat this often across the case (its keyframes slide
 *  them by exactly this much per loop, so the loop has no seam) */
export const WAVE_PERIOD = 110;
/** each fan's spin starts a little behind the one above it */
const SPIN_LAG_S = 0.4;

const f = (n: number) => n.toFixed(2);
const at = (r: number, deg: number) => {
  const a = (deg * Math.PI) / 180;
  return `${f(r * Math.cos(a))} ${f(r * Math.sin(a))}`;
};

/** the whole band, centred on the origin (even-odd, so the hub stays dark) */
const BAND = `M${BAND_OUT} 0 A${BAND_OUT} ${BAND_OUT} 0 1 0 ${-BAND_OUT} 0 A${BAND_OUT} ${BAND_OUT} 0 1 0 ${BAND_OUT} 0 Z
  M${BAND_IN} 0 A${BAND_IN} ${BAND_IN} 0 1 1 ${-BAND_IN} 0 A${BAND_IN} ${BAND_IN} 0 1 1 ${BAND_IN} 0 Z`;

/** a slice of the band from `a0` to `a1` degrees (clockwise, from 3 o'clock) */
const slice = (a0: number, a1: number) =>
  `M${at(BAND_OUT, a0)} A${BAND_OUT} ${BAND_OUT} 0 0 1 ${at(BAND_OUT, a1)}
   L${at(BAND_IN, a1)} A${BAND_IN} ${BAND_IN} 0 0 0 ${at(BAND_IN, a0)} Z`;

/**
 * spin's glow, as thin slices of the band whose brightness eases up over the
 * leading few and fades away over a long tail behind — a smooth sweep rather
 * than a cut-out wedge, softened further by a blur. Slices overlap a hair so
 * no seam shows between them.
 */
const COMET_STEP = 8;
const COMET_SLICES = 34;
const COMET = Array.from({ length: COMET_SLICES }, (_, k) => {
  const lead = Math.min(1, (k + 1) / 4);
  const tail = (1 - k / COMET_SLICES) ** 1.8;
  return { d: slice(-(k + 1) * COMET_STEP - 0.8, -k * COMET_STEP), opacity: lead * tail };
});

/** a lit shape: its blurred halo, then the light itself */
function Lit({ d, opacity = 1 }: { d: string; opacity?: number }) {
  return (
    <g opacity={opacity}>
      <path d={d} fill={NEON} fillOpacity={0.5} fillRule="evenodd" filter={`url(#${HALO_ID})`} />
      <path d={d} fill={NEON} fillOpacity={0.75} fillRule="evenodd" />
    </g>
  );
}

/** the inside of the side-on fan in row `cy` */
function sideFan(cy: number) {
  const i = 2.4; // clear of its outline
  const x = SIDE.x + i;
  const y = cy - SIDE.h / 2 + i;
  const w = SIDE.w - i * 2;
  const h = SIDE.h - i * 2;
  const r = SIDE.rx - 1;
  return `M${x + r} ${y} H${x + w - r} Q${x + w} ${y} ${x + w} ${y + r} V${y + h - r}
    Q${x + w} ${y + h} ${x + w - r} ${y + h} H${x + r} Q${x} ${y + h} ${x} ${y + h - r}
    V${y + r} Q${x} ${y} ${x + r} ${y} Z`;
}

/** everything in row `cy`, lit full */
function Row({ cy }: { cy: number }) {
  return (
    <>
      <g transform={`translate(${FAN_CX} ${cy})`}>
        <Lit d={BAND} />
      </g>
      <Lit d={sideFan(cy)} />
    </>
  );
}

/** a soft fade from dark through light to dark, across x (or down y) */
function Bands({
  id,
  vertical = false,
  sharp = false,
  ...units
}: { id: string; vertical?: boolean; sharp?: boolean } & Omit<SVGProps<SVGLinearGradientElement>, "ref" | "id">) {
  return (
    <linearGradient id={id} x1={0} y1={0} x2={vertical ? 0 : 1} y2={vertical ? 1 : 0} {...units}>
      <stop offset="0%" stopColor="#000" />
      {/* a sharper peak, so the light reads as a band with a dim gap */}
      {sharp && <stop offset="25%" stopColor="#1c1c1c" />}
      <stop offset="50%" stopColor="#fff" />
      {sharp && <stop offset="75%" stopColor="#1c1c1c" />}
      <stop offset="100%" stopColor="#000" />
    </linearGradient>
  );
}

export default function PcFanLights({ mode }: { mode: PcFanMode }) {
  if (mode === "off") return null;
  return (
    <g className="pc-lights" stroke="none">
      <defs>
        <filter id={HALO_ID} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation={3} />
        </filter>
        <filter id={SOFT_ID} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={1.4} />
        </filter>

        {mode === "wave" && (
          <>
            {/* light, dark, light… repeating across the case, the whole
                pattern sliding right one period per loop (`pc-wave`) */}
            <Bands
              id={WAVE_BANDS_ID}
              sharp
              gradientUnits="userSpaceOnUse"
              x2={WAVE_PERIOD}
              spreadMethod="repeat"
            />
            <mask id={WAVE_MASK_ID} maskUnits="userSpaceOnUse" x={510} y={420} width={180} height={250}>
              <g className="pc-wave-band">
                <rect
                  x={510 - WAVE_PERIOD}
                  y={420}
                  width={180 + WAVE_PERIOD}
                  height={250}
                  fill={`url(#${WAVE_BANDS_ID})`}
                />
              </g>
            </mask>
          </>
        )}

        {mode === "spin" && (
          <>
            {/* each side fan's light, riding up and down its edge in step
                with its round fan's spin (`pc-side-spin`) */}
            <Bands id={SIDE_BAND_ID} vertical />
            <mask id={SIDE_MASK_ID} maskUnits="userSpaceOnUse" x={600} y={420} width={50} height={250}>
              {FAN_ROWS.map((cy, i) => (
                <g key={cy} className="pc-side-band" style={{ animationDelay: `${-i * SPIN_LAG_S}s` }}>
                  <rect
                    x={SIDE.x - 2}
                    y={cy - 16}
                    width={SIDE.w + 4}
                    height={32}
                    fill={`url(#${SIDE_BAND_ID})`}
                  />
                </g>
              ))}
            </mask>
          </>
        )}
      </defs>

      {mode === "spin" && (
        <>
          {FAN_ROWS.map((cy, i) => (
            <g key={cy} transform={`translate(${FAN_CX} ${cy})`}>
              <Lit d={BAND} opacity={0.14} />
              <g className="pc-spin" style={{ animationDelay: `${-i * SPIN_LAG_S}s` }}>
                <g filter={`url(#${HALO_ID})`} opacity={0.55}>
                  {COMET.map((c) => (
                    <path key={c.d} d={c.d} fill={NEON} fillOpacity={c.opacity} />
                  ))}
                </g>
                <g filter={`url(#${SOFT_ID})`} opacity={0.8}>
                  {COMET.map((c) => (
                    <path key={c.d} d={c.d} fill={NEON} fillOpacity={c.opacity} />
                  ))}
                </g>
              </g>
            </g>
          ))}
          <g opacity={0.14}>
            {FAN_ROWS.map((cy) => (
              <Lit key={cy} d={sideFan(cy)} />
            ))}
          </g>
          <g className="pc-masked" mask={`url(#${SIDE_MASK_ID})`}>
            {FAN_ROWS.map((cy) => (
              <Lit key={cy} d={sideFan(cy)} />
            ))}
          </g>
        </>
      )}

      {mode === "wave" && (
        <>
          <g opacity={0.15}>
            {FAN_ROWS.map((cy) => (
              <Row key={cy} cy={cy} />
            ))}
          </g>
          <g className="pc-masked" mask={`url(#${WAVE_MASK_ID})`}>
            {FAN_ROWS.map((cy) => (
              <Row key={cy} cy={cy} />
            ))}
          </g>
        </>
      )}

      {mode === "breathe" && (
        <g className="pc-breathe">
          {FAN_ROWS.map((cy) => (
            <Row key={cy} cy={cy} />
          ))}
        </g>
      )}
    </g>
  );
}
