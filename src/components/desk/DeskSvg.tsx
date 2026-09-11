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

export default function DeskSvg({ className }: { className?: string }) {
  const { w, h } = DESK_VIEWBOX;

  const FLOOR = 662;
  const DESK_TOP = 396; // top surface of the desktop
  const DESK_APRON = 422; // underside of the slab
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

        {/* ── snake plant in a tall pot, clear of the desk ─────────────── */}
        <g transform="translate(-12 0)">
          {/* sword leaves — broad blades, opaque, centre leaf behind the fan */}
          <path d="M1408 512 C 1394 420 1402 340 1422 288 C 1442 340 1450 420 1436 512 Z" fill={PAPER} />
          <path d="M1404 512 C 1382 424 1362 348 1382 298 C 1400 350 1414 428 1422 512 Z" fill={PAPER} />
          <path d="M1418 512 C 1430 424 1450 350 1462 302 C 1458 356 1440 430 1428 512 Z" fill={PAPER} />
          <path d="M1398 512 C 1368 454 1342 392 1338 332 C 1356 396 1386 456 1420 512 Z" fill={PAPER} />
          <path d="M1422 512 C 1452 454 1478 392 1502 342 C 1488 400 1454 456 1424 512 Z" fill={PAPER} />
          <path d="M1398 514 C 1372 484 1344 452 1336 398 C 1350 456 1378 490 1418 514 Z" fill={PAPER} />
          <path d="M1424 514 C 1450 484 1480 452 1506 398 C 1494 458 1462 492 1428 514 Z" fill={PAPER} />
          {/* pot — a tall tapered planter, rounded base on the floor */}
          <path
            d="M1346 514
               C 1344 560 1350 618 1366 644 C 1382 662 1396 662 1420 662
               C 1444 662 1458 662 1474 644 C 1490 618 1496 560 1494 514 Z"
            fill={PAPER}
          />
          {/* rim band */}
          <path d="M1338 484 L1346 514 L1494 514 L1502 484 Z" fill={PAPER} />
          <path d="M1338 484 Q1420 476 1502 484" opacity={0.35} />
          <path d="M1338 484 Q1420 494 1502 484" />
          {/* faint centre veins on the tall leaves */}
          <path d="M1421 478 C 1418 420 1420 350 1422 296" opacity={0.3} />
          <path d="M1406 478 C 1394 428 1378 352 1384 302" opacity={0.28} />
          <path d="M1432 478 C 1442 428 1456 356 1462 308" opacity={0.28} />
        </g>

        {/* ── 3D printer — right edge touches the desk's left edge ──────── */}
        <g transform="translate(32 0)">
          {/* ---- electronics base ---- */}
          <rect x={76} y={552} width={184} height={102} rx={5} fill={PAPER} />
          <path d="M90 654 v8 M242 654 v8" />
          {/* LCD readout */}
          <rect x={172} y={566} width={82} height={34} rx={3} fill={PAPER} />
          <line x1={180} y1={577} x2={232} y2={577} opacity={0.5} />
          <line x1={180} y1={588} x2={224} y2={588} opacity={0.5} />
          {/* click wheel */}
          <circle cx={222} cy={624} r={9} />
          <circle cx={222} cy={624} r={3} />
          {/* power rocker */}
          <rect x={84} y={566} width={22} height={15} rx={2} fill={PAPER} />
          <line x1={95} y1={566} x2={95} y2={581} opacity={0.5} />
          {/* two rows of buttons */}
          {[592, 616].map((by) =>
            [92, 112, 132, 152].map((bx) => (
              <circle key={`${bx}-${by}`} cx={bx} cy={by} r={5.5} />
            )),
          )}
          {/* ---- print bed + carriage ---- */}
          <rect x={98} y={540} width={148} height={12} rx={2} fill={PAPER} />
          <line x1={104} y1={540} x2={240} y2={540} />
          {/* ---- gantry frame ---- */}
          <line x1={106} y1={404} x2={106} y2={540} />
          <line x1={230} y1={404} x2={230} y2={540} />
          <line x1={100} y1={404} x2={236} y2={404} />
          {/* X rail + print head + part-cooling fan + nozzle */}
          <line x1={106} y1={448} x2={230} y2={448} />
          <rect x={150} y={446} width={34} height={24} rx={3} fill={PAPER} />
          <rect x={138} y={450} width={12} height={15} rx={2} fill={PAPER} />
          <path d="M158 470 L174 470 L166 482 Z" fill={PAPER} />
          {/* ---- the print in progress: a curvy vase, half-built on the bed ---- */}
          <path
            d="M156 540
               C 144 528 140 515 147 503
               C 151 495 157 489 164 488
               L 176 488
               C 183 489 189 495 193 503
               C 200 515 196 528 184 540 Z"
            fill={PAPER}
          />
          <line x1={149} y1={500} x2={191} y2={500} opacity={0.32} />
          <line x1={146} y1={512} x2={194} y2={512} opacity={0.32} />
          <line x1={147} y1={524} x2={193} y2={524} opacity={0.32} />
          <line x1={151} y1={536} x2={189} y2={536} opacity={0.32} />
          {/* ---- filament spool, side-mounted ---- */}
          <line x1={88} y1={424} x2={54} y2={438} />
          <circle cx={50} cy={452} r={16} fill={PAPER} />
          <circle cx={50} cy={452} r={4} />
          <path d="M50 436 C 46 406 84 398 116 404 C 142 410 152 428 160 440" opacity={0.5} />
          {/* ---- glass enclosure around the exposed print area ---- */}
          <rect x={80} y={396} width={176} height={156} rx={4} />
          {/* hinged front door + handle */}
          <rect x={90} y={406} width={156} height={140} rx={3} opacity={0.55} />
          <line x1={236} y1={462} x2={236} y2={492} strokeWidth={3} />
          {/* soft glass reflections, top-left */}
          <line x1={100} y1={448} x2={128} y2={412} opacity={0.22} />
          <line x1={112} y1={460} x2={134} y2={428} opacity={0.22} />
        </g>

        {/* ── desk: a flat slab on angled legs (front elevation, no top face) ── */}
        <g>
          {/* left pair — set nearer the left end, both raking left, the back
              leg tucked behind the front so only a sliver shows */}
          <path d="M386 422 L402 422 L336 662 L320 662 Z" fill={PAPER} />
          <path d="M400 422 L416 422 L350 662 L334 662 Z" fill={PAPER} />
          {/* right pair — set nearer the right end, both raking right */}
          <path d="M1212 422 L1228 422 L1294 662 L1278 662 Z" fill={PAPER} />
          <path d="M1198 422 L1214 422 L1280 662 L1264 662 Z" fill={PAPER} />

          {/* the desktop — a plain slab: top surface line + front face */}
          <rect
            x={DESK_L}
            y={DESK_TOP}
            width={DESK_R - DESK_L}
            height={DESK_APRON - DESK_TOP}
            fill={PAPER}
          />
        </g>

        {/* ── soldering station, sitting on top of the 3D printer's case ── */}
        <g transform="translate(32 0)">
          {/* station body (opaque) — rests on the enclosure roof */}
          <rect x={150} y={364} width={104} height={32} rx={5} fill={PAPER} />
          <circle cx={168} cy={380} r={7} />
          <rect x={190} y={372} width={44} height={16} rx={2} fill={PAPER} />
          <line x1={198} y1={380} x2={222} y2={380} opacity={0.55} />
          {/* small stand on top, holding the iron */}
          <path d="M196 364 l5 -12 M232 364 l-5 -12" />
          {/* the soldering iron: fat handle → shaft → fine tip */}
          <rect x={180} y={340} width={34} height={13} rx={6} fill={PAPER} />
          <line x1={196} y1={347} x2={190} y2={347} opacity={0.5} />
          <line x1={204} y1={347} x2={198} y2={347} opacity={0.5} />
          <line x1={214} y1={347} x2={242} y2={347} />
          <line x1={242} y1={347} x2={254} y2={347} strokeWidth={1.4} />
        </g>

        {/* ── potted cactus on the desk, traced from the reference ─────── */}
        <g>
          {/* the cactus itself, nudged right so its centre branch lines up
              with the centre of the pot */}
          <g transform="translate(4 0)">
            {/* left arm — thin, uniform width, out horizontally then a
                near-90° turn straight up */}
            <path
              d="M318 340 L307 340 L307 320 A5 5 0 0 0 297 320
                 L297 345 A5 5 0 0 1 302 350 L318 350 Z"
              fill={PAPER}
            />
            {/* right arm — the same, mirrored and reaching a touch higher */}
            <path
              d="M338 332 L349 332 L349 312 A5 5 0 0 1 359 312
                 L359 337 A5 5 0 0 0 354 342 L338 342 Z"
              fill={PAPER}
            />
            {/* arm ridge lines */}
            <path d="M317 343 L304 343 L304 321" opacity={0.3} />
            <path d="M339 334 L352 334 L352 314" opacity={0.3} />
            {/* body — a slim rounded column */}
            <path
              d="M316 396 L316 322 C316 312 320 306 328 306 C336 306 340 312 340 322
                 L340 396 Z"
              fill={PAPER}
            />
            {/* ridge lines on the body */}
            <path d="M321 310 L321 392" opacity={0.35} />
            <path d="M328 306 L328 392" opacity={0.35} />
            <path d="M335 310 L335 392" opacity={0.35} />
          </g>
          {/* pot — keep the terracotta shape */}
          <path d="M305 362 L359 362 L355 378 L309 378 Z" fill={PAPER} />
          <path d="M309 378 L355 378 L344 396 L320 396 Z" fill={PAPER} />
          <line x1={310} y1={378} x2={354} y2={378} opacity={0.4} />
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
          <Screen x={602} y={300} w={150} h={90} r={6} inset={9} />
          {/* keyboard base — front edge rests on the desk surface */}
          <path d={`M588 390 L768 390 L790 ${DESK_TOP} L566 ${DESK_TOP} Z`} fill={PAPER} />
          <line x1={604} y1={393} x2={752} y2={393} opacity={0.45} />
        </g>

        {/* ── screen 3: larger laptop ──────────────────────────────────── */}
        <g>
          <Screen x={802} y={268} w={222} h={120} r={6} inset={10} />
          {/* keyboard base — front edge rests on the desk surface */}
          <path d={`M782 388 L1046 388 L1070 ${DESK_TOP} L758 ${DESK_TOP} Z`} fill={PAPER} />
          <line x1={800} y1={392} x2={1028} y2={392} opacity={0.45} />
        </g>

        {/* ── screen 4: portrait monitor ───────────────────────────────── */}
        <g>
          <Screen x={1062} y={138} w={182} h={252} r={10} inset={12} />
          <path d={`M1132 390 L1174 390 L1180 ${DESK_TOP} L1126 ${DESK_TOP} Z`} fill={PAPER} />
          <ellipse cx={1153} cy={DESK_TOP} rx={50} ry={5} fill={PAPER} />
        </g>

        {/* ── PC tower under the desk — moves with the left legs ────────── */}
        <g transform="translate(-100 0)">
          <rect x={524} y={434} width={150} height={222} rx={5} fill={PAPER} />
          {/* tempered-glass panel */}
          <rect x={532} y={442} width={100} height={206} rx={3} />
          {/* three RGB fans facing the camera */}
          {[482, 548, 614].map((cy) => (
            <g key={cy}>
              <circle cx={573} cy={cy} r={26} />
              <circle cx={573} cy={cy} r={7} />
              <path d={`M573 ${cy - 26} A26 26 0 0 1 ${573 + 18} ${cy - 19}`} />
              <path d={`M${573 + 18} ${cy + 19} A26 26 0 0 1 573 ${cy + 26}`} />
              <path d={`M${573 - 18} ${cy - 19} A26 26 0 0 1 573 ${cy - 26}`} />
            </g>
          ))}
          {/* three more fans turned 90° — plain cross-sections, stuck to the
              right wall of the glass */}
          {[482, 548, 614].map((cy) => (
            <rect
              key={`s${cy}`}
              x={613}
              y={cy - 24}
              width={19}
              height={48}
              rx={4}
              fill={PAPER}
            />
          ))}
          {/* front panel strip + power button */}
          <line x1={642} y1={450} x2={662} y2={450} />
          <line x1={642} y1={458} x2={662} y2={458} />
          <circle cx={652} cy={474} r={4} />
          <path d="M532 656 v6 M664 656 v6" />
        </g>

        {/* ── trash bin, tucked near the right desk legs ────────────────── */}
        <g transform="translate(36 0)">
          {/* tapered body */}
          <path d="M1022 510 L1154 510 L1130 662 L1046 662 Z" fill={PAPER} />
          {/* rim — flat top, no opening curve */}
          <path d="M1008 510 L1168 510 L1166 486 L1010 486 Z" fill={PAPER} />
          {/* faint vertical ribs, following the taper */}
          <line x1={1050} y1={514} x2={1058} y2={656} opacity={0.25} />
          <line x1={1076} y1={514} x2={1080} y2={658} opacity={0.25} />
          <line x1={1102} y1={514} x2={1100} y2={658} opacity={0.25} />
          <line x1={1126} y1={514} x2={1120} y2={656} opacity={0.25} />
          {/* recycling symbol — three chunky arrows wrapping a triangle */}
          <g transform="translate(1088 582) scale(1)" strokeLinejoin="round">
            {[0, 120, 240].map((deg) => (
              <path
                key={deg}
                transform={`rotate(${deg})`}
                d="M-30 9 L-9 -27 L-2 -32 L10 -34 L14 -10 L-4 -22 L-21 14 Z"
                fill={PAPER}
              />
            ))}
          </g>
        </g>

        {/* ── rolling office chair, front and centre ────────────────────── */}
        <g>
          {/* backrest — top edge sits just below the desk's top edge */}
          <rect x={720} y={386} width={160} height={120} rx={22} fill={PAPER} />
          <path d="M736 448 Q800 438 864 448" opacity={0.4} />
          {/* seat — same width as the backrest */}
          <path
            d="M720 552
               Q720 540 800 540
               Q880 540 880 552
               L880 574
               Q880 588 800 588
               Q720 588 720 574 Z"
            fill={PAPER}
          />
          {/* connector — off the backrest, laid over the seat cushion to about
              half its depth, then dropping in */}
          <path
            d="M782 492 L818 492 L818 556 Q818 566 809 566 L791 566 Q782 566 782 556 Z"
            fill={PAPER}
          />
          <path d="M776 560 Q800 570 824 560" opacity={0.4} />
          {/* short central column from under the seat */}
          <rect x={794} y={588} width={12} height={16} fill={PAPER} />
          {/* the column branches into three legs — a little thickness, feet on the floor */}
          <rect x={795} y={602} width={10} height={38} fill={PAPER} />
          <path d="M799 600 L727 610 L723 615 L723 640 L733 640 L733 618 L803 608 Z" fill={PAPER} />
          <path d="M801 600 L873 610 L877 615 L877 640 L867 640 L867 618 L797 608 Z" fill={PAPER} />
          {/* centre caster — a rounded bar */}
          <rect x={791} y={636} width={18} height={26} rx={9} fill={PAPER} />
          {/* side casters — a circle with an inset circle */}
          <circle cx={728} cy={650} r={12} fill={PAPER} />
          <circle cx={728} cy={650} r={5} />
          <circle cx={872} cy={650} r={12} fill={PAPER} />
          <circle cx={872} cy={650} r={5} />
        </g>
      </g>
    </svg>
  );
}
