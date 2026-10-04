/**
 * The tennis point the portrait monitor plays, and the podium after it —
 * `PortraitMonitorScreen` draws them; this file works them out. Nothing here
 * touches the DOM: it all runs once at module load and comes out as numbers,
 * path data and `@keyframes`.
 *
 * Three things make it read as tennis rather than a dot drifting between two
 * stick figures:
 *
 *   - the court is a regulation court seen through a real perspective camera,
 *     so its lines fall where a broadcast shot puts them — the far half
 *     squeezed up against the net, the near half spread out;
 *   - the ball flies on gravity: it is struck, arcs over the net, bounces with
 *     some of its speed taken off, and is hit again on the rise or the fall,
 *     with a shadow on the court so the height reads;
 *   - the players are jointed (shoulder, elbow, wrist, a free arm, two legs)
 *     and swing through takeback → contact → follow-through. Each receiver's
 *     feet are worked BACKWARDS from where the ball will be, so at every
 *     contact the centre of the strings is exactly on the ball.
 *
 * Units. The world is metres: `x` across the court (+ is screen-right), `z`
 * down its length from the near baseline (0) to the far one, `h` up. What is
 * drawn is in desk-viewBox units inside the screen's `SCENE_TRANSFORM`. A
 * player is a flat cut-out standing upright at its own depth, scaled by the
 * camera's metres-to-units there (`scaleAt`) — and the ball's height uses the
 * same scale, which is what lets a racket and a ball meet exactly.
 *
 * Every moving part is one CSS animation on one shared clock (`CYCLE_MS`),
 * keyed from here; the poses between keys are left to the browser's
 * interpolation and the easing named on each key. `sample` mirrors that
 * interpolation in JS, so anything that has to sit ON a moving part (the ball
 * in the server's hand) is placed with the same maths the browser uses.
 */

import { mulberry32 } from "@/lib/svg";

/* ── court ─────────────────────────────────────────────────────────────── */
export const COURT = {
  length: 23.77,
  /** half-widths */
  doubles: 5.485,
  singles: 4.115,
  /** service line, measured from the net */
  service: 6.4,
  netCentre: 0.914,
  netPost: 1.07,
  /** posts stand this far outside the doubles sidelines */
  postOut: 0.914,
  /** 0.1 in the rules — tripled so it survives at this size */
  centreMark: 0.3,
} as const;
const NET_Z = COURT.length / 2;

/* ── camera ────────────────────────────────────────────────────────────────
 * A pinhole camera behind and above the near baseline, no roll, centred on the
 * court. For such a camera the ground projects as
 *     x' = cx + x·S/(z+C)      y' = horizon + G/(z+C)
 * so it is fixed by where the two baselines sit and how wide they are. The
 * near doubles baseline is wider than the glass and runs off both sides; the
 * singles court stays in frame.
 */
const VIEW = {
  cx: 1153,
  nearY: 350,
  farY: 224,
  nearW: 150,
  /** near baseline ÷ far baseline, on screen — the strength of the taper */
  depth: 1.7,
};
const CAM_C = COURT.length / (VIEW.depth - 1);
const CAM_S = (VIEW.nearW / (2 * COURT.doubles)) * CAM_C;
const CAM_G =
  (VIEW.nearY - VIEW.farY) / (1 / CAM_C - 1 / (COURT.length + CAM_C));
const HORIZON_Y = VIEW.nearY - CAM_G / CAM_C;

/** units per metre at depth `z` */
const scaleAt = (z: number) => CAM_S / (z + CAM_C);

type Pt = { x: number; y: number };

/** a world point to the screen; height uses the cut-out scale at its depth */
function project(x: number, z: number, h = 0): Pt {
  const k = scaleAt(z);
  return { x: VIEW.cx + x * k, y: HORIZON_Y + CAM_G / (z + CAM_C) - h * k };
}

const f2 = (n: number) => n.toFixed(2);
const seg = (a: Pt, b: Pt) => `M${f2(a.x)} ${f2(a.y)} L${f2(b.x)} ${f2(b.y)}`;
const line = (x0: number, z0: number, x1: number, z1: number) =>
  seg(project(x0, z0), project(x1, z1));

const { length: L, doubles: D, singles: SG } = COURT;
const SERVICE_NEAR = NET_Z - COURT.service;
const SERVICE_FAR = NET_Z + COURT.service;

/** the playing surface — the doubles court */
export const COURT_SURFACE = [
  project(-D, 0),
  project(D, 0),
  project(D, L),
  project(-D, L),
]
  .map((p, i) => `${i ? "L" : "M"}${f2(p.x)} ${f2(p.y)}`)
  .join(" ")
  .concat(" Z");

/** every line on a hard court */
export const COURT_LINES = [
  line(-D, 0, D, 0), // baselines
  line(-D, L, D, L),
  line(-D, 0, -D, L), // doubles sidelines
  line(D, 0, D, L),
  line(-SG, 0, -SG, L), // singles sidelines
  line(SG, 0, SG, L),
  line(-SG, SERVICE_NEAR, SG, SERVICE_NEAR), // service lines
  line(-SG, SERVICE_FAR, SG, SERVICE_FAR),
  line(0, SERVICE_NEAR, 0, SERVICE_FAR), // centre service line
  line(0, 0, 0, COURT.centreMark), // centre marks
  line(0, L, 0, L - COURT.centreMark),
];

const POST_X = D + COURT.postOut;
/** the net cord sags from the posts to the centre strap */
const netH = (x: number) =>
  COURT.netCentre + (COURT.netPost - COURT.netCentre) * (x / POST_X) ** 2;
const cordL = project(-POST_X, NET_Z, COURT.netPost);
const cordR = project(POST_X, NET_Z, COURT.netPost);
const cordMid = project(0, NET_Z, COURT.netCentre);

export const NET = {
  /** where the net meets the court */
  foot: line(-POST_X, NET_Z, POST_X, NET_Z),
  /** a quadratic through the centre strap: control = 2·mid − (ends)/2 */
  cord:
    `M${f2(cordL.x)} ${f2(cordL.y)} Q${f2(cordMid.x)} ` +
    `${f2(2 * cordMid.y - (cordL.y + cordR.y) / 2)} ${f2(cordR.x)} ${f2(cordR.y)}`,
  posts: [-POST_X, POST_X].map((x) =>
    seg(project(x, NET_Z), project(x, NET_Z, COURT.netPost + 0.08)),
  ),
  mesh: Array.from({ length: 13 }, (_, i) => -POST_X + ((i + 1) * 2 * POST_X) / 14).map(
    (x) => seg(project(x, NET_Z, netH(x)), project(x, NET_Z)),
  ),
};

