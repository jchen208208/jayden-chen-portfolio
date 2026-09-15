import { DESK_VIEWBOX } from "@/lib/desk";
import SolderingStation, { SOLDERING_FEET_Y } from "./SolderingStation";
import LaptopExperienceScreen from "./LaptopExperienceScreen";
import LaptopSkillsScreen from "./LaptopSkillsScreen";

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
 *   tool wall → bookshelf → lamp pole → plant → 3D printer → desk →
 *   soldering station → cactus → four screens → PC tower → chair
 */

const INK = "var(--ink, #f4f6f8)";
const PAPER = "var(--paper, #000)";
/** reference-image pixels → desk units for the soldering station */
const SOLDERING_SCALE = 0.4;
/** the tool wall's hung tools are tiny, so they use a lighter outline than
 *  the desk's 2.4 (still ~2 once the wall's 1.3x scale is applied) plus a
 *  thin weight for interior details, like the lamp's 1.4 chain */
const TOOL_OUTLINE = 1.6;
const TOOL_DETAIL = 0.9;

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

export default function DeskSvg({
  className,
  lampOn = false,
}: {
  className?: string;
  /** pull-chain state — lit, the bulb fills yellow and the chain hangs a touch lower */
  lampOn?: boolean;
}) {
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

        {/* ── tool wall, relocated above the soldering station/3D printer on
            the far left of the desk (was: left half of the wall shelf,
            paired with the bookshelf) — shifted left, a bit lower than the
            bookshelf now sits, and scaled up 1.3x around its own centre
            (420,100,160,146 → centre 500,173) so the whole board and
            everything mounted on it reads bigger ─────────────────────── */}
        <g transform="translate(-291.5 15) translate(500 173) scale(1.3) translate(-500 -173)">
          {/* sharp corners, unlike the bookshelf; an inset rect gives the
              frame a visible border thickness, the same bezel trick as
              `Screen` */}
          <rect x={420} y={100} width={160} height={146} fill={PAPER} />
          <rect x={428} y={108} width={144} height={130} fill={PAPER} />
          {/* a single shelf, styled like one bookshelf tier divider, sitting
              ~2/3 of the way up the wall (measured from the bottom) and a
              touch narrower than the inner border */}
          <rect x={432} y={147} width={136} height={4} fill={PAPER} />
          {/* toolbox, traced from designs/reference/toolbox_reference.png,
              resting on the shelf and set a bit left of its centre — kept
              clear of every tool-wall edge */}
          <path d="M458 121 L458 115 L482 115 L482 121 L478 121 L478 118 L462 118 L462 121 Z" fill={PAPER} />
          <rect x={442} y={121} width={56} height={26} rx={5} fill={PAPER} />
          <line x1={442} y1={129} x2={498} y2={129} />
          <rect x={455} y={124} width={7} height={11} rx={1.5} fill={PAPER} />
          <rect x={479} y={124} width={7} height={11} rx={1.5} fill={PAPER} />
          {/* a second, smaller toolbox to the right of the first — shorter,
              more square, sharp corners instead of rounded, and different
              details: a flat tab handle and a pair of corner rivets instead
              of a lid seam and twin clasps */}
          <rect x={521} y={120} width={28} height={5} fill={PAPER} />
          <rect x={507} y={125} width={56} height={22} fill={PAPER} />
          <circle cx={513} cy={130} r={1} fill={PAPER} />
          <circle cx={557} cy={130} r={1} fill={PAPER} />
          {/* pegboard holes — a regular 10 × 7 grid filling the wall below
              the shelf, painted first so the shelf brackets and every hung
              tool sit on top of them */}
          <g opacity={0.35} fill={INK} stroke="none">
            {[437, 451, 465, 479, 493, 507, 521, 535, 549, 563].map((px) =>
              [160, 172, 184, 196, 208, 220, 232].map((py) => (
                <circle key={`${px}-${py}`} cx={px} cy={py} r={1.3} />
              )),
            )}
          </g>
          {/* two upside-down (frustum) pyramids hang from the shelf's
              underside, each set in a bit from its end toward the middle —
              same trapezoid shape as the cactus pot, just inverted */}
          <path d="M451.5 151 L458.5 151 L457.0 166 L453.0 166 Z" fill={PAPER} />
          <path d="M541.5 151 L548.5 151 L547.0 166 L543.0 166 Z" fill={PAPER} />
          {/* five tools hung upright across the pegboard, each drawn like a
              line icon in its own local coordinates (origin = top centre):
              a slightly lighter outline than the rest of the desk, so a few
              thin interior detail lines (`TOOL_DETAIL`) still read at this
              size, and every shape opaque-filled so overlaps stay clean */}
          <g strokeWidth={TOOL_OUTLINE}>
            {/* scissors — an asymmetric pair of finger loops (one round,
                one taller oval, like real shears), arms crossing to a pivot
                screw, and two overlapping leaf-shaped blades closed to a
                point */}
            <g transform="translate(442 171)">
              <path d="M-3.3 17 Q-4.6 32 -0.7 48 Q1.1 32 1.5 18 Z" fill={PAPER} />
              <path d="M3.3 17 Q4.6 32 0.7 48 Q-1.1 32 -1.5 18 Z" fill={PAPER} />
              <path d="M-5.5 11 Q-3 14 -0.6 18.5 L0.9 16.6 Q-1 13 -2.2 10.6 Z" fill={PAPER} />
              <path d="M5.5 12 Q3 15 0.6 18.5 L-0.9 16.6 Q1 14 2.4 11.4 Z" fill={PAPER} />
              <ellipse cx={-5} cy={6} rx={4.6} ry={5.2} fill={PAPER} />
              <ellipse cx={-5} cy={6} rx={2.3} ry={2.9} fill={PAPER} strokeWidth={TOOL_DETAIL} />
              <ellipse cx={5.6} cy={6.6} rx={4.9} ry={6.2} fill={PAPER} />
              <ellipse cx={5.6} cy={6.6} rx={2.5} ry={3.8} fill={PAPER} strokeWidth={TOOL_DETAIL} />
              <circle cx={0} cy={17.4} r={1.5} fill={PAPER} strokeWidth={TOOL_DETAIL} />
            </g>
            {/* work glove, after designs/reference/glove_reference.jpg —
                hung cuff-up: one silhouette for the hand (four tapered
                fingers with V-notches between them, thumb angled off to
                the side), finger-seam lines, a knuckle seam across the
                back, and a separate cuff with a band stitched through it */}
            <g transform="translate(471 170)">
              <path
                d="M8.6 10 L8.9 27 L8.4 38 Q8.2 40.5 6.4 40.5 Q4.6 40.5 4.5 38 L4.3 29.5
                   L4.1 42.5 Q4 45 2.1 45 Q0.2 45 0.1 42.5 L-0.1 29.5
                   L-0.2 44 Q-0.3 46.5 -2.2 46.5 Q-4.1 46.5 -4.2 44 L-4.4 29.5
                   L-4.5 41.5 Q-4.6 44 -6.5 44 Q-8.4 44 -8.5 41.5 L-8.7 26
                   Q-11.2 27.5 -13.3 31.5 Q-14.8 33.8 -16.2 32.6 Q-17.2 31.6 -16.4 29.6
                   Q-13.8 21 -8.8 14 L-8.6 10 Z"
                fill={PAPER}
              />
              <g strokeWidth={TOOL_DETAIL}>
                <path d="M4.3 29.5 L4.3 25.5 M-0.1 29.5 L-0.1 25.5 M-4.4 29.5 L-4.4 25.5" />
                <path d="M-8.2 22.5 Q0 25 8.8 22.5" />
              </g>
              <path d="M-9.8 1 L9.8 1 L9 10.5 L-9 10.5 Z" fill={PAPER} />
              <path d="M-9.5 5 L9.5 5" strokeWidth={TOOL_DETAIL} />
            </g>
            {/* claw hammer — resting on two pegs under its head: a wooden
                handle socketed into the head (the seam is kept), a rubber
                grip sleeve with ridges near the butt, and a one-piece head
                with a bevelled striking face, a narrow neck, the eye block
                and a curved claw sweeping down to a point */}
            <g transform="translate(503 161)">
              <path d="M-2.1 4 L-2.5 38 L2.5 38 L2.1 4 Z" fill={PAPER} />
              <path d="M-2.9 37 L-3.3 56 Q0 59.5 3.3 56 L2.9 37 Z" fill={PAPER} />
              <path
                d="M-3.1 41.5 L3.1 41.5 M-3.15 45.5 L3.15 45.5 M-3.2 49.5 L3.2 49.5"
                strokeWidth={TOOL_DETAIL}
              />
              <path
                d="M-12.5 -4.2 Q-13.3 -4.2 -13.3 -3.4 L-13.3 3.4 Q-13.3 4.2 -12.5 4.2 L-9.8 4.2 L-9.8 2.4
                   L-4.2 2.4 L-4.2 5.5 L4.2 5.5 L4.2 2.2 Q10.5 2 16.2 8.8 Q17 9.6 17.3 8.6
                   Q15.5 -3.6 4.2 -3.8 L4.2 -4.6 L-4.2 -4.6 L-4.2 -2.4 L-9.8 -2.4 L-9.8 -4.2 Z"
                fill={PAPER}
              />
              <path d="M-11.9 -4 L-11.9 4" strokeWidth={TOOL_DETAIL} />
            </g>
            {/* combination pliers — jaws up: bowed rubber-sleeved handles
                (collar line near the top) meeting under a tapered nose with
                a jaw seam, serration ticks, the rounded cutter/grip opening
                just above the pivot, and a riveted pivot boss on top */}
            <g transform="translate(533 166)">
              <path
                d="M-3.6 21 Q-7.6 36 -7.6 50.5 Q-7.6 54 -5 54 Q-2.6 54 -2.7 50.5 Q-2.4 37 -0.1 21 Z"
                fill={PAPER}
              />
              <path
                d="M3.6 21 Q7.6 36 7.6 50.5 Q7.6 54 5 54 Q2.6 54 2.7 50.5 Q2.4 37 0.1 21 Z"
                fill={PAPER}
              />
              <path d="M-5.3 29.5 L-1.3 29.5 M5.3 29.5 L1.3 29.5" strokeWidth={TOOL_DETAIL} />
              <path
                d="M-1 0.5 Q0 -0.3 1 0.5 L4.3 17.5 Q4.6 21.5 0 24.5 Q-4.6 21.5 -4.3 17.5 Z"
                fill={PAPER}
              />
              <path d="M0 1 L0 11.5 M0 16.8 L0 18" strokeWidth={TOOL_DETAIL} />
              <path d="M0 11.5 Q1.5 14.1 0 16.8 Q-1.5 14.1 0 11.5 Z" fill={PAPER} strokeWidth={TOOL_DETAIL} />
              <path d="M-0.9 4 L0.9 4 M-1.3 6.5 L1.3 6.5 M-1.7 9 L1.7 9" strokeWidth={TOOL_DETAIL * 0.8} />
              <circle cx={0} cy={20.2} r={2.4} fill={PAPER} />
              <circle cx={0} cy={20.2} r={0.8} fill={INK} stroke="none" />
            </g>
            {/* combination wrench — hung by its open end on a peg: one
                unbroken outline (angled open-jaw head, a shaft that slims
                slightly toward the middle, ring-shaped box end) so no seams
                show where the heads meet the shaft, plus a hex socket in
                the box end and a recessed channel running down the shaft */}
            <g transform="translate(558 167)">
              <path
                d="M2.3 12.37 A6.3 6.3 0 0 0 0.15 0.2 L2.09 5.01 A2.5 2.5 0 0 1 -2.54 6.88
                   L-4.48 2.07 A6.3 6.3 0 0 0 -2.3 12.37 L-1.85 32.24 L-2.3 52.11
                   A5.4 5.4 0 1 0 2.3 52.11 L1.85 32.24 Z"
                fill={PAPER}
              />
              <path
                d="M2.51 58.45 L0 59.9 L-2.51 58.45 L-2.51 55.55 L0 54.1 L2.51 55.55 Z"
                fill={PAPER}
                strokeWidth={TOOL_DETAIL}
              />
              <path
                d="M-0.75 16.37 L-0.6 32.24 L-0.75 48.11 M0.75 16.37 L0.6 32.24 L0.75 48.11"
                strokeWidth={TOOL_DETAIL}
              />
            </g>
          </g>
          {/* the pegs each tool hangs from, painted over the tools: one
              through the scissors' round loop, two under the hammer's head
              either side of the handle, one in the wrench's open jaw */}
          <g fill={INK} stroke="none">
            <circle cx={437} cy={174.6} r={1.3} />
            <circle cx={496} cy={167} r={1.3} />
            <circle cx={510} cy={166.5} r={1.3} />
            <circle cx={557.78} cy={171.74} r={1.3} />
          </g>
        </g>

        {/* ── wall shelf (bookshelf), behind screens 1 & 2; centred over
            screen 2 — the tool wall that used to sit beside it has moved
            above the soldering station ─────────────────────────────── */}
        <g transform="translate(105 -20)">
          {/* bookshelf carcass — same inset-rect framing */}
          <rect x={584} y={100} width={140} height={146} rx={4} fill={PAPER} />
          <rect x={592} y={108} width={124} height={130} rx={2} fill={PAPER} />
          {/* tier dividers, given real thickness instead of hairlines —
              spanning only the inner border's width so they connect to it
              without crossing through the frame */}
          <rect x={592} y={148} width={124} height={4} fill={PAPER} />
          <rect x={592} y={196} width={124} height={4} fill={PAPER} />
          {/* top tier — books only, traced loosely from
              designs/reference/bookshelf_reference.avif: varying widths and
              heights, a couple of decorative spine accents, and one leaning
              against its neighbour */}
          <rect x={594} y={112} width={10} height={36} fill={PAPER} />
          <rect x={607} y={116} width={6} height={32} fill={PAPER} />
          <g opacity={0.5}>
            {[124, 134, 144].map((y) => (
              <circle key={y} cx={610} cy={y} r={1.3} />
            ))}
          </g>
          <path d="M619 148 L619 114 L630 112 L630 148 Z" fill={PAPER} />
          <rect x={633} y={118} width={10} height={30} fill={PAPER} />
          <rect x={646} y={112} width={11} height={36} fill={PAPER} />
          <path d="M652 117 L654 120 L652 123 L650 120 Z" opacity={0.6} />
          <rect x={660} y={117} width={10} height={31} fill={PAPER} />
          <g transform="rotate(10 680 146)">
            <rect x={676} y={118} width={8} height={28} fill={PAPER} />
          </g>
          <rect x={689} y={114} width={11} height={34} fill={PAPER} />
          <rect x={703} y={110} width={12} height={38} fill={PAPER} />

          {/* middle tier — books only */}
          <rect x={594} y={158} width={12} height={38} fill={PAPER} />
          <rect x={609} y={154} width={11} height={42} fill={PAPER} />
          <path d="M615 168 L617 171 L615 174 L613 171 Z" opacity={0.6} />
          <rect x={623} y={162} width={11} height={34} fill={PAPER} />
          <rect x={637} y={160} width={11} height={36} fill={PAPER} />
          <rect x={651} y={156} width={10} height={40} fill={PAPER} />
          <rect x={664} y={162} width={11} height={34} fill={PAPER} />
          <g opacity={0.5}>
            <circle cx={670} cy={170} r={1.3} />
            <circle cx={670} cy={178} r={1.3} />
            <circle cx={670} cy={186} r={1.3} />
          </g>
          <rect x={678} y={158} width={10} height={38} fill={PAPER} />
          <rect x={691} y={154} width={11} height={42} fill={PAPER} />
          <rect x={705} y={160} width={10} height={36} fill={PAPER} />

          {/* bottom tier — a stack of books lying flat, a trophy, and a
              figurine, all kept clear of the divider and the inner border */}
          <rect x={594} y={228} width={38} height={10} rx={1} fill={PAPER} />
          <line x1={596} y1={233} x2={630} y2={233} opacity={0.45} />
          <rect x={594} y={218} width={33} height={10} rx={1} fill={PAPER} />
          <line x1={596} y1={223} x2={625} y2={223} opacity={0.45} />
          <rect x={594} y={208} width={28} height={10} rx={1} fill={PAPER} />
          <line x1={596} y1={213} x2={620} y2={213} opacity={0.45} />
          <path d="M643 212 Q636 214 638 220 Q640 224 645 222" />
          <path d="M659 212 Q666 214 664 220 Q662 224 657 222" />
          <path d="M643 210 L659 210 L657 228 L645 228 Z" fill={PAPER} />
          <rect x={649} y={228} width={4} height={6} fill={PAPER} />
          <rect x={644} y={234} width={14} height={4} rx={1} fill={PAPER} />
          {/* alarm clock, filling the space where the figurine was —
              shifted right, with smaller bells and shorter legs */}
          <path d="M681 210 Q690 204 699 210" />
          <circle cx={681} cy={213} r={2} fill={PAPER} />
          <circle cx={699} cy={213} r={2} fill={PAPER} />
          <circle cx={690} cy={224} r={11} fill={PAPER} />
          <line x1={690} y1={224} x2={690} y2={218} />
          <line x1={690} y1={224} x2={694} y2={225} />
          <circle cx={690} cy={224} r={1} fill={PAPER} />
          <path d="M684 235 L681 238 M696 235 L699 238" />
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

        {/* ── soldering station, sitting on top of the 3D printer's case ──
            traced from designs/reference/soldering_kit_reference.webp in that
            image's own pixel space (see `SolderingStation`), then scaled
            down so its feet land on the printer's top edge and its iron
            tip stays clear of the tool wall above. The line weight is
            divided by the scale so it still draws at 2.4 ── */}
        <g
          transform={`translate(146 ${DESK_TOP}) scale(${SOLDERING_SCALE}) translate(-73 -${SOLDERING_FEET_Y})`}
          strokeWidth={2.4 / SOLDERING_SCALE}
        >
          <SolderingStation ink={INK} paper={PAPER} strokeWidth={2.4 / SOLDERING_SCALE} />
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

        {/* ── desk lamp: base like the monitors, arm bends left then down to the head ── */}
        <g transform="translate(-5 0)">
          {/* base — same flat, rounded-top styling as the monitor bases; centred
              in the gap between screens 3 and 4 and tucks behind them, since
              this whole group paints before either screen */}
          <path
            d={`M1023 ${DESK_TOP} L1023 391 Q1023 387 1027 387 L1069 387 Q1073 387 1073 391
               L1073 ${DESK_TOP} Z`}
            fill={PAPER}
          />
          {/* post + arm: one solid outline, straight up then bent left — the
              joint knuckle below covers the seam where the third part attaches */}
          <path d="M1052 114 L1052 387 L1044 387 L1044 122 L994 122 L994 114 Z" fill={PAPER} />
          {/* joint knuckle at the post/arm bend */}
          <circle cx={1048} cy={118} r={6} fill={PAPER} />
          {/* third part: instead of dropping straight down, it tilts slightly
              left — and the head tilts with it, pivoting on the joint below */}
          <g transform="rotate(15 998 118)">
            <rect x={994} y={114} width={8} height={18} fill={PAPER} />
            {/* lamp head — same tapered shape as the cactus pot, opening down,
                with the side kinks eased into curves; one path so there's no
                dividing line across it */}
            <path d="M986 132 L1010 132 Q1021 150 1025 168 L971 168 Q975 150 986 132 Z" fill={PAPER} />
            {/* just the 2D side of the bulb, poking out below the opening —
                closed back across its flat top so it can take a fill; centred
                on the head's own centreline (x=998) so it hangs in line with
                the shade above it. Lit, it fills yellow. */}
            <path d="M985 168 A13 7 0 0 0 1011 168 Z" fill={lampOn ? "#ffd75e" : "none"} />
            {/* pull chain — attaches to the shade's rim just right of the
                bulb and drips straight down, a string of small linked beads
                ending in a slightly larger handle. The attach point rotates
                with the tilted head (it's fixed to the shade), but this
                inner group counter-rotates by the same 15° so the chain
                itself always hangs vertically, not at the head's angle.
                Pulling it (click target on the handle, wired in DeskScene)
                stretches the last link and lights the bulb. */}
            <g transform="rotate(-15 1015 169)" strokeWidth={1.4}>
              {[4, 8, 12, 16].map((dy) => (
                <circle key={dy} cx={1015} cy={169 + dy} r={1} fill={PAPER} />
              ))}
              <circle
                cx={1015}
                cy={169 + (lampOn ? 24 : 20)}
                r={2}
                fill={PAPER}
                style={{ transition: "cy 180ms ease-out" }}
              />
            </g>
          </g>
          {/* joint knuckle at the arm/third-part bend, capping the seam */}
          <circle cx={998} cy={118} r={6} fill={PAPER} />
        </g>

        {/* ── screen 1: landscape monitor ──────────────────────────────── */}
        <g>
          <Screen x={382} y={239} w={202} h={138} />
          {/* placeholder "play" triangle marking this screen as clickable —
              centred in the glass (392,249,182,118) */}
          <path d="M464 282 L464 334 L518 308 Z" fill={INK} />
          {/* connecting beam — a touch longer than before */}
          <path d="M464 377 L502 377 L508 387 L458 387 Z" fill={PAPER} />
          {/* base — flat, rounded only on top, bottom flush on the desk */}
          <path
            d={`M448 ${DESK_TOP} L448 391 Q448 387 452 387 L514 387 Q518 387 518 391 L518 ${DESK_TOP} Z`}
            fill={PAPER}
          />
        </g>

        {/* ── screen 2: laptop ─────────────────────────────────────────── */}
        <g>
          <Screen x={602} y={300} w={150} h={90} r={6} inset={9} />
          {/* terminal-style "SKILLS" + ▌ block cursor, over a ‹ › strip of the
              section's skill icons scrolling past — see `LaptopSkillsScreen` */}
          <LaptopSkillsScreen />
          {/* base — just its sideways thickness, no keyboard face in this side view;
              slightly wider than the screen so it reads as a laptop base */}
          <rect x={594} y={388} width={166} height={8} rx={2} fill={PAPER} />
        </g>

        {/* ── screen 3: larger laptop ──────────────────────────────────── */}
        <g>
          <Screen x={802} y={268} w={222} h={120} r={6} inset={10} />
          {/* an editor on `experience.md`: a large "# EXPERIENCE" heading over
              code typing itself in — see `LaptopExperienceScreen` */}
          <LaptopExperienceScreen />
          {/* base — just its sideways thickness, no keyboard face in this side view;
              wider than the screen, sides slanting inward slightly toward the desk */}
          <path d="M792 384 L1034 384 L1026 396 L800 396 Z" fill={PAPER} />
        </g>

        {/* ── screen 4: portrait monitor ───────────────────────────────── */}
        <g>
          <Screen x={1062} y={128} w={182} h={252} r={10} inset={12} />
          {/* placeholder label marking this screen as clickable — centred in
              the glass (1074,140,158,228) */}
          <text
            x={1153}
            y={254}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={15}
            fontFamily="var(--font-jetbrains-mono), monospace"
            fill={INK}
            stroke="none"
          >
            Section 3
          </text>
          {/* two legs — connect the screen down to the base */}
          <path d="M1140 380 L1150 380 L1146 388 L1136 388 Z" fill={PAPER} />
          <path d="M1156 380 L1166 380 L1170 388 L1160 388 Z" fill={PAPER} />
          {/* base — flat, rounded only on top, sitting flush on the desk */}
          <path
            d={`M1126 ${DESK_TOP} L1126 391 Q1126 388 1130 388 L1176 388 Q1180 388 1180 391
               L1180 ${DESK_TOP} Z`}
            fill={PAPER}
          />
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
          {/* recycling symbol — traced from designs/reference/recycling symbol.png.
              One arrow (right edge → rounded bottom-right corner → flat arrowhead
              on the bottom edge), drawn around the triangle's centroid and
              rotated 120° twice. Solid, like the reference. */}
          <g transform="translate(1088 578) scale(0.072)" fill={INK} stroke="none">
            {[0, 120, 240].map((deg) => (
              <path
                key={deg}
                transform={`rotate(${deg})`}
                d="M238 -102.8 L377.6 139 A79 79 0 0 1 309.2 257.5 L70 257.5
                   L70 325 L5 210 L70 95 L70 162.5 L257.2 162.5
                   A14 14 0 0 0 269.3 141.5 L155.7 -55.3 Z"
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
