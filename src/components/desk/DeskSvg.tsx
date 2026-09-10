import { DESK_VIEWBOX } from "@/lib/desk";

/**
 * "The Desk" — an outline trace of Jayden's hand sketch
 * (`designs/reference/reference2.png`), drawn in the flat clean-line style of
 * `designs/reference/reference_image.jpg`.
 *
 * Line art only, no fills / colour yet. One light ink stroke on the black page.
 *
 * Composition, left to right:
 *   - a floor-standing 3D printer immediately left of the desk (feet level with
 *     the desk legs), a soldering station resting on top of it
 *   - the desk: a slab top on two splayed trestle legs, overhanging each end
 *   - a rolling office chair in front, dead centre
 *   - a desktop PC tower with three RGB fans tucked under the desk on the left
 *   - on the desk: a cactus, then four screens — a landscape monitor, a laptop,
 *     a larger laptop, a portrait monitor
 *   - behind screens 1 & 2: a wall shelf — pegboard of tools on the left half
 *     (scissors, screwdriver, pliers, a row of jumper wires), a three-tier
 *     bookshelf on the right half
 *   - between screens 3 & 4: an architect's desk lamp on a tall pole
 *   - a tall leafy plant to the right of the desk
 *
 * Screens / clickable overlay are added back on top of this once the linework
 * reads right.
 */

const INK = "var(--ink, #f4f6f8)";

/** a monitor / laptop screen: outer bezel + inset glass */
function Screen({
  x,
  y,
  w,
  h,
  r = 8,
  inset = 10,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  r?: number;
  inset?: number;
}) {
  return (
    <>
      <rect x={x} y={y} width={w} height={h} rx={r} />
      <rect
        x={x + inset}
        y={y + inset}
        width={w - inset * 2}
        height={h - inset * 2}
        rx={Math.max(2, r - 4)}
      />
    </>
  );
}

/** one chair caster: a little wheel on a fork */
function Caster({ x, y }: { x: number; y: number }) {
  return (
    <>
      <line x1={x} y1={y - 12} x2={x} y2={y - 3} />
      <ellipse cx={x} cy={y} rx={11} ry={8} />
    </>
  );
}