/* ── the players ───────────────────────────────────────────────────────────
 * Cut-outs in metres, feet at the origin, y DOWN (so heights are negative) —
 * the rig `PortraitMonitorScreen` draws inside each player's `body` group.
 * Drawn a little larger than life (about 2.15 m to the top of the head), or
 * the far player is a smudge.
 */
export const RIG = {
  hip: 0.95,
  leg: 0.99,
  neck: 1.6,
  /** both arms hang from here */
  shoulder: 1.5,
  headR: 0.26,
  headY: 1.91,
  upper: 0.36,
  fore: 0.34,
  /** hand to the throat of the racket, then the head's half-length/width */
  grip: 0.27,
  racketHalf: 0.25,
  racketW: 0.165,
  offArm: 0.66,
} as const;
const RACKET_REACH = RIG.grip + RIG.racketHalf; // hand → centre of the strings

/**
 * A pose of the arms, as the direction of each segment in degrees — the angle
 * an SVG `rotate()` turns a limb drawn hanging straight down: 0 down, 90
 * screen-left, ±180 up, -90 screen-right (for the near player, whose right is
 * screen-right; the far player is the same rig mirrored). `rs` and `os`
 * stretch the racket and the free arm along their length, which is how they
 * swing into and out of the screen: 1 side-on, 0 end-on, -1 turned through.
 */
type Arms = {
  u: number; // racket arm, upper
  f: number; // racket arm, forearm
  r: number; // racket
  rs?: number;
  o: number; // free arm
  os?: number;
};
/** each leg's direction, and its stretch — under 1 is a knee coming up */
type Legs = { l: number; r: number; ls?: number; rs?: number };

/** racket up and a little out to the right, the free hand on its throat —
 *  straight up in front of the body, it was lost behind the torso */
const READY: Arms = { u: -30, f: 20, r: -150, o: -35, os: 0.55 };

/**
 * A forehand seen from behind: the racket goes back and up (unit turn), loops
 * down below the ball, comes up through contact out to the side at waist
 * height, and wraps over the far shoulder. `through` is there to make the
 * follow-through go OVER the top — between two poses every segment takes the
 * shorter way round.
 */
const FOREHAND = {
  back: { u: -72, f: -122, r: -142, o: -62, os: 0.85 },
  drop: { u: -48, f: -78, r: -32, o: -40, os: 0.8 },
  contact: { u: -45, f: -55, r: -84, o: 48, os: 0.85 },
  through: { u: -118, f: -168, r: -192, o: 40, os: 0.6 },
  finish: { u: -198, f: -298, r: -338, o: 18, os: 0.45 },
  recover: { u: 25, f: 85, r: 160, o: 0, os: 0.5 },
} satisfies Record<string, Arms>;

/** a one-handed backhand is the forehand reflected across the body */
const mirrorArms = (p: Arms): Arms => ({ ...p, u: -p.u, f: -p.f, r: -p.r, o: -p.o });
const BACKHAND = Object.fromEntries(
  Object.entries(FOREHAND).map(([k, p]) => [k, mirrorArms(p)]),
) as typeof FOREHAND;

/**
 * The serve: the free arm lifts the ball straight up (shrinking through
 * end-on rather than sweeping round), the racket arm folds into the trophy
 * position, the racket drops down the back (`rs` turning it through), the arm
 * extends straight up to meet the ball at full stretch and comes down across
 * the body.
 */
const SERVE = {
  // the ball held at the left hip, where the free arm can be seen
  stance: { u: -12, f: -18, r: -40, rs: 1, o: 28, os: 0.75 },
  // the tossing arm finishes up and out to the left, clear of the head
  toss: { u: -70, f: -110, r: -150, rs: 1, o: -36, os: -1 },
  trophy: { u: -100, f: -176, r: -178, rs: 1, o: -38, os: -1.02 },
  drop: { u: -98, f: -178, r: -180, rs: -0.9, o: 25, os: 0.2 },
  contact: { u: -170, f: -172, r: -174, rs: 1, o: 30, os: 0.7 },
  through: { u: -250, f: -258, r: -268, rs: 1, o: 25, os: 0.6 },
  finish: { u: -335, f: -325, r: -320, rs: 1, o: 10, os: 0.55 },
} satisfies Record<string, Arms>;

/** reaching for a ball they won't get — arm and racket flat out */
const LUNGE: Arms = { u: -82, f: -86, r: -90, o: 62, os: 0.9 };
const SLUMP: Arms = { u: -6, f: -4, r: -2, o: 6, os: 1 };
/** both arms up in a V, racket high */
const CHEER: Arms = { u: -132, f: -142, r: -160, o: 128, os: 1 };

const STANCE: Legs = { l: 15, r: -15 };
const WIDE: Legs = { l: 23, r: -23 };
const SPLIT: Legs = { l: 8, r: -8 };
/** feet planted wide to reach — the hips drop by `LUNGE_DROP` to keep the
 *  splayed feet on the court */
const LUNGE_LEGS: Legs = { l: 36, r: -36 };
const LUNGE_DROP = RIG.hip - RIG.leg * Math.cos((36 * Math.PI) / 180);
/** the two halves of a running stride */
const STRIDE: [Legs, Legs] = [
  { l: 22, r: -6, ls: 0.84 },
  { l: 6, r: -22, rs: 0.84 },
];

const rad = (deg: number) => (deg * Math.PI) / 180;
/** where a limb of length `len`, drawn hanging down, points after `rotate(a)` */
const limb = (a: number, len: number): Pt => ({
  x: -len * Math.sin(rad(a)),
  y: len * Math.cos(rad(a)),
});

/** centre of the strings, relative to the feet (y down) */
function racketHead(p: Arms): Pt {
  const u = limb(p.u, RIG.upper);
  const f = limb(p.f, RIG.fore);
  const r = limb(p.r, RACKET_REACH * (p.rs ?? 1));
  return { x: u.x + f.x + r.x, y: -RIG.shoulder + u.y + f.y + r.y };
}

/** the free hand, relative to the feet (y down) */
function freeHand(o: number, os: number): Pt {
  const h = limb(o, RIG.offArm * os);
  return { x: h.x, y: -RIG.shoulder + h.y };
}

/* ── keyframes ─────────────────────────────────────────────────────────────
 * A track is a list of keys; each key's easing shapes the interval up to the
 * next one, exactly as `animation-timing-function` inside `@keyframes` does.
 */
type Ease = "linear" | "in" | "out" | "inOut" | "cut";
type Key = { t: number; v: number[]; e: Ease };

