"use client";

import { useId } from "react";

/**
 * Screen 4 — the portrait monitor, the only tall screen on the desk.
 *
 * A title ribbon over one looping story:
 *
 *   rally (5 crossings) → winner → celebration → podium slideshow → repeat
 *
 * You are on the near side and hit crossings 1, 3 and 5; the opponent returns
 * 2 and 4 and can't reach the 5th. Then three podium stills crossfade.
 *
 * The court, the near player and the podium are all drawn LARGER than the
 * glass and clipped to it. That is deliberate: a broadcast camera crops the
 * near player and the podium runs out of frame, and sizing everything to fit
 * inside 158×228 is what made the earlier version look like a diagram of a
 * tennis court rather than a picture of one. `clipPath` is what makes the
 * overflow safe — without it this spills over the desk and the wall.
 *
 * Every element runs off one generated timeline (`CYCLE_MS`) so they cannot
 * drift apart — the pattern `LaptopExperienceScreen` uses for its typing:
 * build the clock in ms, emit `@keyframes` into an inline `<style>`, and key
 * the root `<g>` on a hash of that CSS so a hot reload remounts everything in
 * step rather than starting new elements mid-cycle.
 *
 * Coordinates are absolute desk-viewBox units (the screens 2 and 3
 * convention), inside `DeskSvg`'s outer `<g stroke={INK} strokeWidth={2.4}>` —
 * so every fill needs `stroke="none"` and every stroked line its own
 * `strokeWidth`, since 2.4 would swallow detail this small.
 */
const INK = "var(--ink, #f4f6f8)";
const PAPER = "var(--paper, #000)";
const MONO = "var(--font-mono), ui-monospace, monospace";
/** an actual tennis ball's optic yellow-green, not a flat white dot */
const BALL_COLOR = "#d5e544";
/** medal gold, with a darker rim so the disc still reads on black glass */
const GOLD = "#d4af37";
const GOLD_DARK = "#8a6a1a";

/** the monitor's glass — must track `Screen x={1062} y={128} w={182} h={252}`
 *  with `inset={12}` in `DeskSvg`, and `SCREENS` in `DeskScene` */
export const PORTRAIT_GLASS = { x: 1074, y: 140, w: 158, h: 228 };
/** the glass's own corner radius (`max(2, r - 4)` for `r={10}`) */
const GLASS_R = 6;

/** line weights — the figures carry more than the court so they read as
 *  subjects rather than markings */
const LINE = 1.4;
const FIG = 1.8;

/* ── title ribbon ──────────────────────────────────────────────────────────
 * A ribbon only reads as a ribbon if its tails, notches and folds are visible,
 * so the whole banner fits INSIDE the 158-unit glass, and the title has to fit
 * inside the front panel between the tails. Splitting it as "PERSONAL" /
 * "& AWARDS" makes both lines 8 characters — the longest line is what limits
 * the size, and evening them out is what lets it sit at 18.
 */
const TITLE_SIZE = 18;

/* ── court ─────────────────────────────────────────────────────────────────
 * Deliberately only three lines across — baseline, net, baseline. A real
 * court's service lines put six horizontals into this space and the whole
 * thing reads as a ladder. The exaggerated taper sells the depth instead: the
 * near baseline is wider than the glass and simply runs off both sides.
 */
const COURT = {
  farY: 226,
  farL: 1114,
  farR: 1192,
  nearY: 358,
  nearL: 1046,
  nearR: 1260,
};
const COURT_DEPTH = COURT.nearY - COURT.farY; // 132

/** court edges at depth `y`, interpolated down the trapezoid */
function courtEdges(y: number) {
  const t = (y - COURT.farY) / COURT_DEPTH;
  return {
    l: COURT.farL + (COURT.nearL - COURT.farL) * t,
    r: COURT.farR + (COURT.nearR - COURT.farR) * t,
  };
}

const NET_BASE_Y = 292;
const NET_CORD_Y = 279;
const net = courtEdges(NET_BASE_Y); // 1080 → 1226
const NET_POST_L = net.l - 8;
const NET_POST_R = net.r + 8;
const NET_MESH = Array.from(
  { length: 10 },
  (_, i) => net.l + ((net.r - net.l) * (i + 1)) / 11,
);

