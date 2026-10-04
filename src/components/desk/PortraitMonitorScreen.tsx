"use client";

import { useId } from "react";
import { screenById } from "@/lib/desk";
import { mulberry32 } from "@/lib/svg";
import {
  BALL,
  COURT_LINES,
  COURT_SURFACE,
  CYCLE_MS,
  MATCH_CSS,
  ME,
  NET,
  OPP,
  PODIUM,
  PODIUM_RIG,
  RIG,
  SHADOW,
  TIMELINE,
  pct,
  type Anim,
  type ArmAnims,
  type PlayerAnims,
} from "./tennisRally";

/**
 * Screen 4 — the portrait monitor, the only tall screen on the desk.
 *
 * One looping story, filling the glass (the screen's name is on the neon
 * sign above it, `NeonSigns`):
 *
 *   a point (serve, three rally shots, a winner) → celebration →
 *   the podium, lifting the trophy → repeat
 *
 * The motion — the court, the ball's flight, both players' footwork and
 * swings, the trophy lift — is worked out in `tennisRally.ts`; this file
 * draws it. You are the near player and serve; the opponent returns twice and
 * can't reach your backhand down the line.
 *
 * The court, the near player and the podium run past the glass and are
 * clipped to it — a broadcast camera crops the court's near corners, and the
 * podium is a close shot. `clipPath` is what makes the overflow safe; without
 * it this spills over the desk and the wall.
 *
 * Every element runs off one generated timeline (`CYCLE_MS`) so they cannot
 * drift apart — the pattern `LaptopSkillsScreen` uses for its typing: build
 * the clock in ms, emit `@keyframes` into an inline `<style>`, and key the
 * root `<g>` on a hash of that CSS so a hot reload remounts everything in step
 * rather than starting new elements mid-cycle.
 *
 * Coordinates are absolute desk-viewBox units (the screens 2 and 3
 * convention), inside `DeskSvg`'s outer `<g stroke={INK} strokeWidth={2.4}>` —
 * so every fill needs `stroke="none"` and every stroked line its own
 * `strokeWidth`, since 2.4 would swallow detail this small.
 */
const INK = "var(--ink, #f4f6f8)";
const PAPER = "var(--paper, #000)";
/** by the colour rule (top of globals.css) the drawing is ink — the court
 *  just a faint wash of it, so it still reads as a surface — and the glow
 *  goes to the two things the story is about: the ball and the trophy */
const COURT_FILL = "rgba(255, 255, 255, 0.07)";
/** on black glass a dark shadow vanishes, so the ball's mark on the court is
 *  a faint pool of ink instead — enough to show how high the ball is */
const SHADOW_FILL = "rgba(255, 255, 255, 0.22)";
const STRINGS = "rgba(255, 255, 255, 0.16)";
const GLOW = "var(--glow, #ffbe5c)";
const BALL_FILL = GLOW;
const TROPHY = GLOW;
const SERIF = "var(--font-fraunces), Georgia, serif";
const PORTRAIT_GLASS = screenById("about").glass;
/** the glass's own corner radius (`max(2, r - 4)` for `r={10}`) */
const GLASS_R = 6;

/** line weights — the figures carry more than the court so they read as
 *  subjects rather than markings */
const LINE = 0.95;
const FIG = 1.8;

/** The whole picture was laid out for the glass below a two-line title strip
 *  (y≈188 down), which has since gone. Rather than re-place every coordinate,
 *  the scene is scaled up by this much about the glass's bottom-centre: it
 *  grows to fill the taller glass, and what ran off the bottom edge (the
 *  podium) still does. */
const SCENE_SCALE = 1.2;
const SCENE_ANCHOR = {
  x: PORTRAIT_GLASS.x + PORTRAIT_GLASS.w / 2,
  y: PORTRAIT_GLASS.y + PORTRAIT_GLASS.h,
};
const SCENE_TRANSFORM =
  `translate(${SCENE_ANCHOR.x} ${SCENE_ANCHOR.y}) scale(${SCENE_SCALE}) ` +
  `translate(${-SCENE_ANCHOR.x} ${-SCENE_ANCHOR.y})`;