/** the CSS keyword curves — short to write out a few hundred times */
const BEZIER = {
  in: [0.42, 0, 1, 1],
  out: [0, 0, 0.58, 1],
  inOut: [0.42, 0, 0.58, 1],
} as const;
const EASE_CSS = { in: "ease-in", out: "ease-out", inOut: "ease-in-out", cut: "step-start" };

function easeCss(e: Ease) {
  return e === "linear" ? null : EASE_CSS[e]; // `.pa-play` already runs linear
}

/** the browser's `cubic-bezier()`, so JS can find a moving part mid-ease */
function easeAt(e: Ease, p: number) {
  if (e === "linear") return p;
  if (e === "cut") return 1;
  const [x1, y1, x2, y2] = BEZIER[e];
  const bez = (s: number, a: number, b: number) =>
    3 * (1 - s) * (1 - s) * s * a + 3 * (1 - s) * s * s * b + s * s * s;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (bez(mid, x1, x2) < p) lo = mid;
    else hi = mid;
  }
  return bez((lo + hi) / 2, y1, y2);
}

function sample(keys: Key[], t: number): number[] {
  for (let i = keys.length - 1; i >= 0; i--) {
    const a = keys[i];
    if (a.t > t) continue;
    const b = keys[i + 1];
    if (!b) return a.v;
    const p = easeAt(a.e, (t - a.t) / (b.t - a.t));
    return a.v.map((x, j) => x + (b.v[j] - x) * p);
  }
  return keys[0].v;
}

/** sorted, one key per moment (the later-added wins) */
function tidy<K extends { t: number }>(keys: K[]): K[] {
  const out: K[] = [];
  for (const k of [...keys].sort((a, b) => a.t - b.t)) {
    if (out.length && Math.abs(out[out.length - 1].t - k.t) < 1) out[out.length - 1] = k;
    else out.push(k);
  }
  return out;
}

/** the `a + 360n` closest to `prev` — between keys, the short way round */
const nearest = (a: number, prev: number) => a + 360 * Math.round((prev - a) / 360);

/* ── the ball in flight ────────────────────────────────────────────────── */
const GRAVITY = 9.81;
/** drawn about four times life-size, again so it can be seen */
const BALL_M = 0.15;

type V3 = { x: number; z: number; h: number };
/** free flight from `p` at `t0`, launched with `v` (m/s) */
type Flight = { t0: number; t1: number; p: V3; v: V3 };

function flightAt(f: Flight, t: number): V3 {
  const s = (t - f.t0) / 1000;
  return {
    x: f.p.x + f.v.x * s,
    z: f.p.z + f.v.z * s,
    h: f.p.h + f.v.h * s - (GRAVITY * s * s) / 2,
  };
}

/** a struck ball: from `p`, landing at (`x`, `z`) after `ms` */
function strike(p: V3, at: { x: number; z: number }, t0: number, ms: number): Flight {
  const s = ms / 1000;
  return {
    t0,
    t1: t0 + ms,
    p,
    v: {
      x: (at.x - p.x) / s,
      z: (at.z - p.z) / s,
      h: (GRAVITY * s * s) / 2 / s - p.h / s,
    },
  };
}

/**
 * Off the court with a fixed share of the speed: `e` of the vertical comes
 * back up, `keep` of the ground speed carries on (the winner, which nobody
 * plays).
 */
function bounce(f: Flight, e: number, keep: number): Flight {
  const s = (f.t1 - f.t0) / 1000;
  const landed = flightAt(f, f.t1);
  return {
    t0: f.t1,
    t1: Infinity,
    p: { x: landed.x, z: landed.z, h: 0 },
    v: { x: f.v.x * keep, z: f.v.z * keep, h: -e * (f.v.h - GRAVITY * s) },
  };
}

/** Off the court and on to `to` after `ms` — the bounce the receiver's
 *  contact needs. What it takes off the ball (`bounceLoss`) is checked. */
function bounceTo(f: Flight, to: V3, ms: number): Flight {
  const landed = flightAt(f, f.t1);
  const s = ms / 1000;
  return {
    t0: f.t1,
    t1: f.t1 + ms,
    p: { x: landed.x, z: landed.z, h: 0 },
    v: {
      x: (to.x - landed.x) / s,
      z: (to.z - landed.z) / s,
      h: (to.h + (GRAVITY * s * s) / 2) / s,
    },
  };
}

/** vertical restitution and ground speed kept, for a bounce from `a` into `b` */
function bounceLoss(a: Flight, b: Flight) {
  const s = (a.t1 - a.t0) / 1000;
  return {
    e: b.v.h / -(a.v.h - GRAVITY * s),
    keep: Math.hypot(b.v.x, b.v.z) / Math.hypot(a.v.x, a.v.z),
  };
}

/* ── the point ─────────────────────────────────────────────────────────────
 * You serve from the deuce court; the opponent returns crosscourt to your
 * forehand; you go down the line to their backhand; they come back crosscourt
 * to your backhand; you go down the line again, behind them, for the winner.
 *
 * Each shot is staged by where the RECEIVER plants their feet. Their stroke's
 * contact pose puts the racket head at a fixed offset from the feet, which
 * fixes the contact point; the ball lands on the straight line to it at the
 * given depth, and the bounce is solved to carry it from there to the
 * strings. (`bounceLoss` keeps that honest — every bounce here gives back
 * 60–75% of its vertical speed and keeps 55–70% of its pace, about what a
 * hard court does, and one that strays far from that throws.)
 */
type Side = "me" | "opp";
const MIRROR: Record<Side, 1 | -1> = { me: 1, opp: -1 };

type Rally = {
  /** where the receiver stands to play it, and what they play */
  feet: { x: number; z: number };
  stroke: "fh" | "bh";
  /** how deep it lands */
  bounceZ: number;
  /** contact → bounce, and bounce → the receiver's contact */
  ms: number;
  riseMs: number;
};

const SERVE_CONTACT_MS = 1500;
/** before the serve's contact: the free arm starts lifting the ball, and lets go */
const TOSS_LIFT_MS = 1060;
const TOSS_LEAD_MS = 820;
const SERVE_FEET = { x: 0.7, z: -0.3 };
/** the server leaves the ground to hit up at the ball */
const SERVE_JUMP = 0.16;

const RALLY: Rally[] = [
  // the serve, flat into the far deuce box, returned on the forehand
  { feet: { x: -2.4, z: 24.3 }, stroke: "fh", bounceZ: 17.3, ms: 520, riseMs: 300 },
  // their return, crosscourt to your forehand
  { feet: { x: 1.9, z: -0.9 }, stroke: "fh", bounceZ: 3.0, ms: 1080, riseMs: 360 },
  // your forehand down the line, to their backhand
  { feet: { x: 2.0, z: 24.6 }, stroke: "bh", bounceZ: 20.6, ms: 1080, riseMs: 360 },
  // their backhand crosscourt, to your backhand
  { feet: { x: -1.8, z: -1.0 }, stroke: "bh", bounceZ: 3.1, ms: 1080, riseMs: 360 },
];
/** your backhand down the line, past them */
const WINNER_SHOT = { at: { x: -3.4, z: 21.3 }, ms: 900, e: 0.75, keep: 0.72 };

