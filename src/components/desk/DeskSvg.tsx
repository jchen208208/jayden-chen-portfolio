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
 *   tool wall → bookshelf → lamp pole → plant → 3D printer → desk →
 *   soldering station → cactus → four screens → PC tower → chair
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
          {/* two upside-down (frustum) pyramids hang from the shelf's
              underside, each set in a bit from its end toward the middle —
              same trapezoid shape as the cactus pot, just inverted */}
          <path d="M451.5 151 L458.5 151 L457.0 166 L453.0 166 Z" fill={PAPER} />
          <path d="M541.5 151 L548.5 151 L547.0 166 L543.0 166 Z" fill={PAPER} />
          {/* evenly spaced pegboard-style dots filling the wall below the
              shelf, 5 columns by 5 rows — one extra row added above (clear
              of the pyramids and the hung tools) and one below (clear of
              the inner border) */}
          <g opacity={0.5}>
            {[444, 472, 500, 528, 556].map((px) =>
              [172, 182, 198, 214, 230].map((py) => (
                <circle key={`${px}-${py}`} cx={px} cy={py} r={1.5} />
              )),
            )}
          </g>
          {/* five tools hung across the wall, bigger and built from solid
              filled shapes rather than thin outline strokes, each clear of
              its neighbours */}
          {/* scissors — shifted right a bit; filled rings (with a punched
              hole) and filled, tapered blades crossing at the pivot */}
          <circle cx={439} cy={180} r={5} fill={PAPER} />
          <circle cx={439} cy={180} r={2.3} fill={PAPER} />
          <circle cx={451} cy={180} r={5} fill={PAPER} />
          <circle cx={451} cy={180} r={2.3} fill={PAPER} />
          <path d="M437 183 L442 187 L457 220 Z" fill={PAPER} />
          <path d="M453 183 L448 187 L433 220 Z" fill={PAPER} />
          <circle cx={445} cy={194} r={2} fill={PAPER} />
          {/* wrench, redrawn from designs/reference/wrench2.png as a single
              unbroken path — both heads and the shaft in one outline, so
              there's no seam line at the width of the beam where they
              meet. Each head is built almost entirely from curves (a true
              rounded disc, not a boxy rect with rounded corners), with a
              squared-off rectangular notch — not a pointed V, and slim in
              height — bitten into its outer edge: a shallow flat-bottomed
              slot on one side, a deeper one on the other, so one prong
              reads longer than its twin. The right head is the left
              head's outline point-mirrored through the wrench's centre,
              which is why the long prong lands on top on one end and on
              the bottom on the other — same as the reference. Hangs
              horizontally across the top of the board, on the dot layer,
              instead of straight down like the rest */}
          <path
            d="M492 166 Q492 164 490.536 164.464 Q489.07 163 487 163
               Q484.93 163 483.464 164.464 Q482.79 165.14 482.417 166
               L486 166 L486 169 L482.101 169
               Q482.4 170.47 483.464 171.536 Q484.93 173 487 173
               Q489.07 173 490.536 171.536 Q492 172 492 170
               L520 170
               Q520 172 521.464 171.536 Q522.93 173 525 173
               Q527.07 173 528.536 171.536 Q529.21 170.86 529.583 170
               L526 170 L526 167 L529.899 167
               Q529.6 165.53 528.536 164.464 Q527.07 163 525 163
               Q522.93 163 521.464 164.464 Q520 164 520 166
               L492 166 Z"
            fill={PAPER}
          />
          {/* glove, pliers and hammer all shifted down a bit to clear the
              wrench's new horizontal spot at the top of the board */}
          <g transform="translate(0 14)">
            {/* a single work glove, traced from designs/reference/glove_reference.jpg
                (just one of the pair), enlarged, and hung upside down —
                cuff on top, fingers dangling down — moved in next to the
                scissors, nudged right a bit. Fingers are drawn as thick
                capsules first, then the thumb, then the palm block painted
                over both last — its opaque fill hides the tops of the
                fingers and the base of the thumb, and its own border is a
                path that omits the closing "Z" so the bottom edge fills
                but is never stroked, so no line cuts across the fingers
                where they meet the palm. The cuff sits directly above with
                no gap */}
            <g transform="translate(8 0)">
              <path d="M465.5 185 L471.5 185 L471.5 206 Q468.5 210.5 465.5 206 Z" fill={PAPER} />
              <path d="M471.5 185 L477.5 185 L477.5 213 Q474.5 217.5 471.5 213 Z" fill={PAPER} />
              <path d="M477.5 185 L483.5 185 L483.5 211 Q480.5 215.5 477.5 211 Z" fill={PAPER} />
              <path
                d="M483.5 185 L489.5 185 L488.2 199 Q488.7 202.5 489.5 206 Q486.5 210.5 483.5 206 Z"
                fill={PAPER}
              />
              <g transform="translate(467 189) rotate(35)">
                <rect x={-2.5} y={0} width={5} height={13} rx={2.5} fill={PAPER} />
              </g>
              {/* palm fill is a plain unstroked rect; its visible border is drawn
                  separately below, and stops right at the top-left corner
                  instead of running the rest of the way down the left side,
                  so the palm's own edge doesn't carry on past where the
                  thumb attaches — the thumb's own outline (plus the round
                  line-cap closing the small gap) picks up the silhouette
                  from there down */}
              <rect x={465} y={183} width={26} height={16} fill={PAPER} stroke="none" />
              {/* right edge curves inward a touch through the palm — the
                  matching curve continues into the cuff above and the
                  pinky below so the whole right side reads as one bowed
                  line instead of three straight ones */}
              <path
                d="M488.2 199 Q487.1 191 488 183 L468 183 Q465 183 465 186"
                fill="none"
              />
              <path d="M465 177 L489 177 Q488.4 180 488 183 L465 183 Z" fill={PAPER} />
            </g>
            {/* pliers, traced from designs/reference/pliers_clipart.png and
                turned upright — shorter, thicker filled handles, a longer
                metal nose with a centre line bisecting it — evenly spaced
                between the glove and the hammer */}
            <path d="M515 195 L523 195 L519 171 Z" fill={PAPER} />
            <line x1={519} y1={195} x2={519} y2={173} />
            <circle cx={519} cy={195} r={2.5} fill={PAPER} />
            <path d="M515 196 Q506 202 509 209 L512 209 Q511 203 517 196 Z" fill={PAPER} />
            <path d="M523 196 Q532 202 529 209 L526 209 Q527 203 521 196 Z" fill={PAPER} />
            {/* hammer, traced from designs/reference/hammer_reference.jpg and
                stood upright (right side up) instead of tilted: a squared-
                off rectangular striking face on one side of the head, and
                on the other a claw. Matching the reference, the claw is a
                simple wedge, not a hook that loops back on itself: the top
                edge runs flat off the top of the square — never rising
                above it — then curves downward, and the underside curves
                downward too (dipping below its own attachment point on the
                square), the two meeting the tip from opposite angles so it
                comes to a sharp point rather than rounding off. A blunt
                face sits on the left, taller than the centre square and
                joined to it by a short connecting beam. Moved up near the
                wrench,
                just below it, with a longer handle. Drawn as one
                continuous outline, the same trick as the glove: the blunt
                face, beam, centre square and claw are traced as a single
                path following only the true outer silhouette (with small
                in-and-out steps where the narrower beam meets the wider
                pieces on either side), instead of separate stroked/filled
                shapes, so no seam lines show where those meet — but the
                line where the head meets the handle is kept, drawn back in
                separately, since that's a real seam (a wood/metal handle
                socketed into the head) rather than one continuous piece */}
            <g transform="translate(-4 -16)">
              <path
                d="M542 179 L546 179 L546 182 L549 182 L549 180 L560 180
                   Q566 180 570 188 Q566 187 560 187
                   L560 190 L557 190 L557 219
                   Q557 222 554 222 Q551 222 551 219
                   L551 190 L549 190 L549 188 L546 188 L546 191 L542 191
                   Q541 191 541 190 L541 180 Q541 179 542 179 Z"
                fill={PAPER}
              />
              <line x1={551} y1={190} x2={557} y2={190} />
            </g>
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
            rebuilding from scratch, base first ── */}
        <g transform="translate(32 0) translate(-23 0) translate(202 396) scale(0.95) translate(-202 -396)">
          {/* base — a rectangle with its top-left corner cut by a diagonal
              running from the midpoint of the top edge to the midpoint of
              the left edge; raised up on two short stands that land on the
              printer's top edge (y=396) */}
          <path d="M254 358 L202 358 L150 374 L150 390 L254 390 Z" fill={PAPER} />
          {/* two very short stands, with a bit of width, running from the
              base down to the printer's top edge */}
          <rect x={156} y={390} width={10} height={6} rx={1} fill={PAPER} />
          <rect x={238} y={390} width={10} height={6} rx={1} fill={PAPER} />
          {/* two short line stands, off the two corners of the slanted edge,
              running up to the two ends of the coiled spring */}
          <path d="M150 374 L145.3 358.7 M202 358 L197.3 342.7" />
          {/* the coiled spring itself — run parallel to the base's slanted
              edge, offset above it, with a tight, high-frequency wind */}
          <path
            d="M145.3 358.7 Q147.6 350.7 156.0 362.7 Q156.2 348.0 164.7 360.1
               Q164.9 345.3 173.4 357.4 Q173.6 342.7 182.0 354.7
               Q182.2 340.0 190.7 352.1 Q190.9 337.3 197.3 342.7"
          />
          {/* stand for the iron to rest on — rising off the base's flat top
              edge at roughly 75° from the +x axis, positioned under the
              handle's midsection instead of its left end, so it no longer
              reads as fused with the collar */}
          <path d="M231.9 358.8 L237.1 339.3 L231.3 337.7 L226.1 357.2 Z" fill={PAPER} />
          {/* the iron's handle, resting on top of the stand, perpendicular
              to the stand's own angle rather than flat — a bit thicker than
              the stand, flat on the left, rounded on the right; shifted up
              and left, together with the collar, to meet the rod */}
          <path d="M220.7 330.7 L245.9 337.5 A4 4 0 0 1 243.8 345.2 L218.7 338.5 Z" fill={PAPER} />
          {/* a thin collar off the handle's left end, centred on the
              handle's own centreline, back in the stand's orientation —
              straight sides, with the top and bottom caps given a slight
              outward curve instead of being flat */}
          <path d="M215.4 342.8 L220.1 325.4 Q222.3 324.9 224.0 326.4 L219.3 343.8 Q217.1 344.3 215.4 342.8 Z" fill={PAPER} />
          {/* the metal rod — same orientation as the handle, but thinner
              and longer, running off the collar's left side to a pointed,
              screwdriver-like tip; one path, so there's no seam between the
              shaft and the tip; shifted up to meet the collar again */}
          <path d="M218.7 330.8 L185.4 321.8 L173.3 322.1 L183.5 328.5 L216.9 337.4 Z" fill={PAPER} />
          {/* cord — out of the handle's rounded rear end, a smooth
              semicircular arc down to the midpoint of the base's right
              edge, a bit thicker than the rest of the linework */}
          <path d="M248.7 342.4 A16 16 0 0 1 254 374" strokeWidth={3.2} />
          {/* control panel, on the base's flat front-right face: two small
              buttons and a turnable knob */}
          <circle cx={213} cy={372} r={3.5} fill={PAPER} />
          <circle cx={224} cy={372} r={3.5} fill={PAPER} />
          <circle cx={240} cy={377} r={9} />
          <circle cx={240} cy={377} r={2.5} fill={PAPER} />
          <line x1={240} y1={377} x2={240} y2={368} />
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
          {/* "SKILLS" label marking this screen as clickable — centred in
              the glass (611,309,132,72), set in the same display face as
              the "Jayden Chen" title, all caps to match its treatment
              elsewhere on the page */}
          <text
            x={677}
            y={345}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={17}
            fontFamily="var(--font-mileast)"
            letterSpacing={1}
            fill={INK}
            stroke="none"
          >
            SKILLS
          </text>
          {/* base — just its sideways thickness, no keyboard face in this side view;
              slightly wider than the screen so it reads as a laptop base */}
          <rect x={594} y={388} width={166} height={8} rx={2} fill={PAPER} />
        </g>

        {/* ── screen 3: larger laptop ──────────────────────────────────── */}
        <g>
          <Screen x={802} y={268} w={222} h={120} r={6} inset={10} />
          {/* placeholder label marking this screen as clickable — centred in
              the glass (812,278,202,100) */}
          <text
            x={913}
            y={328}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={18}
            fontFamily="var(--font-jetbrains-mono), monospace"
            fill={INK}
            stroke="none"
          >
            Section 2
          </text>
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