/* ── timing ────────────────────────────────────────────────────────────── */
const CROSS_MS = 800;
const CROSSINGS = 5;
const WINNER_MS = 600; // the ball sails on past the opponent
const BALL_FADE_MS = 200;
const CELEBRATE_MS = 1800;
const SCENE_FADE_MS = 500;
const SLIDE_IN_MS = 400;
const SLIDE_HOLD_MS = 900;
const LAST_HOLD_MS = 1400;
const RETURN_MS = 600;

const RALLY_END = CROSS_MS * CROSSINGS; // 4000
const WINNER_END = RALLY_END + WINNER_MS; // 4600
const CELEBRATE_END = WINNER_END + CELEBRATE_MS; // 6400
const SCENE_OUT = CELEBRATE_END + SCENE_FADE_MS; // 6900
const POD1_FULL = SCENE_OUT + SLIDE_IN_MS; // 7300
const POD2_IN = POD1_FULL + SLIDE_HOLD_MS; // 8200
const POD2_FULL = POD2_IN + SLIDE_IN_MS; // 8600
const POD3_IN = POD2_FULL + SLIDE_HOLD_MS; // 9500
const POD3_FULL = POD3_IN + SLIDE_IN_MS; // 9900
const POD3_OUT = POD3_FULL + LAST_HOLD_MS; // 11300
const CYCLE_MS = POD3_OUT + RETURN_MS; // 11900

const pct = (ms: number) => `${((ms / CYCLE_MS) * 100).toFixed(3)}%`;

/* ── the rally ─────────────────────────────────────────────────────────────
 * Contact points alternate sides of the court so the players' shift is
 * legible: you strike at 0/2/4, the opponent at 1/3, and 5 is the winner
 * landing beyond their reach.
 */
const CONTACTS = [
  { x: 1153, y: 342 }, // 0 — you serve, centred
  { x: 1132, y: 234 }, // 1 — their left
  { x: 1190, y: 342 }, // 2 — your right
  { x: 1176, y: 234 }, // 3 — their right
  { x: 1116, y: 342 }, // 4 — your left
  { x: 1124, y: 236 }, // 5 — the winner, back to their left
];
/** where the winner ends up once it has run past them */
const BALL_EXIT = { x: 1108, y: 200 };

/** how far above the straight line the ball bows at mid-crossing — enough to
 *  clear the net cord with daylight to spare */
const BOW = 16;
/** samples per crossing — enough that the piecewise-linear path reads curved */
const SAMPLES = 8;
const BALL_R = 3.2;

/** the ball shrinks with depth */
const scaleAt = (y: number) =>
  Math.min(1.05, Math.max(0.4, 0.5 + (0.5 * (y - COURT.farY)) / COURT_DEPTH));

type BallFrame = { t: number; x: number; y: number; s: number };

function ballPath(): BallFrame[] {
  const frames: BallFrame[] = [];
  for (let c = 0; c < CROSSINGS; c++) {
    const a = CONTACTS[c];
    const b = CONTACTS[c + 1];
    for (let i = 0; i <= SAMPLES; i++) {
      // the contact point is shared with the previous crossing's last sample
      if (i === 0 && c > 0) continue;
      const s = i / SAMPLES;
      const lineY = a.y + (b.y - a.y) * s;
      frames.push({
        t: c * CROSS_MS + s * CROSS_MS,
        x: a.x + (b.x - a.x) * s,
        // the arc is a bow off the straight line, not an easing curve — see
        // the note on BALL_CSS below
        y: lineY - BOW * Math.sin(Math.PI * s),
        s: scaleAt(lineY),
      });
    }
  }
  // the winner runs on past the opponent and off the far end
  const steps = 5;
  const last = CONTACTS[CROSSINGS];
  for (let i = 1; i <= steps; i++) {
    const s = i / steps;
    const y = last.y + (BALL_EXIT.y - last.y) * s;
    frames.push({
      t: RALLY_END + s * WINNER_MS,
      x: last.x + (BALL_EXIT.x - last.x) * s,
      y,
      s: scaleAt(y),
    });
  }
  return frames;
}