const CONTACT_POSE = { fh: FOREHAND.contact, bh: BACKHAND.contact };

type Contact = { t: number; by: Side; stroke: "serve" | "fh" | "bh"; ball: V3; feet: { x: number; z: number } };

/** the serve's contact — up at full stretch, off the ground */
const serveHead = racketHead(SERVE.contact);
const SERVE_BALL: V3 = {
  x: SERVE_FEET.x + serveHead.x,
  z: SERVE_FEET.z,
  h: SERVE_JUMP - serveHead.y,
};

function playPoint() {
  const contacts: Contact[] = [
    { t: SERVE_CONTACT_MS, by: "me", stroke: "serve", ball: SERVE_BALL, feet: SERVE_FEET },
  ];
  const flights: Flight[] = [];
  RALLY.forEach((shot, i) => {
    const from = contacts[i];
    const by: Side = from.by === "me" ? "opp" : "me";
    const head = racketHead(CONTACT_POSE[shot.stroke]);
    const ball: V3 = {
      x: shot.feet.x + MIRROR[by] * head.x,
      z: shot.feet.z,
      h: -head.y,
    };
    // lands on the line from the striker to the receiver's racket
    const along = (shot.bounceZ - from.ball.z) / (ball.z - from.ball.z);
    const at = { x: from.ball.x + (ball.x - from.ball.x) * along, z: shot.bounceZ };
    const hit = strike(from.ball, at, from.t, shot.ms);
    const up = bounceTo(hit, ball, shot.riseMs);
    const { e, keep } = bounceLoss(hit, up);
    if (e < 0.5 || e > 0.85 || keep < 0.5 || keep > 0.8) {
      throw new Error(`tennisRally: shot ${i} bounces like no court does (e ${e}, keep ${keep})`);
    }
    flights.push(hit, up);
    contacts.push({ t: up.t1, by, stroke: shot.stroke, ball, feet: shot.feet });
  });
  const last = contacts[contacts.length - 1];
  const hit = strike(last.ball, WINNER_SHOT.at, last.t, WINNER_SHOT.ms);
  flights.push(hit, bounce(hit, WINNER_SHOT.e, WINNER_SHOT.keep));
  return { contacts, flights };
}

const POINT = playPoint();
const CONTACTS = POINT.contacts;
const FLIGHTS = POINT.flights;
const WINNER = FLIGHTS[FLIGHTS.length - 1]; // after its bounce

/* ── the story's clock ─────────────────────────────────────────────────── */
/** the winner goes past the opponent at this depth, at `T_PASS` */
const OPP_PASS_Z = 24.7;
const T_PASS = WINNER.t0 + ((OPP_PASS_Z - WINNER.p.z) / WINNER.v.z) * 1000;
const BALL_FADE_FROM = T_PASS + 120;
const BALL_FADE_MS = 220;
const CELEBRATE_FROM = CONTACTS[4].t + 820;
const CELEBRATE_MS = 2000;
const SCENE_FADE_MS = 500;
/** the podium: fade up holding the trophy at the waist, bring it up to the
 *  chest, then lift it overhead and hold for the confetti */
const PODIUM_IN_MS = 400;
const WAIST_HOLD_MS = 900;
const RAISE_MS = 450;
const CHEST_HOLD_MS = 800;
const LIFT_MS = 550;
const LIFTED_MS = 1700;
const RETURN_MS = 600;

const CELEBRATE_END = Math.round(CELEBRATE_FROM + CELEBRATE_MS);
const SCENE_OUT = CELEBRATE_END + SCENE_FADE_MS;
const PODIUM_FULL = SCENE_OUT + PODIUM_IN_MS;
const RAISE = PODIUM_FULL + WAIST_HOLD_MS;
const LIFT = RAISE + RAISE_MS + CHEST_HOLD_MS;
const PODIUM_OUT = LIFT + LIFT_MS + LIFTED_MS;
export const CYCLE_MS = PODIUM_OUT + RETURN_MS;

export const TIMELINE = {
  celebrateEnd: CELEBRATE_END,
  sceneOut: SCENE_OUT,
  podiumFull: PODIUM_FULL,
  podiumOut: PODIUM_OUT,
};

export const pct = (ms: number) => `${((ms / CYCLE_MS) * 100).toFixed(3)}%`;

/** the frame shown under reduced motion: your forehand, ball on the strings */
const POSTER_MS = CONTACTS[2].t;

/* ── choreography ──────────────────────────────────────────────────────── */
type ArmKey = { t: number; p: Arms; e: Ease };
type LegKey = { t: number; p: Legs; e: Ease };
type BodyKey = { t: number; x: number; z: number; lift: number; e: Ease };

class Player {
  arms: ArmKey[] = [];
  legs: LegKey[] = [];
  body: BodyKey[] = [];
  side: Side;

  constructor(side: Side) {
    this.side = side;
  }

  pose(t: number, p: Arms, e: Ease = "inOut") {
    this.arms.push({ t, p, e });
  }

  stand(t: number, p: Legs, e: Ease = "inOut") {
    this.legs.push({ t, p, e });
  }

  at(t: number, x: number, z: number, lift = 0, e: Ease = "inOut") {
    this.body.push({ t, x, z, lift, e });
  }

  /** where they're last placed at or before `t` */
  placed(t: number) {
    return this.body.filter((k) => k.t <= t).sort((a, b) => a.t - b.t).pop()!;
  }

  /** run from where they are at `t0` to (`x`, `z`) by `t1`, striding */
  run(t0: number, t1: number, x: number, z: number) {
    const from = this.placed(t0);
    this.at(t0, from.x, from.z, 0);
    this.at(t1, x, z, 0);
    const steps = Math.max(2, Math.round((t1 - t0) / 150));
    for (let i = 0; i < steps; i++) {
      this.stand(t0 + ((t1 - t0) * i) / steps, STRIDE[i % 2], "inOut");
    }
    this.stand(t1, WIDE);
  }

  /** a little hop as the other player strikes, to be on the toes */
  splitStep(t: number) {
    const k = this.placed(t);
    this.at(t - 90, k.x, k.z, 0, "out");
    this.at(t + 30, k.x, k.z, 0.07, "in");
    this.at(t + 150, k.x, k.z, 0);
    this.stand(t - 90, STANCE);
    this.stand(t + 30, SPLIT);
    this.stand(t + 150, STANCE);
  }