const T = TIMELINE;

/** the court and both players fade out together for the podium… */
const SCENE_CSS = `@keyframes pa-scene {
  0%, ${pct(T.celebrateEnd)} { opacity: 1; }
  ${pct(T.sceneOut)}, ${pct(T.podiumOut)} { opacity: 0; }
  100% { opacity: 1; }
}`;

/** …which fades up in the dark between, and back out as the court returns */
const PODIUM_CSS = `@keyframes pa-podium {
  0%, ${pct(T.sceneOut)} { opacity: 0; }
  ${pct(T.podiumFull)}, ${pct(T.podiumOut)} { opacity: 1; }
  100% { opacity: 0; }
}`;

const SEQUENCE_CSS = [MATCH_CSS, SCENE_CSS, PODIUM_CSS].join("\n");

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

/** a moving part also carries its resting transform inline: an animation
 *  overrides it, and under reduced motion (animations off) it is the still */
const move = (a: Anim) => ({ ...anim(a.name), transform: a.rest });

export default function PortraitMonitorScreen() {
  const clipId = useId();

  return (
    <g key={TIMELINE_KEY} aria-hidden className="screen-light" data-light="about">
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
        <g transform={SCENE_TRANSFORM}>
          {/* the match. `pa-scene` fades the lot out for the podium; `pa-court`
              inside it carries the hover brighten, because an element already
              running an opacity animation can't also be lit by a hover rule. */}
          <g className="pa-scene pa-play" style={anim("pa-scene")}>
            <g className="pa-court">
              <path d={COURT_SURFACE} fill={COURT_FILL} stroke="none" />
              <g stroke={INK} strokeWidth={LINE} fill="none" strokeLinecap="square">
                {COURT_LINES.map((d) => (
                  <path key={d} d={d} />
                ))}
              </g>

              {/* the ball's shadow lies on the court, under everything else */}
              <g className="pa-ball-fade pa-play" style={anim("pa-ball-fade")}>
                <g className="pa-play" style={move(SHADOW)}>
                  <ellipse rx={0.95} ry={0.38} fill={SHADOW_FILL} stroke="none" />
                </g>
              </g>

              {/* the opponent is beyond the net, so it is drawn over them */}
              <Player p={OPP} />

              <g stroke={INK} fill="none" strokeLinecap="round">
                <g strokeWidth={0.5} opacity={0.55}>
                  {NET.mesh.map((d) => (
                    <path key={d} d={d} />
                  ))}
                </g>
                <path d={NET.foot} strokeWidth={0.6} opacity={0.7} />
                {NET.posts.map((d) => (
                  <path key={d} d={d} strokeWidth={1.3} />
                ))}
                {/* the white band along the top */}
                <path d={NET.cord} strokeWidth={1.3} />
              </g>

              <Player p={ME} />
            </g>

            <g className="pa-ball-fade pa-play" style={anim("pa-ball-fade")}>
              <g className="pa-play" style={move(BALL)}>
                <circle r={1} fill={BALL_FILL} stroke="none" />
              </g>
            </g>
          </g>

          {/* ── the podium ──────────────────────────────────────────────── */}
          <g className="pa-podium pa-play" style={anim("pa-podium")}>
            <PodiumShot glowId={`${clipId}-spot`} />
          </g>
        </g>
      </g>
    </g>
  );
}

/**
 * One player: a jointed cut-out in metres (feet at the origin, y down — see
 * `RIG`), placed and sized for its depth by the `body` animation. Each joint
 * is a group rotated about its own origin, nested so the hand follows the
 * elbow and the racket follows the hand: shoulder → elbow → wrist → racket.
 * The far player is the same rig mirrored — they face the camera, so their
 * forehand is on screen-left.
 */