const BALL_FRAMES = ballPath();
const BALL_HOME = BALL_FRAMES[0];
const ballTransform = (f: { x: number; y: number; s: number }) =>
  `translate(${f.x.toFixed(2)}px, ${f.y.toFixed(2)}px) scale(${f.s.toFixed(3)})`;

/**
 * Every sample is `linear` (set once on `.pa-play` in globals.css). This is
 * the whole fix for the hitch the ball used to have at the net: a CSS
 * `animation-timing-function` applies to each keyframe *interval*, so an
 * `ease-in-out` on the animation eased in and out of every segment and the
 * ball decelerated to a near-stop at each one. The curve belongs in the
 * sampled positions, not in the timing — and a struck ball reversing hard at
 * each contact is truer to tennis anyway.
 */
const BALL_CSS = `@keyframes pa-ball {
${BALL_FRAMES.map((f) => `  ${pct(f.t)} { transform: ${ballTransform(f)}; }`).join("\n")}
  100% { transform: ${ballTransform(BALL_HOME)}; }
}`;

/** the ball is only on court for the rally and the winner */
const BALL_FADE_CSS = `@keyframes pa-ball-fade {
  0%, ${pct(WINNER_END)} { opacity: 1; }
  ${pct(WINNER_END + BALL_FADE_MS)}, 100% { opacity: 0; }
}`;

/* ── the players ───────────────────────────────────────────────────────────
 * Both are drawn centred on 1153 and slide along x to meet the ball, each
 * arriving just before the contact it has to make.
 */
type Shift = [ms: number, dx: number];

/** you: hit from centre, then from your right, then from your left */
const ME_SHIFTS: Shift[] = [
  [0, 0],
  [900, 0],
  [1560, 37],
  [2500, 37],
  [3150, -37],
  [CELEBRATE_END, -37],
];
/**
 * the opponent: across for 1, back for 3, then a lunge at the winner that
 * falls well short — the ball lands at -29 and they only reach -12
 */
const OPP_SHIFTS: Shift[] = [
  [0, 0],
  [750, -21],
  [1650, -21],
  [2350, 23],
  [3250, 23],
  [RALLY_END, -8],
  [RALLY_END + 300, -12],
];

/** Returns to centre are stepped, not eased: they happen while the scene is
 *  faded out for the podium, so nothing should be seen sliding back. */
function shiftCss(name: string, shifts: Shift[]) {
  const frames = shifts.map(
    ([ms, dx]) => `  ${pct(ms)} { transform: translateX(${dx}px); }`,
  );
  const lastDx = shifts[shifts.length - 1][1];
  frames.push(
    `  ${pct(SCENE_OUT)} { transform: translateX(${lastDx}px); animation-timing-function: step-end; }`,
    `  100% { transform: translateX(0px); }`,
  );
  return `@keyframes ${name} {\n${frames.join("\n")}\n}`;
}

/** the arm swap is an opacity cut, not a rotation — a rotated limb just
 *  flickers at this size */
const armCss = (name: string, celebrating: boolean) => {
  const off = celebrating ? 0 : 1;
  const on = celebrating ? 1 : 0;
  return `@keyframes ${name} {
  0% { opacity: ${off}; animation-timing-function: step-end; }
  ${pct(WINNER_END)} { opacity: ${on}; animation-timing-function: step-end; }
  ${pct(SCENE_OUT)} { opacity: ${off}; animation-timing-function: step-end; }
  100% { opacity: ${off}; }
}`;
};

/** the court and both players fade out together for the podium */
const SCENE_CSS = `@keyframes pa-scene {
  0%, ${pct(CELEBRATE_END)} { opacity: 1; }
  ${pct(SCENE_OUT)}, ${pct(POD3_OUT)} { opacity: 0; }
  100% { opacity: 1; }
}`;

/** each podium still fades up as the one before it fades down */
const slideCss = (
  name: string,
  inAt: number,
  full: number,
  outAt: number,
  gone: number,
) => `@keyframes ${name} {
  0%, ${pct(inAt)} { opacity: 0; }
  ${pct(full)}, ${pct(outAt)} { opacity: 1; }
  ${pct(gone)}, 100% { opacity: 0; }
}`;