  /** a groundstroke, timed off its contact */
  swing(t: number, stroke: "fh" | "bh", recover = true) {
    const s = stroke === "fh" ? FOREHAND : BACKHAND;
    this.pose(t - 620, READY, "out");
    this.pose(t - 300, s.back, "inOut");
    this.pose(t - 130, s.drop, "in");
    this.pose(t, s.contact, "linear");
    this.pose(t + 70, s.through, "out");
    this.pose(t + 260, s.finish, "inOut");
    this.pose(t + 420, s.finish, "inOut");
    if (!recover) return;
    this.pose(t + 700, s.recover, "inOut");
    this.pose(t + 900, READY);
  }
}

const me = new Player("me");
const opp = new Player("opp");
const [SERVE_C, OPP_FH, ME_FH, OPP_BH, ME_BH] = CONTACTS;

/* you: serve, forehand, backhand winner, celebrate */
{
  const t = SERVE_C.t;
  me.at(0, SERVE_FEET.x, SERVE_FEET.z);
  me.at(t - 200, SERVE_FEET.x, SERVE_FEET.z, 0, "out");
  me.at(t, SERVE_FEET.x, SERVE_FEET.z, SERVE_JUMP, "in");
  me.at(t + 260, SERVE_FEET.x + 0.1, SERVE_FEET.z + 0.6, 0);

  me.stand(0, STANCE);
  me.stand(t - 200, STANCE);
  me.stand(t - 20, SPLIT);
  me.stand(t + 200, SPLIT);
  me.stand(t + 300, WIDE);

  me.pose(0, SERVE.stance);
  // the toss is linear so the ball riding in the hand is easy to follow
  me.pose(t - TOSS_LIFT_MS, SERVE.stance, "linear");
  me.pose(t - TOSS_LEAD_MS, SERVE.toss, "inOut");
  me.pose(t - 430, SERVE.trophy, "inOut");
  me.pose(t - 190, SERVE.drop, "in");
  me.pose(t, SERVE.contact, "linear");
  me.pose(t + 90, SERVE.through, "out");
  me.pose(t + 340, SERVE.finish, "inOut");
  me.pose(t + 760, READY);

  // in from the serve, back behind the baseline, then out to the forehand
  me.run(t + 420, t + 1000, 0.3, -0.8);
  me.splitStep(OPP_FH.t);
  me.run(OPP_FH.t + 180, ME_FH.t - 180, ME_FH.feet.x, ME_FH.feet.z);
  me.at(ME_FH.t + 260, ME_FH.feet.x, ME_FH.feet.z);
  me.stand(ME_FH.t + 260, WIDE);
  me.swing(ME_FH.t, "fh");

  me.run(ME_FH.t + 300, ME_FH.t + 950, 0.1, -0.9);
  me.splitStep(OPP_BH.t);
  me.run(OPP_BH.t + 180, ME_BH.t - 180, ME_BH.feet.x, ME_BH.feet.z);
  me.at(ME_BH.t + 300, ME_BH.feet.x, ME_BH.feet.z);
  me.stand(ME_BH.t + 300, WIDE);
  me.swing(ME_BH.t, "bh", false);

  // arms up and a couple of hops
  const c = CELEBRATE_FROM;
  const { x, z } = ME_BH.feet;
  me.pose(c, CHEER, "inOut");
  me.pose(c - 280, BACKHAND.finish, "inOut");
  me.stand(c - 100, STANCE);
  for (const hop of [c + 150, c + 520]) {
    me.at(hop - 120, x, z, 0, "out");
    me.at(hop, x, z, 0.24, "in");
    me.at(hop + 140, x, z, 0, "out");
    me.stand(hop - 120, STANCE);
    me.stand(hop, SPLIT);
    me.stand(hop + 140, STANCE);
  }
}

/* the opponent: return, backhand, then the lunge that falls short */
{
  const startX = OPP_FH.feet.x + 0.8;
  const startZ = OPP_FH.feet.z - 0.2;
  opp.at(0, startX, startZ);
  opp.stand(0, STANCE);
  opp.pose(0, READY);
  opp.splitStep(SERVE_C.t);
  opp.run(SERVE_C.t + 150, OPP_FH.t - 160, OPP_FH.feet.x, OPP_FH.feet.z);
  opp.at(OPP_FH.t + 240, OPP_FH.feet.x, OPP_FH.feet.z);
  opp.stand(OPP_FH.t + 240, WIDE);
  opp.swing(OPP_FH.t, "fh");

  opp.run(OPP_FH.t + 280, OPP_FH.t + 950, -0.2, 24.9);
  opp.splitStep(ME_FH.t);
  opp.run(ME_FH.t + 180, OPP_BH.t - 180, OPP_BH.feet.x, OPP_BH.feet.z);
  opp.at(OPP_BH.t + 260, OPP_BH.feet.x, OPP_BH.feet.z);
  opp.stand(OPP_BH.t + 260, WIDE);
  opp.swing(OPP_BH.t, "bh");

  opp.run(OPP_BH.t + 300, OPP_BH.t + 900, 0.6, 24.9);
  opp.splitStep(ME_BH.t);

  // they read it late, then throw everything at it — the racket arrives a
  // good metre short of the ball as it goes past
  const reach = racketHead(LUNGE);
  const ballX = flightAt(WINNER, T_PASS).x;
  const lungeX = ballX + reach.x + 1.1;
  opp.run(ME_BH.t + 260, T_PASS - 40, lungeX + 0.5, OPP_PASS_Z);
  opp.at(T_PASS + 60, lungeX, OPP_PASS_Z, -LUNGE_DROP, "out");
  opp.at(T_PASS + 420, lungeX, OPP_PASS_Z, -LUNGE_DROP);
  opp.at(T_PASS + 760, lungeX + 0.15, OPP_PASS_Z, 0);
  opp.stand(T_PASS + 60, LUNGE_LEGS, "out");
  opp.stand(T_PASS + 420, LUNGE_LEGS);
  opp.stand(T_PASS + 760, STANCE);
  opp.pose(T_PASS - 380, READY);
  opp.pose(T_PASS + 60, LUNGE, "out");
  opp.pose(T_PASS + 420, LUNGE);
  opp.pose(T_PASS + 900, SLUMP);
}

/* ── tracks → CSS ──────────────────────────────────────────────────────── */
type Channel = { name: string; keys: Key[]; fmt: (v: number[]) => string };