function Player({ p }: { p: PlayerAnims }) {
  return (
    <g className="pa-play" style={move(p.body)}>
      <g
        transform={p.mirror ? "scale(-1 1)" : undefined}
        stroke={INK}
        strokeWidth={p.stroke}
        fill="none"
        strokeLinecap="round"
      >
        <g transform={`translate(0 ${-RIG.hip})`}>
          <g className="pa-play" style={move(p.legL)}>
            <path d={`M0 0 L0 ${RIG.leg}`} />
          </g>
          <g className="pa-play" style={move(p.legR)}>
            <path d={`M0 0 L0 ${RIG.leg}`} />
          </g>
        </g>
        <path d={`M0 ${-RIG.hip} L0 ${-RIG.neck}`} />
        <g transform={`translate(0 ${-RIG.shoulder})`}>
          <g className="pa-play" style={move(p.off)}>
            <path d={`M0 0 L0 ${RIG.offArm}`} />
          </g>
          <g className="pa-play" style={move(p.sh)}>
            <path d={`M0 0 L0 ${RIG.upper}`} />
            <g transform={`translate(0 ${RIG.upper})`}>
              <g className="pa-play" style={move(p.el)}>
                <path d={`M0 0 L0 ${RIG.fore}`} />
                <g transform={`translate(0 ${RIG.fore})`}>
                  {/* the racket is a lighter line than the arm holding it */}
                  <g className="pa-play" style={move(p.wr)} strokeWidth={p.stroke * 0.6}>
                    <path d={`M0 0 L0 ${RIG.grip}`} />
                    <ellipse
                      cy={RIG.grip + RIG.racketHalf}
                      rx={RIG.racketW}
                      ry={RIG.racketHalf}
                      fill={STRINGS}
                    />
                  </g>
                </g>
              </g>
            </g>
          </g>
        </g>
        <circle cy={-RIG.headY} r={RIG.headR} fill={INK} stroke="none" />
      </g>
    </g>
  );
}


/* ── the podium ────────────────────────────────────────────────────────────
 * One shot of the ceremony (choreographed in `tennisRally.ts`): the three
 * finishers on their steps in front of the stands, under a soft spotlight;
 * you bring the trophy up from your waist to your chest and up over your head,
 * the other two clap, and confetti comes down. The steps run off the bottom
 * of the glass and the crowd off the top — it's a close shot, so the figures
 * are big enough for their arms and the trophy to read.
 */

/** units per metre for the podium's figures */
const PODIUM_K = 40;
/** where the outer steps' top faces recede to — the camera's centre line */
const PODIUM_VANISH_X = 1153;

type Step = { place: 1 | 2 | 3; x0: number; x1: number; top: number; label: number };
/** drawn in this order, so the top step covers the inner ends of the others */
const STEPS: Step[] = [
  { place: 2, x0: 1084, x1: 1129, top: 340, label: 12 },
  { place: 3, x0: 1177, x1: 1222, top: 347, label: 11 },
  { place: 1, x0: 1129, x1: 1177, top: 330, label: 15 },
];
const STEP_BOTTOM = 372; // past the bottom of the glass
const STEP_TOP_DEPTH = 4.5;
/** where each finisher stands — on the top face, centred on the visible
 *  part of their step */
const STANDS = {
  1: { x: 1153, y: 328 },
  2: { x: 1108.5, y: 338 },
  3: { x: 1197.5, y: 345 },
};

/** a few rows of spectators behind the podium, seeded so SSR and client agree */
const CROWD = (() => {
  const rnd = mulberry32(31);
  const people: { x: number; y: number; s: number }[] = [];
  for (let row = 0; row < 4; row++) {
    const s = 1 + row * 0.12; // nearer rows a touch bigger
    const gap = 8.2 * s;
    for (let x = 1078 + (row % 2) * (gap / 2); x < 1230; x += gap) {
      people.push({ x: x + (rnd() - 0.5) * 2, y: 196 + row * 11.5 + (rnd() - 0.5) * 1.5, s });
    }
  }
  return people;
})();
const BARRIER_Y = 241;