const SEQUENCE_CSS = [
  BALL_CSS,
  BALL_FADE_CSS,
  shiftCss("pa-me", ME_SHIFTS),
  shiftCss("pa-opp", OPP_SHIFTS),
  armCss("pa-arm-down", false),
  armCss("pa-arm-up", true),
  SCENE_CSS,
  slideCss("pa-pod1", SCENE_OUT, POD1_FULL, POD2_IN, POD2_FULL),
  slideCss("pa-pod2", POD2_IN, POD2_FULL, POD3_IN, POD3_FULL),
  slideCss("pa-pod3", POD3_IN, POD3_FULL, POD3_OUT, CYCLE_MS),
].join("\n");

/** Each element runs its own animation, so they only stay in step if they all
 *  start on the same frame. Keying the screen on the generated CSS remounts
 *  every one of them together whenever the timeline changes. */
const TIMELINE_KEY = [...SEQUENCE_CSS].reduce(
  (h, c) => (h * 31 + c.charCodeAt(0)) | 0,
  0,
);

/** only the name and length go inline — timing function, iteration count and
 *  play-state live in globals.css so hovering the screen can pause it */
const anim = (name: string) => ({
  animationName: name,
  animationDuration: `${CYCLE_MS}ms`,
});

export default function PortraitMonitorScreen() {
  const clipId = useId();

  return (
    <g key={TIMELINE_KEY} aria-hidden>
      <style>{SEQUENCE_CSS}</style>
      <defs>
        <clipPath id={clipId}>
          <rect
            x={PORTRAIT_GLASS.x}
            y={PORTRAIT_GLASS.y}
            width={PORTRAIT_GLASS.w}
            height={PORTRAIT_GLASS.h}
            rx={GLASS_R}
          />
        </clipPath>
      </defs>

      <g clipPath={`url(#${clipId})`}>
        {/* the match. `pa-scene` fades the lot out for the podium; `pa-court`
            inside it carries the hover brighten, because an element already
            running an opacity animation can't also be lit by a hover rule. */}
        <g className="pa-scene pa-play" style={anim("pa-scene")}>
          <g className="pa-court">
            <g stroke={INK} strokeWidth={LINE} fill="none">
              <path
                d={`M${COURT.farL} ${COURT.farY} L${COURT.farR} ${COURT.farY}
                    L${COURT.nearR} ${COURT.nearY} L${COURT.nearL} ${COURT.nearY} Z`}
              />
              <path d={`M${NET_POST_L} ${NET_CORD_Y} L${NET_POST_R} ${NET_CORD_Y}`} />
              <path d={`M${net.l} ${NET_BASE_Y} L${net.r} ${NET_BASE_Y}`} />
              <path d={`M${NET_POST_L} ${NET_CORD_Y} L${NET_POST_L} ${NET_BASE_Y + 4}`} />
              <path d={`M${NET_POST_R} ${NET_CORD_Y} L${NET_POST_R} ${NET_BASE_Y + 4}`} />
              <g strokeWidth={0.7} opacity={0.7}>
                {NET_MESH.map((x) => (
                  <path
                    key={x}
                    d={`M${x.toFixed(1)} ${NET_CORD_Y} L${x.toFixed(1)} ${NET_BASE_Y}`}
                  />
                ))}
              </g>
            </g>

            {/* opponent, behind the far baseline */}
            <g className="pa-opp pa-play" style={anim("pa-opp")}>
              <g stroke={INK} strokeWidth={FIG} fill="none">
                <path d="M1153 201.5 L1153 212" />
                <path d="M1153 212 L1148 224" />
                <path d="M1153 212 L1158 224" />
                <path d="M1153 204 L1141 200" />
                <ellipse cx={1137} cy={199} rx={3.4} ry={2.3} />
              </g>
              <circle cx={1153} cy={198} r={3.2} fill={INK} stroke="none" />
            </g>

            {/* you, behind the near baseline — cropped by the frame, the way a
                broadcast camera crops the near player */}
            <g className="pa-me pa-play" style={anim("pa-me")}>
              <g stroke={INK} strokeWidth={FIG} fill="none">
                <path d="M1153 335.5 L1153 352" />
                <path d="M1153 352 L1146 370" />
                <path d="M1153 352 L1160 370" />
                <path d="M1153 339 L1142 347" />
              </g>
              <g
                className="pa-arm-down pa-play"
                style={anim("pa-arm-down")}
                stroke={INK}
                strokeWidth={FIG}
                fill="none"
              >
                <path d="M1153 339 L1169 344" />
                <ellipse cx={1175} cy={345.5} rx={5.2} ry={3.6} />
              </g>
              <g
                className="pa-arm-up pa-play"
                style={anim("pa-arm-up")}
                stroke={INK}
                strokeWidth={FIG}
                fill="none"
              >
                <path d="M1153 339 L1167 321" />
                <ellipse cx={1170} cy={316} rx={5.2} ry={3.6} />
              </g>
              <circle cx={1153} cy={330} r={5.5} fill={INK} stroke="none" />
            </g>
          </g>

          <g className="pa-ball-fade pa-play" style={anim("pa-ball-fade")}>
            <g className="pa-ball pa-play" style={anim("pa-ball")}>
              <circle cx={0} cy={0} r={BALL_R} fill={BALL_COLOR} stroke="none" />
            </g>
          </g>
        </g>

        {/* ── podium stills ───────────────────────────────────────────── */}
        <g className="pa-pod1 pa-play" style={anim("pa-pod1")}>
          <Podium />
          <Winner />
          <g stroke={INK} strokeWidth={FIG} fill="none">
            <path d="M1153 249 L1139 271" />
            <path d="M1153 249 L1167 271" />
          </g>
        </g>

        <g className="pa-pod2 pa-play" style={anim("pa-pod2")}>
          <Podium />
          <Winner />
          <g stroke={INK} strokeWidth={FIG} fill="none">
            {/* your arms stay down while it's put on you */}
            <path d="M1153 249 L1139 271" />
            <path d="M1153 249 L1167 271" />
            {/* the official's forearm, coming in from the left edge at the
                height of your shoulder */}
            <path d="M1094 249.5 L1120 249.5" />
            {/* the ribbon hangs from the hand as a short V */}
            <path d="M1124 252.5 L1121.5 258.5" />
            <path d="M1124 252.5 L1126.5 258.5" />
          </g>
          {/* A sleeve on the arm, running off the edge of the frame. Without
              it a lone line poking in from the side read as a stick; a cuff
              makes it someone's arm. */}
          <rect
            x={1056}
            y={244.5}
            width={38}
            height={10}
            rx={1.5}
            fill={PAPER}
            stroke={INK}
            strokeWidth={FIG}
          />
          <circle cx={1123} cy={249.5} r={3} fill={INK} stroke="none" />
          <Medal cx={1124} cy={263} />
        </g>

        <g className="pa-pod3 pa-play" style={anim("pa-pod3")}>
          <Podium />
          <Winner />
          <g stroke={INK} strokeWidth={FIG} fill="none">
            {/* both arms up */}
            <path d="M1153 249 L1133 224" />
            <path d="M1153 249 L1173 224" />
            {/* the ribbon, now round your neck — kept short so the medal sits
                at the collar rather than dangling at the waist */}
            <path d="M1149 247 L1152 252" />
            <path d="M1157 247 L1154 252" />
          </g>
          <Medal cy={256} />
        </g>

        {/* the title ribbon sits over everything, opaque, so the court can run
            up behind it */}
        <Banner uid={clipId} />
      </g>
    </g>
  );
}