/** hold the last pose until the scene has faded, then cut back to the start */
function loop(keys: Key[]): Key[] {
  const out = tidy(keys);
  if (out[0].t > 0) out.unshift({ ...out[0], t: 0, e: "linear" });
  const last = out[out.length - 1];
  if (last.t >= SCENE_OUT) throw new Error("tennisRally: a key runs past the scene");
  out.push({ t: SCENE_OUT, v: last.v, e: "cut" }, { t: CYCLE_MS, v: out[0].v, e: "linear" });
  return out;
}

const deg = (n: number) => `rotate(${n.toFixed(1)}deg)`;
const stretch = (n: number) => (Math.abs(n - 1) < 1e-3 ? "" : ` scale(1, ${n.toFixed(3)})`);

function armChannels(prefix: string, keys: ArmKey[]): Channel[] {
  // angles go the short way from each pose to the next
  const sorted = tidy(keys);
  const norm: ArmKey[] = [];
  sorted.forEach((k, i) => {
    const prev = norm[i - 1]?.p;
    const p = { ...k.p };
    if (prev) {
      p.u = nearest(p.u, prev.u);
      p.f = nearest(p.f, prev.f);
      p.r = nearest(p.r, prev.r);
      p.o = nearest(p.o, prev.o);
    }
    norm.push({ ...k, p });
  });
  const ch = (name: string, v: (p: Arms) => number[], fmt: Channel["fmt"]): Channel => ({
    name: `${prefix}-${name}`,
    keys: loop(norm.map((k) => ({ t: k.t, v: v(k.p), e: k.e }))),
    fmt,
  });
  return [
    ch("sh", (p) => [p.u], ([u]) => deg(u)),
    ch("el", (p) => [p.f - p.u], ([a]) => deg(a)),
    ch("wr", (p) => [p.r - p.f, p.rs ?? 1], ([a, s]) => deg(a) + stretch(s)),
    ch("off", (p) => [p.o, p.os ?? 1], ([a, s]) => deg(a) + stretch(s)),
  ];
}

function legChannels(prefix: string, keys: LegKey[]): Channel[] {
  const ch = (name: string, v: (p: Legs) => number[]): Channel => ({
    name: `${prefix}-${name}`,
    keys: loop(keys.map((k) => ({ t: k.t, v: v(k.p), e: k.e }))),
    fmt: ([a, s]) => deg(a) + stretch(s),
  });
  return [ch("legl", (p) => [p.l, p.ls ?? 1]), ch("legr", (p) => [p.r, p.rs ?? 1])];
}

/** the body as screen position + scale; a lift raises it off its feet */
function bodyScreen(x: number, z: number, lift: number) {
  const k = scaleAt(z);
  const g = project(x, z);
  return [g.x, g.y - lift * k, k];
}

function bodyChannel(prefix: string, keys: BodyKey[]): Channel {
  return {
    name: `${prefix}-body`,
    keys: loop(keys.map((k) => ({ t: k.t, v: bodyScreen(k.x, k.z, k.lift), e: k.e }))),
    fmt: ([x, y, k]) => `translate(${f2(x)}px, ${f2(y)}px) scale(${k.toFixed(3)})`,
  };
}

function playerChannels(p: Player) {
  const prefix = `pa-${p.side}`;
  return [bodyChannel(prefix, p.body), ...legChannels(prefix, p.legs), ...armChannels(prefix, p.arms)];
}

const ME_CHANNELS = playerChannels(me);
const OPP_CHANNELS = playerChannels(opp);
const channel = (list: Channel[], name: string) => list.find((c) => c.name.endsWith(name))!;

/* ── the ball's path, sampled ──────────────────────────────────────────── */
const BALL_STEP_MS = 50;
const SHADOW_STEP_MS = 100;
const TOSS_FROM = SERVE_C.t - TOSS_LIFT_MS;
const TOSS_RELEASE = SERVE_C.t - TOSS_LEAD_MS;

/** the ball in the server's free hand, placed exactly as the browser draws it */
function inHand(t: number) {
  const [bx, by, k] = sample(channel(ME_CHANNELS, "-body").keys, t);
  const [o, os] = sample(channel(ME_CHANNELS, "-off").keys, t);
  const hand = freeHand(o, os);
  return {
    ball: { x: bx + hand.x * k, y: by + hand.y * k },
    ground: { x: bx + hand.x * k, y: project(0, SERVE_FEET.z).y },
    r: BALL_M * k,
  };
}

const RELEASE = (() => {
  const { ball } = inHand(TOSS_RELEASE);
  const k = scaleAt(SERVE_FEET.z);
  const g = project(0, SERVE_FEET.z);
  return { x: (ball.x - VIEW.cx) / k, z: SERVE_FEET.z, h: (g.y - ball.y) / k };
})();
const TOSS = strike(RELEASE, { x: SERVE_BALL.x, z: SERVE_BALL.z }, TOSS_RELEASE, SERVE_C.t - TOSS_RELEASE);
// `strike` aims at a landing spot; the toss instead has to arrive at the
// racket, up in the air — re-solve its climb for that
TOSS.v.h =
  (SERVE_BALL.h - RELEASE.h + (GRAVITY * ((SERVE_C.t - TOSS_RELEASE) / 1000) ** 2) / 2) /
  ((SERVE_C.t - TOSS_RELEASE) / 1000);

const PATH: Flight[] = [TOSS, ...FLIGHTS];
const BALL_END = BALL_FADE_FROM + BALL_FADE_MS;

function ballAt(t: number) {
  if (t <= TOSS_RELEASE) return inHand(t);
  const f = PATH.find((p) => t <= p.t1) ?? PATH[PATH.length - 1];
  const w = flightAt(f, t);
  return {
    ball: project(w.x, w.z, w.h),
    ground: project(w.x, w.z),
    r: BALL_M * scaleAt(w.z),
  };
}

/** regular samples, plus every moment the path turns a corner */
function ballTimes(step: number) {
  const ts = new Set<number>();
  for (let t = TOSS_FROM; t < BALL_END; t += step) ts.add(Math.round(t));
  [TOSS_FROM, TOSS_RELEASE, ...PATH.flatMap((p) => [p.t0, p.t1]), BALL_END]
    .filter((t) => Number.isFinite(t) && t <= BALL_END)
    .forEach((t) => ts.add(Math.round(t)));
  return [...ts].sort((a, b) => a - b);
}

const BALL_CHANNEL: Channel = {
  name: "pa-ball",
  keys: loop(
    ballTimes(BALL_STEP_MS).map((t) => {
      const { ball, r } = ballAt(t);
      return { t, v: [ball.x, ball.y, r], e: "linear" as Ease };
    }),
  ),
  fmt: ([x, y, r]) => `translate(${f2(x)}px, ${f2(y)}px) scale(${r.toFixed(3)})`,
};