function PodiumShot({ glowId, still = false }: { glowId: string; still?: boolean }) {
  return (
    <>
      <defs>
        <radialGradient id={glowId}>
          <stop offset="0%" stopColor="#fff" stopOpacity={0.11} />
          <stop offset="100%" stopColor="#fff" stopOpacity={0} />
        </radialGradient>
      </defs>

      {/* the stands, behind a barrier */}
      <g fill={INK} stroke="none" opacity={0.15}>
        {CROWD.map(({ x, y, s }) => (
          <g key={`${x.toFixed(1)}-${y.toFixed(1)}`}>
            <circle cx={x} cy={y} r={2.1 * s} />
            <path
              d={`M${(x - 3.6 * s).toFixed(1)} ${(y + 6 * s).toFixed(1)}
                  Q${x.toFixed(1)} ${(y + 0.6 * s).toFixed(1)} ${(x + 3.6 * s).toFixed(1)} ${(y + 6 * s).toFixed(1)} Z`}
            />
          </g>
        ))}
      </g>
      <rect x={1060} y={BARRIER_Y} width={190} height={11} fill="rgba(255, 255, 255, 0.05)" stroke="none" />
      <path
        d={`M1060 ${BARRIER_Y} L1250 ${BARRIER_Y}`}
        stroke={INK}
        strokeWidth={0.7}
        opacity={0.45}
      />

      {/* a spotlight pooled on the top step */}
      <ellipse cx={1153} cy={292} rx={48} ry={72} fill={`url(#${glowId})`} stroke="none" />

      {STEPS.map((s) => (
        <PodiumStep key={s.place} step={s} />
      ))}

      {/* the runners-up a shade back, so the eye goes to the top step */}
      <PodiumFigure at={STANDS[2]} arms={PODIUM.second} still={still} dim />
      <PodiumFigure at={STANDS[3]} arms={PODIUM.third} still={still} dim />
      <PodiumFigure at={STANDS[1]} arms={PODIUM.winner} still={still} winner />

      {PODIUM.confetti.map(({ anim: a, w, h, opacity }) => (
        <g key={a.name} className="pa-play" style={podiumMove(a, still)}>
          <rect x={-w / 2} y={-h / 2} width={w} height={h} fill={INK} stroke="none" opacity={opacity} />
        </g>
      ))}
    </>
  );
}

/** a podium part's transform: animated, or frozen in the shot's last beat */
const podiumMove = (a: Anim, still: boolean) => (still ? { transform: a.still } : move(a));

/** one step: a plain front face with its place on it, and a top face
 *  receding toward the camera's centre line */
function PodiumStep({ step: { place, x0, x1, top, label } }: { step: Step }) {
  const back = (x: number) => PODIUM_VANISH_X + (x - PODIUM_VANISH_X) * 0.96;
  const rear = top - STEP_TOP_DEPTH;
  return (
    <g stroke={INK} strokeWidth={1.2} strokeLinejoin="round">
      <path
        d={`M${x0} ${top} L${x1} ${top} L${back(x1)} ${rear} L${back(x0)} ${rear} Z`}
        fill="rgba(255, 255, 255, 0.14)"
      />
      <rect x={x0} y={top} width={x1 - x0} height={STEP_BOTTOM - top} fill={PAPER} />
      <text
        x={(Math.max(x0, 1090) + Math.min(x1, 1216)) / 2}
        y={top + { 1: 19.5, 2: 15.5, 3: 13.5 }[place]}
        fill={INK}
        stroke="none"
        fontFamily={SERIF}
        fontWeight={600}
        fontSize={label}
        textAnchor="middle"
        dominantBaseline="central"
      >
        {place}
      </text>
    </g>
  );
}

