import { DESK_VIEWBOX } from "@/lib/desk";

/**
 * "The Desk" — a clean-line trace of Jayden's setup, in the flat style of
 * `designs/reference/reference_image.jpg`. The hand sketch
 * (`designs/reference/reference2.png`) sets the composition; the shapes
 * themselves are drawn "properly" rather than copying its wobble.
 *
 * Outline only, no colour yet. Every object carries an opaque `PAPER` fill so
 * things in front actually block what's behind them — no false transparency.
 * Painted strictly back-to-front:
 *
 *   wall shelf → lamp pole → plant → 3D printer → desk → soldering station →
 *   cactus → four screens → PC tower → chair
 */

const INK = "var(--ink, #f4f6f8)";
const PAPER = "var(--paper, #000)";

/** a monitor / laptop screen: opaque bezel + inset glass */
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
      <rect x={x} y={y} width={w} height={h} rx={r} fill={PAPER} />
      <rect
        x={x + inset}
        y={y + inset}
        width={w - inset * 2}
        height={h - inset * 2}
        rx={Math.max(2, r - 4)}
        fill={PAPER}
      />
    </>
  );
}

/** one chair caster: a little wheel on a fork */
function Caster({ x, y }: { x: number; y: number }) {
  return (
    <>
      <line x1={x} y1={y - 12} x2={x} y2={y - 3} />
      <ellipse cx={x} cy={y} rx={10} ry={7} fill={PAPER} />
    </>
  );
}