const SHADOW_CHANNEL: Channel = {
  name: "pa-shadow",
  keys: loop(
    ballTimes(SHADOW_STEP_MS).map((t) => {
      const { ground, r } = ballAt(t);
      return { t, v: [ground.x, ground.y, r], e: "linear" as Ease };
    }),
  ),
  fmt: BALL_CHANNEL.fmt,
};

function channelCss(c: Channel) {
  const frames = c.keys.map((k) => {
    const ease = easeCss(k.e);
    return `  ${pct(k.t)} { transform: ${c.fmt(k.v)};${ease ? ` animation-timing-function: ${ease};` : ""} }`;
  });
  return `@keyframes ${c.name} {\n${frames.join("\n")}\n}`;
}

/** the ball and its shadow are only on court for the point — back in the
 *  server's hand as the scene returns */
const BALL_FADE_CSS = `@keyframes pa-ball-fade {
  0%, ${pct(BALL_FADE_FROM)} { opacity: 1; }
  ${pct(BALL_END)}, ${pct(PODIUM_OUT)} { opacity: 0; }
  100% { opacity: 1; }
}`;

/* ── the podium ────────────────────────────────────────────────────────────
 * One shot of the ceremony rather than a slideshow: all three finishers on
 * the podium, and you bring the trophy up from your waist to your chest, then
 * thrust it up in your right hand — left fist up beside it, a V clear of the
 * head — while the other two clap and confetti comes down.
 *
 * The figures are a little more than the players on court — a shoulder line,
 * elbows, hands — in the same metres, feet at the origin, y down. Arms are worked out backwards from where the hands must be
 * (`reachFor`), re-solved every few frames of a move, so the hand holding
 * the trophy never slips off it.
 */
export const PODIUM_RIG = {
  hip: 0.95,
  /** feet this far either side of centre */
  stance: 0.13,
  shoulderX: 0.17,
  shoulderY: 1.5,
  headR: 0.21,
  headY: 1.82,
  /** shorter than the players' on court — hanging, the hands stop at the hip */
  upper: 0.32,
  fore: 0.3,
  handR: 0.042,
} as const;

/** the hands hold the trophy's base this far either side of its centre */
const GRIP_X = 0.07;
/** the right hand at each beat (the left mirrors it) — at the waist, at the
 *  chest, and up and out in a V, which keeps the arms off the head */
const WAIST: Pt = { x: GRIP_X, y: -0.92 };
const CHEST: Pt = { x: GRIP_X, y: -1.13 };
const OVERHEAD: Pt = { x: 0.42, y: -2.0 };
/** the runners-up's hands: hanging, then clapping in front of the chest —
 *  upper arms down at the sides (`CLAP_UPPER`) and the forearms coming
 *  forward, which from the front shortens them */
const HANG: Pt = { x: 0.25, y: -0.9 };
const CLAP_UPPER = -12;
const CLAP_OPEN: Pt = { x: 0.13, y: -1.33 };
const CLAP_SHUT: Pt = { x: 0.03, y: -1.31 };
const CLAP_MS = 130;

const dirOf = (v: Pt) => (Math.atan2(-v.x, v.y) * 180) / Math.PI;

/**
 * The arm that puts the hand at `hand` (y down): elbow out to the side — or,
 * given the upper arm's direction, the forearm from that elbow to the hand,
 * stretched (`s`) to fit, as a forearm pointing at the camera looks short.
 */
function reachFor(side: 1 | -1, hand: Pt, upper?: number) {
  const { upper: a, fore: b } = PODIUM_RIG;
  const s = { x: side * PODIUM_RIG.shoulderX, y: -PODIUM_RIG.shoulderY };
  if (upper !== undefined) {
    const e = limb(side * upper, a);
    const toHand = { x: hand.x - s.x - e.x, y: hand.y - s.y - e.y };
    return { u: side * upper, f: dirOf(toHand), s: Math.hypot(toHand.x, toHand.y) / b };
  }
  const v = { x: hand.x - s.x, y: hand.y - s.y };
  const d = Math.min(Math.max(Math.hypot(v.x, v.y), Math.abs(a - b) + 1e-6), a + b - 1e-6);
  const bend = (Math.acos((a * a + d * d - b * b) / (2 * a * d)) * 180) / Math.PI;
  const [e1, e2] = [dirOf(v) + bend, dirOf(v) - bend].map((u) => {
    const e = limb(u, a);
    return { u, x: s.x + e.x, y: s.y + e.y };
  });
  const elbow = side * e1.x > side * e2.x ? e1 : e2;
  return { u: elbow.u, f: dirOf({ x: hand.x - elbow.x, y: hand.y - elbow.y }), s: 1 };
}

/** podium tracks live inside the cycle: hold the first pose from 0%, the last to 100% */
function held(keys: Key[]): Key[] {
  const out = tidy(keys);
  if (out[0].t > 0) out.unshift({ ...out[0], t: 0, e: "linear" });
  out.push({ ...out[out.length - 1], t: CYCLE_MS, e: "linear" });
  return out;
}

/** both arms of a figure, from where the right hand is at each moment (the
 *  left mirrors it) — the shoulder and elbow of each, as four channels */
function armsReaching(
  prefix: string,
  moments: { t: number; hand: Pt; upper?: number }[],
): Channel[] {
  const keys = moments.map(({ t, hand, upper }) => {
    const r = reachFor(1, hand, upper);
    const l = reachFor(-1, { x: -hand.x, y: hand.y }, upper);
    return { t, a: [r.u, r.f, l.u, l.f], s: r.s };
  });
  keys.forEach((k, i) => {
    if (i) k.a = k.a.map((x, j) => nearest(x, keys[i - 1].a[j]));
  });
  const ch = (name: string, pick: (k: (typeof keys)[number]) => number[]): Channel => ({
    name: `${prefix}-${name}`,
    keys: held(keys.map((k) => ({ t: k.t, v: pick(k), e: "linear" as Ease }))),
    fmt: ([x, s = 1]) => deg(x) + stretch(s),
  });
  return [
    ch("ru", ({ a }) => [a[0]]),
    ch("rf", ({ a, s }) => [a[1] - a[0], s]),
    ch("lu", ({ a }) => [a[2]]),
    ch("lf", ({ a, s }) => [a[3] - a[2], s]),
  ];
}

/** every `step` ms through a move, eased, plus its ends */
function through(t0: number, ms: number, step = 40) {
  const ts: { t: number; p: number }[] = [];
  for (let s = 0; s <= ms; s += step) ts.push({ t: t0 + s, p: easeAt("inOut", s / ms) });
  if (ts[ts.length - 1].t < t0 + ms) ts.push({ t: t0 + ms, p: 1 });
  return ts;
}