/**
 * A medal — small against the head (at the size of a head it read as a second
 * one), but a SOLID disc. The earlier hollow black ring vanished against the
 * black glass, especially beside the official's solid hand. The dark centre
 * keeps it reading as a medal rather than another dot.
 */
function Medal({ cx = 1153, cy }: { cx?: number; cy: number }) {
  return (
    <>
      <circle cx={cx} cy={cy} r={4.5} fill={GOLD} stroke={GOLD_DARK} strokeWidth={0.8} />
      <circle cx={cx} cy={cy} r={1.6} fill={GOLD_DARK} stroke="none" />
    </>
  );
}

/**
 * The three blocks, centre tallest. They run off the bottom and both sides of
 * the glass and are clipped — a podium shot is a close one, and sizing the
 * whole thing to fit left the figure too small for the medal to scale against.
 */
function Podium() {
  return (
    <g stroke={INK} strokeWidth={FIG} fill={PAPER}>
      <rect x={1048} y={322} width={70} height={50} />
      <rect x={1188} y={330} width={70} height={42} />
      <rect x={1118} y={300} width={70} height={72} />
      <g fill={INK} stroke="none" fontFamily={MONO} fontSize={16} textAnchor="middle">
        <text x={1085} y={341} dominantBaseline="central">
          2
        </text>
        <text x={1221} y={348} dominantBaseline="central">
          3
        </text>
        <text x={1153} y={322} dominantBaseline="central">
          1
        </text>
      </g>
    </g>
  );
}