export default function DeskSvg({ className }: { className?: string }) {
  const { w, h } = DESK_VIEWBOX;

  const FLOOR = 662;
  const DESK_TOP = 396; // top surface of the desktop
  const DESK_APRON = 428; // bottom of the front skirt
  const DESK_L = 292;
  const DESK_R = 1312;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={className}
      aria-hidden
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
    >
      <g
        fill="none"
        stroke={INK}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* ── floor ─────────────────────────────────────────────────────── */}
        <line x1={36} y1={FLOOR} x2={1564} y2={FLOOR} opacity={0.35} />

        {/* ── wall shelf, behind screens 1 & 2 ──────────────────────────── */}
        <g>
          {/* backboard */}
          <rect x={430} y={96} width={282} height={150} rx={4} />
          {/* divider: pegboard (left) vs bookshelf (right) */}
          <line x1={566} y1={96} x2={566} y2={246} />
          {/* shelf board it all sits on */}
          <line x1={414} y1={246} x2={728} y2={246} />
          <line x1={430} y1={254} x2={712} y2={254} />
          <line x1={458} y1={254} x2={458} y2={266} />
          <line x1={684} y1={254} x2={684} y2={266} />

          {/* pegboard — faint peg grid */}
          <g opacity={0.26}>
            {[444, 466, 488, 510, 532, 554].map((px) =>
              [114, 136, 158, 180, 202, 224].map((py) => (
                <circle key={`${px}-${py}`} cx={px} cy={py} r={1.6} />
              )),
            )}
          </g>
          {/* scissors */}
          <line x1={452} y1={196} x2={472} y2={158} />
          <line x1={472} y1={196} x2={452} y2={158} />
          <circle cx={449} cy={200} r={6} />
          <circle cx={475} cy={200} r={6} />
          <circle cx={462} cy={176} r={2} />
          {/* screwdriver */}
          <rect x={492} y={112} width={12} height={22} rx={4} />
          <line x1={498} y1={134} x2={498} y2={186} />
          {/* pliers */}
          <path d="M520 194 L526 156 M534 194 L528 156" />
          <path d="M526 156 Q528 146 532 148 Q535 150 534 156" />
          {/* row of jumper wires */}
          {[512, 520, 528, 536].map((px) => (
            <path
              key={px}
              d={`M${px} 138 L${px} 190 Q${px} 198 ${px + 5} 198`}
            />
          ))}

          {/* bookshelf — three tiers with books */}
          <line x1={566} y1={140} x2={712} y2={140} />
          <line x1={566} y1={186} x2={712} y2={186} />
          <line x1={566} y1={232} x2={712} y2={232} />
          {/* top tier */}
          <rect x={578} y={104} width={12} height={36} />
          <rect x={592} y={108} width={11} height={32} />
          <path d="M610 140 L606 106 L618 104 L622 138 Z" />
          <rect x={632} y={110} width={13} height={30} />
          <rect x={648} y={106} width={12} height={34} />
          {/* middle tier */}
          <rect x={578} y={152} width={13} height={34} />
          <rect x={593} y={148} width={12} height={38} />
          <rect x={607} y={154} width={12} height={32} />
          <path d="M626 186 L622 154 L634 152 L638 184 Z" />
          <rect x={650} y={150} width={13} height={36} />
          {/* bottom tier */}
          <rect x={578} y={198} width={12} height={34} />
          <rect x={592} y={194} width={14} height={38} />
          <rect x={608} y={200} width={12} height={32} />
          <rect x={622} y={196} width={13} height={36} />
          <path d="M642 232 L662 230 L664 198 L644 200 Z" />
        </g>

        {/* ── architect lamp, between screens 3 & 4 ─────────────────────── */}
        <g>
          {/* clamp foot behind the desk */}
          <path d={`M1006 ${DESK_TOP} h40 v-14 h-40 z`} />
          {/* tall pole */}
          <line x1={1026} y1={DESK_TOP - 14} x2={1026} y2={44} />
          {/* upper arm out to the shade */}
          <line x1={1026} y1={96} x2={914} y2={66} />
          <circle cx={1026} cy={96} r={4} />
          <circle cx={914} cy={66} r={4} />
          {/* cone shade, tilted down-left */}
          <path d="M914 66 L872 80 L892 130 L958 108 Z" />
          <line x1={892} y1={130} x2={902} y2={142} />
        </g>

        {/* ── tall plant, right of the desk ─────────────────────────────── */}
        <g>
          {/* leafy canopy — one lumpy outline */}
          <path
            d="M1452 430
               C1388 428 1368 366 1410 332
               C1376 306 1388 250 1432 236
               C1424 186 1474 150 1522 168
               C1548 132 1612 138 1634 178
               C1680 188 1692 250 1654 282
               C1682 318 1666 374 1622 386
               C1622 434 1566 462 1520 440
               C1494 470 1466 462 1452 430 Z"
          />
          {/* a leafy offshoot reaching toward the monitor */}
          <path d="M1392 344 Q1350 336 1322 320" />
          <path d="M1322 320 Q1310 306 1326 300 Q1338 312 1336 326 Q1330 328 1322 320 Z" />
          {/* stems */}
          <line x1={1508} y1={452} x2={1504} y2={540} />
          <line x1={1532} y1={452} x2={1536} y2={540} />
          {/* pot */}
          <path d="M1470 540 L1572 540 L1556 646 L1486 646 Z" />
          <line x1={1462} y1={540} x2={1580} y2={540} />
          <line x1={1468} y1={562} x2={1574} y2={562} />
        </g>

        {/* ── 3D printer, immediately left of the desk ──────────────────── */}
        <g>
          {/* electronics base + Y bed */}
          <rect x={74} y={556} width={184} height={96} rx={3} />
          <line x1={90} y1={548} x2={252} y2={548} />
          <line x1={112} y1={556} x2={112} y2={548} />
          <line x1={232} y1={556} x2={232} y2={548} />
          {/* control box + knob */}
          <rect x={214} y={590} width={44} height={30} rx={3} />
          <circle cx={248} cy={605} r={6} />
          {/* upright gantry */}
          <path d="M108 556 L108 412 L232 412 L232 556" />
          <line x1={96} y1={412} x2={244} y2={412} />
          {/* X carriage + extruder */}
          <line x1={108} y1={492} x2={232} y2={492} />
          <rect x={155} y={492} width={30} height={26} rx={2} />
          <path d="M161 518 L179 518 L170 532 Z" />
          {/* print bed */}
          <line x1={100} y1={534} x2={240} y2={534} />
          <line x1={100} y1={540} x2={240} y2={540} />
          {/* filament spool, side-mounted on the gantry */}
          <circle cx={214} cy={392} r={18} />
          <circle cx={214} cy={392} r={5} />
          <line x1={214} y1={410} x2={214} y2={412} />
          <path d="M214 392 Q206 432 176 492" opacity={0.7} />
          {/* feet */}
          <line x1={92} y1={652} x2={92} y2={662} />
          <line x1={240} y1={652} x2={240} y2={662} />
        </g>

        {/* ── soldering station, resting on top of the 3D printer ───────── */}
        <g>
          {/* control unit sitting on the printer top bar */}
          <rect x={74} y={378} width={92} height={34} rx={4} />
          <circle cx={92} cy={395} r={7} />
          <line x1={132} y1={388} x2={152} y2={388} />
          <line x1={132} y1={396} x2={152} y2={396} />
          <line x1={132} y1={404} x2={152} y2={404} />
          {/* coiled iron holder + iron resting in it */}
          <path d="M150 378 C140 372 140 360 150 354 C160 360 160 372 150 378 Z" />
          <path d="M148 362 L196 336" />
          <rect
            x={186}
            y={322}
            width={22}
            height={11}
            rx={3}
            transform="rotate(-28 197 327)"
          />
        </g>

        {/* ── desk: slab top on splayed trestle legs ────────────────────── */}
        <g>
          {/* left trestle */}
          <line x1={452} y1={DESK_APRON} x2={414} y2={FLOOR} />
          <line x1={486} y1={DESK_APRON} x2={524} y2={FLOOR} />
          <line x1={432} y1={560} x2={506} y2={560} />
          <line x1={469} y1={DESK_APRON} x2={469} y2={FLOOR} opacity={0.35} />
          {/* right trestle — splaying out to the right */}
          <line x1={1150} y1={DESK_APRON} x2={1104} y2={FLOOR} />
          <line x1={1184} y1={DESK_APRON} x2={1276} y2={FLOOR} />
          <line x1={1128} y1={560} x2={1252} y2={560} />
          <line x1={1167} y1={DESK_APRON} x2={1190} y2={FLOOR} opacity={0.35} />

          {/* top slab: back edge sliver + front surface line + front face */}
          <line x1={302} y1={DESK_TOP - 8} x2={1304} y2={DESK_TOP - 9} opacity={0.4} />
          <path
            d={`M${DESK_L} ${DESK_TOP}
                C 640 ${DESK_TOP + 5}, 980 ${DESK_TOP + 5}, ${DESK_R} ${DESK_TOP}`}
          />
          <path
            d={`M${DESK_L} ${DESK_TOP}
                L ${DESK_L} ${DESK_APRON} L ${DESK_R} ${DESK_APRON} L ${DESK_R} ${DESK_TOP}`}
          />
          <line x1={DESK_L + 34} y1={DESK_APRON + 4} x2={DESK_R - 34} y2={DESK_APRON + 4} opacity={0.4} />
        </g>

        {/* ── PC tower under the desk, left side ────────────────────────── */}
        <g>
          <rect x={512} y={434} width={140} height={212} rx={4} />
          {/* glass side panel */}
          <rect x={520} y={442} width={96} height={196} rx={3} />
          {/* three RGB fans */}
          {[482, 540, 598].map((cy) => (
            <g key={cy}>
              <circle cx={568} cy={cy} r={25} />
              <circle cx={568} cy={cy} r={6} />
              <path d={`M568 ${cy - 25} A25 25 0 0 1 ${568 + 21} ${cy - 13}`} />
              <path d={`M568 ${cy + 25} A25 25 0 0 1 ${568 - 21} ${cy + 13}`} />
            </g>
          ))}
          {/* front I/O strip + power button */}
          <line x1={622} y1={448} x2={644} y2={448} />
          <line x1={622} y1={456} x2={644} y2={456} />
          <circle cx={633} cy={472} r={4} />
          {/* feet */}
          <line x1={520} y1={646} x2={520} y2={652} />
          <line x1={644} y1={646} x2={644} y2={652} />
        </g>

        {/* ── screen 1: landscape monitor ──────────────────────────────── */}
        <g>
          <Screen x={330} y={258} w={200} h={134} />
          <path d={`M410 392 L448 392 L452 ${DESK_TOP + 8} L406 ${DESK_TOP + 8} Z`} />
          <ellipse cx={429} cy={DESK_TOP + 10} rx={44} ry={5} />
        </g>

        {/* ── screen 2: laptop ─────────────────────────────────────────── */}
        <g>
          <Screen x={604} y={296} w={144} h={100} r={6} inset={8} />
          {/* keyboard deck */}
          <path d="M604 396 L748 396 L772 414 L580 414 Z" />
          <path d="M618 407 L734 407" opacity={0.5} />
        </g>

        {/* ── screen 3: larger laptop ──────────────────────────────────── */}
        <g>
          <Screen x={800} y={274} w={224} h={122} r={6} inset={10} />
          <path d="M800 396 L1024 396 L1052 416 L772 416 Z" />
          <path d="M814 408 L1010 408" opacity={0.5} />
        </g>

        {/* ── screen 4: portrait monitor ───────────────────────────────── */}
        <g>
          <Screen x={1052} y={138} w={180} h={254} r={8} inset={12} />
          <path d={`M1120 392 L1164 392 L1170 ${DESK_TOP + 8} L1114 ${DESK_TOP + 8} Z`} />
          <ellipse cx={1142} cy={DESK_TOP + 10} rx={50} ry={5} />
        </g>

        {/* ── cactus on the desk, left of screen 1 ─────────────────────── */}
        <g>
          <path d={`M256 ${DESK_TOP} L320 ${DESK_TOP} L312 356 L264 356 Z`} />
          <line x1={252} y1={356} x2={324} y2={356} />
          {/* body + two arms */}
          <path d="M280 356 L280 312 Q280 300 288 300 Q296 300 296 312 L296 396" />
          <path d="M280 340 Q264 340 264 324 L264 312" />
          <path d="M296 332 Q312 332 312 318 L312 308" />
        </g>

        {/* ── rolling office chair, front and centre ────────────────────── */}
        <g>
          {/* backrest — a discrete rounded panel */}
          <rect x={716} y={356} width={168} height={96} rx={28} />
          <path d="M736 372 Q800 360 864 372" opacity={0.4} />
          {/* connector post from backrest down to the seat */}
          <line x1={788} y1={452} x2={788} y2={470} />
          <line x1={812} y1={452} x2={812} y2={470} />
          {/* seat cushion — in front of the desk edge */}
          <path
            d="M688 478
               Q688 466 800 466
               Q912 466 912 478
               L912 502
               Q912 520 800 520
               Q688 520 688 502 Z"
          />
          {/* gas lift */}
          <line x1={791} y1={520} x2={791} y2={580} />
          <line x1={809} y1={520} x2={809} y2={580} />
          {/* five-star base + casters */}
          <line x1={800} y1={582} x2={700} y2={614} />
          <line x1={800} y1={582} x2={764} y2={624} />
          <line x1={800} y1={582} x2={840} y2={622} />
          <line x1={800} y1={582} x2={900} y2={610} />
          <Caster x={694} y={622} />
          <Caster x={762} y={634} />
          <Caster x={842} y={632} />
          <Caster x={906} y={618} />
        </g>
      </g>
    </svg>
  );
}