const lerpPt = (a: Pt, b: Pt, p: number): Pt => ({ x: a.x + (b.x - a.x) * p, y: a.y + (b.y - a.y) * p });

/** the right hand through the shot */
const LIFT_PATH = [
  { t: SCENE_OUT, hand: WAIST },
  ...through(RAISE, RAISE_MS).map(({ t, p }) => ({ t, hand: lerpPt(WAIST, CHEST, p) })),
  ...through(LIFT, LIFT_MS).map(({ t, p }) => ({ t, hand: lerpPt(CHEST, OVERHEAD, p) })),
];

const WINNER_ARMS = armsReaching("pa-win", LIFT_PATH);
/** the trophy rides in the right hand, which holds its base by the side */
const TROPHY_CHANNEL: Channel = {
  name: "pa-trophy",
  keys: held(
    LIFT_PATH.map(({ t, hand }) => ({ t, v: [hand.x - GRIP_X, hand.y], e: "linear" as Ease })),
  ),
  fmt: ([x, y]) => `translate(${x.toFixed(3)}px, ${y.toFixed(3)}px)`,
};

/** hands down, then polite applause from the moment the trophy goes up */
function applause(prefix: string, lag: number): Channel[] {
  const start = LIFT + 120 + lag;
  const end = PODIUM_OUT - 250;
  const moments: { t: number; hand: Pt; upper?: number }[] = [
    { t: SCENE_OUT, hand: HANG },
    { t: start, hand: HANG },
    { t: start + 220, hand: CLAP_OPEN, upper: CLAP_UPPER },
  ];
  for (let t = start + 220 + CLAP_MS, i = 0; t < end; t += CLAP_MS, i++) {
    moments.push({ t, hand: i % 2 ? CLAP_OPEN : CLAP_SHUT, upper: CLAP_UPPER });
  }
  moments.push({ t: end + 250, hand: HANG });
  return armsReaching(prefix, moments);
}

const SECOND_ARMS = applause("pa-2nd", 0);
const THIRD_ARMS = applause("pa-3rd", 70);

/* confetti: a burst as the trophy goes up, fluttering down the glass */
const CONFETTI_COUNT = 20;
const CONFETTI_TOP = 166;
const CONFETTI_BOTTOM = 374;
const confettiRnd = mulberry32(2026);
const CONFETTI = Array.from({ length: CONFETTI_COUNT }, (_, i) => {
  const r = confettiRnd;
  const x = 1088 + r() * 130;
  const start = LIFT + 180 + r() * 900;
  const ms = 1300 + r() * 700;
  const drift = (r() - 0.5) * 18;
  const spin = (r() < 0.5 ? -1 : 1) * (300 + r() * 420);
  const r0 = r() * 180;
  const at = (p: number, sway: number) => [
    x + drift * p + sway,
    CONFETTI_TOP + (CONFETTI_BOTTOM - CONFETTI_TOP) * p,
    r0 + spin * p,
  ];
  const channel: Channel = {
    name: `pa-confetti-${i}`,
    keys: held([
      { t: start, v: at(0, 0), e: "linear" },
      { t: start + ms * 0.33, v: at(0.33, 3), e: "linear" },
      { t: start + ms * 0.66, v: at(0.66, -3), e: "linear" },
      { t: start + ms, v: at(1, 0), e: "linear" },
    ]),
    fmt: ([px, py, a]) => `translate(${f2(px)}px, ${f2(py)}px) rotate(${a.toFixed(0)}deg)`,
  };
  return { channel, w: 1.6 + r() * 1.2, h: 0.8 + r() * 0.5, opacity: 0.55 + r() * 0.4 };
});

const PODIUM_CHANNELS = [
  ...WINNER_ARMS,
  TROPHY_CHANNEL,
  ...SECOND_ARMS,
  ...THIRD_ARMS,
  ...CONFETTI.map((c) => c.channel),
];

const ALL_CHANNELS = [
  ...ME_CHANNELS,
  ...OPP_CHANNELS,
  BALL_CHANNEL,
  SHADOW_CHANNEL,
  ...PODIUM_CHANNELS,
];

export const MATCH_CSS = [...ALL_CHANNELS.map(channelCss), BALL_FADE_CSS].join("\n");

/** a channel's animation name, and the transform it rests on when the
 *  animation is off (reduced motion) — the poster frame — plus, for the
 *  podium, its pose in the shot's last beat (`PodiumStill`) */
export type Anim = { name: string; rest: string; still: string };
/** the podium's last beat: trophy overhead, confetti in the air */
const STILL_MS = LIFT + LIFT_MS + 700;
const anim = (c: Channel): Anim => ({
  name: c.name,
  rest: c.fmt(sample(c.keys, POSTER_MS)),
  still: c.fmt(sample(c.keys, STILL_MS)),
});

/** a podium figure's arms: right and left, shoulder then elbow */
export type ArmAnims = { ru: Anim; rf: Anim; lu: Anim; lf: Anim };
const armAnims = ([ru, rf, lu, lf]: Channel[]): ArmAnims => ({
  ru: anim(ru),
  rf: anim(rf),
  lu: anim(lu),
  lf: anim(lf),
});

export const PODIUM = {
  winner: armAnims(WINNER_ARMS),
  trophy: anim(TROPHY_CHANNEL),
  second: armAnims(SECOND_ARMS),
  third: armAnims(THIRD_ARMS),
  confetti: CONFETTI.map(({ channel, w, h, opacity }) => ({ anim: anim(channel), w, h, opacity })),
};

export type PlayerAnims = {
  body: Anim;
  legL: Anim;
  legR: Anim;
  sh: Anim;
  el: Anim;
  wr: Anim;
  off: Anim;
  /** limb weight in the cut-out's metres, so both read alike on screen */
  stroke: number;
  /** the far player faces the camera, so their right is screen-left */
  mirror: boolean;
};

function playerAnims(list: Channel[], screenStroke: number, z: number, mirror: boolean): PlayerAnims {
  const a = (n: string) => anim(channel(list, n));
  return {
    body: a("-body"),
    legL: a("-legl"),
    legR: a("-legr"),
    sh: a("-sh"),
    el: a("-el"),
    wr: a("-wr"),
    off: a("-off"),
    stroke: screenStroke / scaleAt(z),
    mirror,
  };
}

export const ME = playerAnims(ME_CHANNELS, 1.7, -0.8, false);
export const OPP = playerAnims(OPP_CHANNELS, 1.25, 24.8, true);
export const BALL = anim(BALL_CHANNEL);
export const SHADOW = anim(SHADOW_CHANNEL);