/** you, on the top step — head, body and legs; each frame adds its own arms */
function Winner() {
  return (
    <>
      <g stroke={INK} strokeWidth={FIG} fill="none">
        <path d="M1153 243 L1153 272" />
        <path d="M1153 272 L1145 300" />
        <path d="M1153 272 L1161 300" />
      </g>
      <circle cx={1153} cy={236} r={7} fill={INK} stroke="none" />
    </>
  );
}

/**
 * The title on a ribbon banner, built the way a drawn ribbon is:
 *
 *            ╭───── front panel, arched ─────╮
 *     ◁▔▔▔▔▔┤          PERSONAL             ├▔▔▔▔▔▷
 *     tail  │          & AWARDS             │  tail
 *     ◁▁▁▁▁▁◣ ╰─────────────────────────────╯ ◢▁▁▁▁▁▷
 *           fold                             fold
 *
 * The tails sit BEHIND the panel's ends and hang lower than it, each cut with
 * a swallowtail notch; the solid fold triangles show where the ribbon turns
 * back on itself. The text follows the arch on a `textPath`, and a stitched
 * border runs round the inside of the panel.
 *
 * Everything stays inside the glass (1074–1232). The first version ran its
 * tails off both edges, and the clip cut away exactly the notches that made
 * it a ribbon — leaving a plain box.
 */
function Banner({ uid }: { uid: string }) {
  const line1 = `${uid}-title-1`;
  const line2 = `${uid}-title-2`;
  return (
    <g>
      <defs>
        {/* baselines for the two lines of text, following the panel's arch */}
        <path id={line1} d="M1100 168 Q1153 158 1206 168" />
        <path id={line2} d="M1100 185 Q1153 175 1206 185" />
      </defs>

      {/* tails, behind the panel, hanging lower than it, notched */}
      <g stroke={INK} strokeWidth={FIG} fill={PAPER} strokeLinejoin="round">
        <path d="M1106 158 L1078 160 L1090 180 L1078 200 L1106 204 Z" />
        <path d="M1200 158 L1228 160 L1216 180 L1228 200 L1200 204 Z" />
      </g>

      {/* folds, where the ribbon turns back from the panel to each tail */}
      <g fill={INK} stroke="none">
        <path d="M1098 194 L1106 194 L1106 204 Z" />
        <path d="M1208 194 L1200 194 L1200 204 Z" />
      </g>

      {/* front panel */}
      <path
        d="M1098 146 Q1153 136 1208 146 L1208 194 Q1153 184 1098 194 Z"
        fill={PAPER}
        stroke={INK}
        strokeWidth={FIG}
        strokeLinejoin="round"
      />
      {/* stitching */}
      <path
        d="M1102 150 Q1153 140 1204 150 L1204 190 Q1153 180 1102 190 Z"
        fill="none"
        stroke={INK}
        strokeWidth={0.7}
        strokeDasharray="2 1.6"
        opacity={0.7}
      />

      <g fill={INK} stroke="none" fontFamily={MONO} fontSize={TITLE_SIZE} fontWeight={600}>
        <text textAnchor="middle">
          <textPath href={`#${line1}`} startOffset="50%">
            PERSONAL
          </textPath>
        </text>
        <text textAnchor="middle">
          <textPath href={`#${line2}`} startOffset="50%">
            &amp; AWARDS
          </textPath>
        </text>
      </g>
    </g>
  );
}