export default function DeskSvg({ className }: { className?: string }) {
  const { w, h } = DESK_VIEWBOX;

  const FLOOR = 662;
  const DESK_TOP = 396; // top surface of the desktop
  const DESK_APRON = 430; // bottom of the front skirt
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
        <line x1={40} y1={FLOOR} x2={1560} y2={FLOOR} opacity={0.3} />

        {/* ── wall shelf, behind screens 1 & 2 ──────────────────────────── */}
        <g>
          {/* pegboard panel (left half) */}
          <rect x={420} y={100} width={160} height={146} rx={4} fill={PAPER} />
          <g opacity={0.22}>
            {[436, 458, 480, 502, 524, 546, 566].map((px) =>
              [116, 138, 160, 182, 204, 226].map((py) => (
                <circle key={`${px}-${py}`} cx={px} cy={py} r={1.5} />
              )),
            )}
          </g>
          {/* scissors */}
          <circle cx={444} cy={150} r={6} fill={PAPER} />
          <circle cx={456} cy={150} r={6} fill={PAPER} />
          <path d="M446 156 L462 198" />
          <path d="M454 156 L440 198" />
          <circle cx={450} cy={163} r={2.4} fill={PAPER} />
          {/* two screwdrivers */}
          <rect x={480} y={116} width={12} height={26} rx={5} fill={PAPER} />
          <line x1={486} y1={142} x2={486} y2={190} />
          <path d="M482 190 L490 190" />
          <rect x={498} y={118} width={12} height={24} rx={5} fill={PAPER} />
          <line x1={504} y1={142} x2={504} y2={184} />
          <path d="M501 184 L507 184 M504 184 l0 4" />
          {/* pliers */}
          <path d="M528 150 L524 196" />
          <path d="M536 150 L542 196" />
          <path d="M528 150 Q525 137 531 131 M536 150 Q539 137 533 131" />
          <path d="M531 131 Q532 127 534 131" />
          <circle cx={532} cy={150} r={2.4} fill={PAPER} />
          {/* coiled jumper wires hanging from a peg */}
          {[556, 562, 568].map((px, i) => (
            <path key={px} d={`M554 150 Q ${px} ${190 + i * 6} ${px + 8} 150`} />
          ))}

          {/* bookshelf carcass (right half) */}
          <rect x={584} y={100} width={140} height={146} rx={4} fill={PAPER} />
          <line x1={584} y1={148} x2={724} y2={148} />
          <line x1={584} y1={196} x2={724} y2={196} />
          {/* top tier */}
          <rect x={594} y={112} width={12} height={36} fill={PAPER} />
          <rect x={608} y={116} width={11} height={32} fill={PAPER} />
          <path d="M623 148 L627 114 L639 116 L636 148 Z" fill={PAPER} />
          <rect x={646} y={110} width={13} height={38} fill={PAPER} />
          <rect x={661} y={118} width={11} height={30} fill={PAPER} />
          {/* middle tier */}
          <rect x={594} y={158} width={13} height={38} fill={PAPER} />
          <rect x={609} y={154} width={12} height={42} fill={PAPER} />
          <rect x={623} y={160} width={12} height={36} fill={PAPER} />
          <path d="M639 196 L643 160 L655 162 L652 196 Z" fill={PAPER} />
          <rect x={659} y={156} width={13} height={40} fill={PAPER} />
          {/* bottom tier */}
          <rect x={594} y={206} width={12} height={40} fill={PAPER} />
          <rect x={608} y={202} width={14} height={44} fill={PAPER} />
          <rect x={624} y={208} width={12} height={38} fill={PAPER} />
          <path d="M654 246 L672 242 L668 206 L650 210 Z" fill={PAPER} />
        </g>

        {/* ── plant, to the right of the desk ───────────────────────────── */}
        <g>
          {/* stems */}
          <line x1={1454} y1={452} x2={1450} y2={548} />
          <line x1={1478} y1={452} x2={1482} y2={548} />
          {/* pot (opaque) */}
          <path d="M1420 548 L1520 548 L1504 650 L1436 650 Z" fill={PAPER} />
          <rect x={1412} y={538} width={116} height={14} rx={3} fill={PAPER} />
          <line x1={1420} y1={566} x2={1520} y2={566} opacity={0.4} />
          {/* leafy canopy (opaque, tidy lumpy outline) */}
          <path
            d="M1452 452
               C1412 452 1392 412 1414 386
               C1392 360 1402 322 1436 312
               C1428 274 1466 248 1506 258
               C1520 230 1568 230 1582 258
               C1620 250 1648 288 1630 320
               C1652 346 1642 388 1608 396
               C1604 434 1560 454 1528 440
               C1506 460 1472 460 1452 452 Z"
            fill={PAPER}
          />
          {/* a small offshoot reaching toward the monitor */}
          <path d="M1418 360 Q1378 352 1352 336" />
          <path d="M1352 336 Q1340 322 1356 316 Q1368 328 1366 342 Q1360 344 1352 336 Z" />
        </g>

        {/* ── 3D printer, immediately left of the desk ──────────────────── */}
        <g>
          {/* electronics base (opaque) */}
          <rect x={74} y={566} width={188} height={86} rx={5} fill={PAPER} />
          <path d="M88 652 v8 M248 652 v8" />
          {/* moving Y bed on top of the base */}
          <rect x={92} y={554} width={152} height={12} rx={2} fill={PAPER} />
          {/* control screen + knob on the base */}
          <rect x={208} y={598} width={48} height={30} rx={3} fill={PAPER} />
          <circle cx={244} cy={613} r={6} />
          {/* upright gantry (open frame) */}
          <path d="M106 554 L106 330 L234 330 L234 554" />
          <line x1={94} y1={330} x2={246} y2={330} />
          {/* X rail + print head (head opaque) + part-cooling fan */}
          <line x1={106} y1={424} x2={234} y2={424} />
          <rect x={150} y={420} width={34} height={28} rx={3} fill={PAPER} />
          <rect x={136} y={424} width={14} height={18} rx={2} fill={PAPER} />
          <path d="M159 448 L175 448 L167 462 Z" fill={PAPER} />
          {/* print surface on the bed */}
          <line x1={98} y1={548} x2={246} y2={548} />
          <line x1={98} y1={554} x2={246} y2={554} />
          {/* filament spool on a top mount (opaque) */}
          <line x1={128} y1={330} x2={128} y2={318} />
          <circle cx={128} cy={304} r={16} fill={PAPER} />
          <circle cx={128} cy={304} r={4} />
          <path d="M128 320 Q124 372 160 420" opacity={0.6} />
        </g>

        {/* ── desk: a slab on two splayed trestle legs ──────────────────── */}
        <g>
          {/* legs (behind the apron) */}
          <path d="M444 430 L458 430 L426 662 L410 662 Z" fill={PAPER} />
          <path d="M480 430 L494 430 L526 662 L510 662 Z" fill={PAPER} />
          <rect x={430} y={556} width={80} height={9} fill={PAPER} />
          <path d="M1128 430 L1142 430 L1102 662 L1086 662 Z" fill={PAPER} />
          <path d="M1164 430 L1178 430 L1276 662 L1260 662 Z" fill={PAPER} />
          <rect x={1120} y={556} width={132} height={9} fill={PAPER} />

          {/* front skirt (opaque) */}
          <rect x={DESK_L} y={DESK_TOP} width={DESK_R - DESK_L} height={DESK_APRON - DESK_TOP} fill={PAPER} />
          {/* top slab, a shallow perspective sliver (opaque) */}
          <path d={`M${DESK_L} ${DESK_TOP} L${DESK_R} ${DESK_TOP} L${DESK_R - 12} ${DESK_TOP - 16} L${DESK_L + 12} ${DESK_TOP - 16} Z`} fill={PAPER} />
          <line x1={DESK_L + 6} y1={DESK_APRON - 4} x2={DESK_R - 6} y2={DESK_APRON - 4} opacity={0.3} />
        </g>

        {/* ── soldering station, sitting on top of the 3D printer ───────── */}
        <g>
          {/* station body (opaque) — rests on the printer's top crossbar */}
          <rect x={150} y={298} width={104} height={32} rx={5} fill={PAPER} />
          <circle cx={168} cy={314} r={7} />
          <rect x={190} y={306} width={44} height={16} rx={2} fill={PAPER} />
          <line x1={198} y1={314} x2={222} y2={314} opacity={0.55} />
          {/* small stand on top, holding the iron */}
          <path d="M196 298 l5 -12 M232 298 l-5 -12" />
          {/* the soldering iron: fat handle → shaft → fine tip */}
          <rect x={180} y={274} width={34} height={13} rx={6} fill={PAPER} />
          <line x1={196} y1={281} x2={190} y2={281} opacity={0.5} />
          <line x1={204} y1={281} x2={198} y2={281} opacity={0.5} />
          <line x1={214} y1={281} x2={242} y2={281} />
          <line x1={242} y1={281} x2={254} y2={281} strokeWidth={1.4} />
        </g>

        {/* ── cactus on the desk, left of screen 1 ─────────────────────── */}
        <g>
          <path d={`M304 ${DESK_TOP} L356 ${DESK_TOP} L350 356 L310 356 Z`} fill={PAPER} />
          <rect x={300} y={348} width={60} height={10} rx={2} fill={PAPER} />
          {/* trunk + two arms (opaque) */}
          <path d={`M322 356 L322 308 Q322 296 330 296 Q338 296 338 308 L338 ${DESK_TOP} Z`} fill={PAPER} />
          <path d="M322 344 Q306 344 306 328 L306 318 Q306 313 310 313 Q314 313 314 318 L314 328 Q314 336 322 336 Z" fill={PAPER} />
          <path d="M338 336 Q354 336 354 322 L354 312 Q354 307 350 307 Q346 307 346 312 L346 320 Q346 328 338 328 Z" fill={PAPER} />
        </g>

        {/* ── architect desk lamp, between screens 3 & 4 ────────────────── */}
        <g>
          {/* weighted base on the desk */}
          <ellipse cx={1050} cy={DESK_TOP - 2} rx={20} ry={5} fill={PAPER} />
          <rect x={1046} y={DESK_TOP - 16} width={8} height={14} fill={PAPER} />
          {/* tall pole */}
          <line x1={1050} y1={DESK_TOP - 16} x2={1050} y2={128} />
          {/* top joint + arm reaching down-left over the desk */}
          <circle cx={1050} cy={130} r={4} fill={PAPER} />
          <line x1={1050} y1={130} x2={942} y2={186} />
          <circle cx={942} cy={186} r={4} fill={PAPER} />
          {/* cone shade, opening angled down toward the work surface */}
          <path d="M942 186 L906 220 Q930 234 956 224 Z" fill={PAPER} />
          <path d="M906 220 Q930 234 956 224" />
          <circle cx={930} cy={220} r={4} />
        </g>

        {/* ── screen 1: landscape monitor ──────────────────────────────── */}
        <g>
          <Screen x={382} y={250} w={202} h={138} />
          <path d={`M464 388 L502 388 L508 ${DESK_TOP} L458 ${DESK_TOP} Z`} fill={PAPER} />
          <ellipse cx={483} cy={DESK_TOP} rx={46} ry={5} fill={PAPER} />
        </g>

        {/* ── screen 2: laptop ─────────────────────────────────────────── */}
        <g>
          <Screen x={602} y={300} w={150} h={94} r={6} inset={9} />
          <path d={`M584 ${DESK_TOP - 2} L770 ${DESK_TOP - 2} L792 ${DESK_TOP + 12} L562 ${DESK_TOP + 12} Z`} fill={PAPER} />
          <line x1={600} y1={DESK_TOP + 4} x2={754} y2={DESK_TOP + 4} opacity={0.5} />
        </g>

        {/* ── screen 3: larger laptop ──────────────────────────────────── */}
        <g>
          <Screen x={802} y={272} w={222} h={122} r={6} inset={10} />
          <path d={`M782 ${DESK_TOP - 2} L1046 ${DESK_TOP - 2} L1070 ${DESK_TOP + 14} L758 ${DESK_TOP + 14} Z`} fill={PAPER} />
          <line x1={800} y1={DESK_TOP + 5} x2={1026} y2={DESK_TOP + 5} opacity={0.5} />
        </g>

        {/* ── screen 4: portrait monitor ───────────────────────────────── */}
        <g>
          <Screen x={1062} y={138} w={182} h={252} r={10} inset={12} />
          <path d={`M1132 390 L1174 390 L1180 ${DESK_TOP} L1126 ${DESK_TOP} Z`} fill={PAPER} />
          <ellipse cx={1153} cy={DESK_TOP} rx={50} ry={5} fill={PAPER} />
        </g>

        {/* ── PC tower under the desk, left side ────────────────────────── */}
        <g>
          <rect x={508} y={434} width={144} height={214} rx={5} fill={PAPER} />
          {/* tempered-glass panel */}
          <rect x={516} y={442} width={100} height={198} rx={3} />
          {/* three RGB fans */}
          {[478, 540, 602].map((cy) => (
            <g key={cy}>
              <circle cx={566} cy={cy} r={26} />
              <circle cx={566} cy={cy} r={7} />
              <path d={`M566 ${cy - 26} A26 26 0 0 1 ${566 + 18} ${cy - 19}`} />
              <path d={`M${566 + 18} ${cy + 19} A26 26 0 0 1 566 ${cy + 26}`} />
              <path d={`M${566 - 18} ${cy - 19} A26 26 0 0 1 566 ${cy - 26}`} />
            </g>
          ))}
          {/* front panel strip + power button */}
          <line x1={624} y1={450} x2={644} y2={450} />
          <line x1={624} y1={458} x2={644} y2={458} />
          <circle cx={634} cy={474} r={4} />
          <path d="M516 648 v6 M644 648 v6" />
        </g>

        {/* ── rolling office chair, front and centre ────────────────────── */}
        <g>
          {/* backrest (opaque) */}
          <rect x={718} y={348} width={164} height={112} rx={30} fill={PAPER} />
          <path d="M736 404 Q800 392 864 404" opacity={0.4} />
          {/* connector posts to the seat */}
          <line x1={788} y1={460} x2={788} y2={478} />
          <line x1={812} y1={460} x2={812} y2={478} />
          {/* seat (opaque) */}
          <path
            d="M690 486
               Q690 470 800 470
               Q910 470 910 486
               L910 506
               Q910 522 800 522
               Q690 522 690 506 Z"
            fill={PAPER}
          />
          {/* gas lift (opaque) */}
          <rect x={792} y={522} width={16} height={48} fill={PAPER} />
          <ellipse cx={800} cy={572} rx={15} ry={6} fill={PAPER} />
          {/* five-star base + casters */}
          {[
            [706, 604],
            [754, 622],
            [802, 628],
            [852, 620],
            [900, 602],
          ].map(([cx, cy]) => (
            <line key={cx} x1={800} y1={572} x2={cx} y2={cy} />
          ))}
          <Caster x={704} y={614} />
          <Caster x={754} y={632} />
          <Caster x={804} y={638} />
          <Caster x={854} y={630} />
          <Caster x={902} y={612} />
        </g>
      </g>
    </svg>
  );
}