/**
 * A finisher on the podium — the court's stick figure with just enough added
 * for a closer shot: a shoulder line, elbows and dots for hands. Clothes,
 * shoes and a headband were tried and read as too much. Feet at `at`,
 * in metres scaled by `PODIUM_K` (y down, see `PODIUM_RIG`). The arms hang
 * from the shoulder ends, not the neck, and are shorter than the torso is
 * long: hanging, the hands stop at the hip.
 */
function PodiumFigure({
  at,
  arms,
  still,
  dim = false,
  winner = false,
}: {
  at: { x: number; y: number };
  arms: ArmAnims;
  still: boolean;
  dim?: boolean;
  winner?: boolean;
}) {
  const R = PODIUM_RIG;
  const line = FIG / PODIUM_K;
  const arm = (side: 1 | -1, u: Anim, f: Anim) => (
    <g transform={`translate(${side * R.shoulderX} ${-R.shoulderY})`}>
      <g className="pa-play" style={podiumMove(u, still)}>
        <path d={`M0 0 L0 ${R.upper}`} />
        <g transform={`translate(0 ${R.upper})`}>
          <g className="pa-play" style={podiumMove(f, still)}>
            <path d={`M0 0 L0 ${R.fore}`} />
            <circle cy={R.fore} r={R.handR} fill={INK} stroke="none" />
          </g>
        </g>
      </g>
    </g>
  );

  return (
    <g
      transform={`translate(${at.x} ${at.y}) scale(${PODIUM_K})`}
      stroke={INK}
      strokeWidth={line}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      opacity={dim ? 0.72 : 1}
    >
      {/* legs from the hip, the spine up to the head, and the shoulders */}
      <path
        d={`M${-R.stance} 0 L0 ${-R.hip} L${R.stance} 0
            M0 ${-R.hip} L0 ${-R.headY}
            M${-R.shoulderX} ${-R.shoulderY} L${R.shoulderX} ${-R.shoulderY}`}
      />
      <circle cy={-R.headY} r={R.headR} fill={INK} stroke="none" />
      {/* the trophy, held by its base — under the hands */}
      {winner && (
        <g className="pa-play" style={podiumMove(PODIUM.trophy, still)}>
          <Trophy />
        </g>
      )}

      {arm(1, arms.ru, arms.rf)}
      {arm(-1, arms.lu, arms.lf)}
    </g>
  );
}

/**
 * The trophy, in metres around the grip (the middle of its base, where both
 * hands hold it): a footed cup with two handles, about 0.6 m tall. It is the
 * one lit thing on the podium, so it takes the glow — one solid colour, no
 * lines picked out on it.
 */
function Trophy() {
  return (
    <g fill={TROPHY} stroke="none">
      <path d="M-0.12 0.04 L0.12 0.04 L0.085 -0.035 L-0.085 -0.035 Z" />
      <path d="M-0.028 -0.03 L0.028 -0.03 L0.022 -0.16 L-0.022 -0.16 Z" />
      <ellipse cy={-0.1} rx={0.045} ry={0.022} />
      <path
        d="M-0.18 -0.44 C-0.33 -0.46 -0.32 -0.27 -0.1 -0.24 M0.18 -0.44 C0.33 -0.46 0.32 -0.27 0.1 -0.24"
        fill="none"
        stroke={TROPHY}
        strokeWidth={0.035}
        strokeLinecap="round"
      />
      <path d="M-0.2 -0.5 C-0.2 -0.3 -0.1 -0.17 0 -0.16 C0.1 -0.17 0.2 -0.3 0.2 -0.5 Z" />
      <ellipse cy={-0.5} rx={0.2} ry={0.035} />
    </g>
  );
}

/** The podium's last beat on its own — trophy overhead, confetti in the air —
 *  as its own `<svg>`, framed on the podium's corner of the desk viewBox. */
export function PodiumStill({ className }: { className?: string }) {
  const glowId = useId();
  return (
    <svg
      viewBox="1086 196 134 176"
      className={className}
      aria-hidden
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <PodiumShot glowId={glowId} still />
    </svg>
  );
}
