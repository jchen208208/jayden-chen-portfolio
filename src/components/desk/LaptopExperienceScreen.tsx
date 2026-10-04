/**
 * What the larger laptop (screen 3) shows while it sits on the desk: the
 * method diagram from the claim-verification paper, toured by a camera (the
 * screen's name is on the neon sign above it, `NeonSigns`).
 *
 * The diagram is the paper's own figure redrawn as desk line art — same
 * layout, its icons reduced to small ink glyphs, no labels. Fitted whole to
 * the glass it was too small to read, so the glass is a camera instead: it
 * opens zoomed in on the claim and the filing at the far left, then follows
 * the pipeline right. As each step's arrows draw on in the glow and each box
 * lights as the light reaches it, the camera glides on to frame what's just
 * lit — pulling back where the route forks into the two models (both have
 * to be in shot), closing in again after — until it settles on the verdict
 * at the right end. A beat there, then it fades and starts again.
 *
 * The glow travels with the camera rather than piling up: whatever the
 * camera has moved on from goes back to ink (see `PLAN`), so only the stretch
 * in focus is ever lit.
 *
 *   ┌──────────────┐
 *   │ ▭──┐         │ → → →  ⬡ ─▶ ⚖ ─▶ ⚒ ─▶ ☁ ─▶ ✓|✗
 *   │ ▤ ━▶ ⌕ ━▶ ☰  │        ⬡ ─┘   ▤
 *   └──────────────┘
 *      the glass, at the start of the run
 *
 * Only the edges on that one run have a `step`; the others (the branches
 * this claim didn't take) stay faint, so the lit path reads as a real route.
 * Adding a paper is data only: append a `Figure`, camera path included.
 *
 * Every element runs off one generated timeline (`CYCLE_MS`), the pattern
 * `PortraitMonitorScreen` uses: build the clock in ms, emit `@keyframes` into
 * an inline `<style>`, key the root on a hash of that CSS. globals.css holds
 * the playback (`.mf-play`, `.mf-figs`): hovering the screen pauses it and
 * brightens the diagram; `prefers-reduced-motion` shows the whole diagram,
 * unzoomed, with the end of its route lit.
 *
 * Coordinates are glass-relative desk units (the glass is 202×100), inside
 * `DeskSvg`'s outer `<g stroke={INK} strokeWidth={2.4}>` — so every stroke
 * and fill here is explicit. Line weights are set for the zoomed-in view,
 * since the camera scales them up with everything else.
 */

import { screenById } from "@/lib/desk";

const INK_SOFT = "var(--ink-soft, rgba(255,255,255,0.62))";
const INK_FAINT = "var(--ink-faint, rgba(255,255,255,0.4))";
const PAPER = "var(--paper, #000)";
const GLOW = "var(--glow, #ffbe5c)";
const MONO = "var(--font-mono), ui-monospace, monospace";

const GLASS = screenById("experience").glass;
/** the camera's frame, in glass-relative units: the whole glass */
const FRAME = { w: GLASS.w, h: GLASS.h };
/** what the zoomed diagram is clipped to: the glass pulled in clear of the
 *  bezel's inner line (`DeskSvg`'s 2.4 outline puts 1.2 of it inside the
 *  glass) plus a hair of black, so nothing draws over the border and seems
 *  to spill out of the screen */
const CLIP_INSET = 2.2;
const CLIP_ID = "desk-method-glass";

/** the paper's short name, pinned top-left of the glass over the diagram */
const CAPTION = { x: 6, y: 8, size: 7.5 };
/** line weights before the camera's zoom (~2–3×): the glyphs, the arrows at
 *  rest, and an arrow once lit */
const GLYPH_W = 0.5;
const EDGE_W = 0.45;
const LIT_W = 0.7;
/** arrowhead length and half-width */
const HEAD = { l: 1.9, w: 1 };

/* ── the figures ───────────────────────────────────────────────────────── */

type Pt = [x: number, y: number];

/** a tiny ink stand-in for one of the figure's icons, drawn about (0, 0) */
type Glyph =
  | "bubble"
  | "docs"
  | "retriever"
  | "chunks"
  | "calc"
  | "model"
  | "scales"
  | "gavel"
  | "clipboard"
  | "cloud"
  | "verdict";

type FigNode = {
  glyph: Glyph;
  at: Pt;
  /** the step after which it lights (0 = as the run starts); left out, it
   *  never lights */
  lit?: number;
};

type FigEdge = {
  /** the arrow's polyline, ending at the arrowhead's tip */
  pts: Pt[];
  /** the step it lights in — drawn on across that step. Left out, it's a
   *  branch this run doesn't take, and stays faint. */
  step?: number;
};

/** where the camera is once a step has finished: the point at the centre of
 *  the glass, and how far in it's zoomed */
type Shot = { step: number; at: Pt; zoom: number };

type Figure = {
  caption: string;
  /** how long each step of the run takes — the camera moves with it */
  stepMs: number;
  nodes: FigNode[];
  edges: FigEdge[];
  /** the camera's path, in step order; the first shot is where it waits
   *  before the run starts */
  camera: Shot[];
};

/**
 * "Routing Financial Claim Verification Between On-Device and Cloud Models"
 * — `model_diagram.png`, left to right: the claim and the 10-K filing → BM25
 * retriever → retrieved chunks → arithmetic trigger → Qwen 3B ‖ Qwen 7B →
 * routing rule → disagreement recheck (gavel) | agreement recheck
 * (clipboard) → DeepSeek (the cloud) → verdict, with the trigger's "yes"
 * bypass over the top. The claim sits a little lower than in the paper, so
 * it and the filing share the opening shot. The run lit: the two models
 * disagree, the recheck sides with 3B, and DeepSeek settles it.
 */
const CLAIM_VERIFICATION: Figure = {
  caption: "claim verification",
  stepMs: 800,
  nodes: [
    { glyph: "bubble", at: [14.8, 38], lit: 0 },
    { glyph: "docs", at: [14.8, 54.5], lit: 0 },
    { glyph: "retriever", at: [32.6, 54.5], lit: 1 },
    { glyph: "chunks", at: [50.3, 54.5], lit: 2 },
    { glyph: "calc", at: [68, 54.5], lit: 3 },
    { glyph: "model", at: [89.3, 33.5], lit: 4 },
    { glyph: "model", at: [89.3, 75.8], lit: 4 },
    { glyph: "scales", at: [108.8, 54.5], lit: 5 },
    { glyph: "gavel", at: [130.5, 33.2], lit: 6 },
    { glyph: "clipboard", at: [130, 75.5] },
    { glyph: "cloud", at: [157, 54.5], lit: 7 },
    { glyph: "verdict", at: [183, 54.5], lit: 8 },
  ],
  edges: [
    // claim → retriever, and filing → retriever
    { pts: [[20.5, 38], [32.6, 38], [32.6, 48.6]], step: 1 },
    { pts: [[20.5, 54.5], [27, 54.5]], step: 1 },
    { pts: [[38.6, 54.5], [46.4, 54.5]], step: 2 },
    // chunks → trigger, and the claim's own line to it
    { pts: [[54.2, 54.5], [63.2, 54.5]], step: 3 },
    { pts: [[20.5, 38], [66, 38], [66, 48.8]], step: 3 },
    // trigger: "yes" bypasses straight to DeepSeek; "no" goes to both models
    { pts: [[70.5, 49.3], [70.5, 23.5], [157, 23.5], [157, 50.2]] },
    { pts: [[72.5, 49.5], [83.4, 38]], step: 4 },
    { pts: [[72.5, 59.5], [83.4, 71]], step: 4 },
    { pts: [[95, 38], [103.4, 49.4]], step: 5 },
    { pts: [[95, 71], [103.4, 59.6]], step: 5 },
    // routing rule: disagree → gavel, agree → clipboard
    { pts: [[114.2, 49.5], [124.4, 38]], step: 6 },
    { pts: [[114.2, 59.5], [124.4, 71]] },
    // gavel: agrees with 7B → verdict, agrees with 3B → DeepSeek
    { pts: [[136.6, 33.2], [177, 33.2], [177, 50.8]] },
    { pts: [[136.4, 37.6], [150.6, 50]], step: 7 },
    // clipboard: unconfirmed → DeepSeek, confirmed → verdict
    { pts: [[135.6, 71], [150.6, 59]] },
    { pts: [[135.6, 75.5], [177, 75.5], [177, 58.2]] },
    { pts: [[163.2, 54.5], [173.4, 54.5]], step: 8 },
  ],
  camera: [
    // in close on the claim and the filing, the retriever just ahead
    { step: 0, at: [26, 47], zoom: 3 },
    { step: 1, at: [36, 50], zoom: 3 },
    { step: 2, at: [49, 52], zoom: 3 },
    { step: 3, at: [64, 52], zoom: 2.7 },
    // the fork: back out far enough to hold both models
    { step: 4, at: [84, 54.6], zoom: 1.78 },
    { step: 5, at: [104, 54.6], zoom: 1.78 },
    { step: 6, at: [124, 46], zoom: 2.3 },
    { step: 7, at: [146, 47], zoom: 2.4 },
    // settled on the verdict
    { step: 8, at: [168, 52], zoom: 2.6 },
  ],
};

/** in the order they play */
const FIGURES: Figure[] = [CLAIM_VERIFICATION];

/* ── glyphs ────────────────────────────────────────────────────────────── */

const r2 = (v: number) => Math.round(v * 100) / 100;

/** the six outer nodes of the "model" glyph (a neural-net icon) */
const MODEL_RING: Pt[] = [0, 60, 120, 180, 240, 300].map((deg) => [
  r2(4.2 * Math.cos((deg * Math.PI) / 180)),
  r2(4.2 * Math.sin((deg * Math.PI) / 180)),
]);

/** Draws a glyph about (0, 0). Shapes never set their own stroke, so the same
 *  glyph draws in ink at rest and in the glow once lit; solid shapes are
 *  filled with the page so whatever's behind them (an arrow, the back sheet
 *  of a stack) is hidden. */
function GlyphShape({ glyph }: { glyph: Glyph }) {
  switch (glyph) {
    case "bubble":
      return (
        <>
          <rect x={-5} y={-3.6} width={10} height={6.4} rx={1.6} fill={PAPER} />
          <path d="M-2.4 2.8 L-3.6 4.8 L-0.6 2.8" fill={PAPER} />
          <path d="M-3 -1.2 H3 M-3 0.8 H1.4" />
        </>
      );
    case "docs":
      return (
        <>
          <rect x={-2.6} y={-5} width={7} height={8.6} rx={0.6} fill={PAPER} />
          <rect x={-4.4} y={-3.6} width={7} height={8.6} rx={0.6} fill={PAPER} />
          <path d="M-2.9 -1.2 H1.1 M-2.9 0.8 H1.1 M-2.9 2.8 H0.1" />
        </>
      );
    case "retriever":
      return (
        <>
          <rect x={-4.5} y={-4.6} width={7} height={9} rx={0.6} fill={PAPER} />
          <path d="M-3 -2.4 H1 M-3 -0.4 H-0.6" />
          <circle cx={1.6} cy={1.6} r={2.4} fill={PAPER} />
          <path d="M3.3 3.3 L5 5" />
        </>
      );
    case "chunks":
      return (
        <>
          {[-7.4, -2.2, 3].map((y) => (
            <rect key={y} x={-3} y={y} width={6} height={4.4} rx={0.5} fill={PAPER} />
          ))}
          <path d="M-1.8 -5.2 H1.8 M-1.8 0 H1.8 M-1.8 5.2 H1.8" />
        </>
      );
    case "calc":
      return (
        <>
          <rect x={-4} y={-5} width={8} height={10} rx={1} fill={PAPER} />
          <rect x={-2.6} y={-3.6} width={5.2} height={2.4} rx={0.3} />
          <path d="M-2.6 0.4 h1.2 M-0.6 0.4 h1.2 M1.4 0.4 h1.2 M-2.6 2.2 h1.2 M-0.6 2.2 h1.2 M1.4 2.2 h1.2 M-2.6 3.8 h1.2 M-0.6 3.8 h1.2 M1.4 3.8 h1.2" />
        </>
      );
    case "model":
      return (
        <>
          <path
            d={`${MODEL_RING.map(([x, y]) => `M0 0 L${x} ${y}`).join(" ")} M${MODEL_RING.map(([x, y]) => `${x} ${y}`).join(" L")} Z`}
          />
          {MODEL_RING.map(([x, y]) => (
            <circle key={`${x},${y}`} cx={x} cy={y} r={0.9} fill={PAPER} />
          ))}
          <circle r={1.1} fill={PAPER} />
        </>
      );
    case "scales":
      return (
        <>
          <path d="M0 -3.6 V4.2 M-2.6 4.2 H2.6 M-4.6 -2.8 H4.6" />
          <path d="M-4.6 -2.8 L-6 0.6 H-3.2 Z M4.6 -2.8 L3.2 0.6 H6 Z" fill={PAPER} />
          <circle cx={0} cy={-4.2} r={0.8} fill={PAPER} />
        </>
      );
    case "gavel":
      return (
        <g transform="rotate(-40)">
          <path d="M0 -1.2 V5.4" />
          <rect x={-4} y={-4.6} width={8} height={3.4} rx={0.6} fill={PAPER} />
        </g>
      );
    case "clipboard":
      return (
        <>
          <rect x={-3.6} y={-4.4} width={7.2} height={9.4} rx={0.8} fill={PAPER} />
          <rect x={-1.6} y={-5.4} width={3.2} height={2} rx={0.5} fill={PAPER} />
          <path d="M-2.3 -0.6 l0.8 0.8 l1.4 -1.6 M0.7 -0.6 H2.4 M-2.3 2.6 l0.8 0.8 l1.4 -1.6 M0.7 2.6 H2.4" />
        </>
      );
    case "cloud":
      return (
        <path
          d="M-4.2 2.8 H3.8 A2.3 2.3 0 0 0 4 -1.8 A3.2 3.2 0 0 0 -2.2 -1.8 A2.4 2.4 0 0 0 -4.2 2.8 Z"
          fill={PAPER}
        />
      );
    case "verdict":
      return (
        <>
          <rect x={-9} y={-3} width={18} height={6} rx={1} fill={PAPER} />
          <path d="M0 -3 V3 M-6.2 0 l1.3 1.3 l2.6 -2.6 M3 -1.3 l2.6 2.6 M5.6 -1.3 l-2.6 2.6" />
        </>
      );
  }
}

/* ── arrows ────────────────────────────────────────────────────────────── */

/** an edge's line (stopped short of the tip, under the arrowhead) and its
 *  arrowhead, from its polyline */
function edgeShape({ pts }: FigEdge) {
  const [tx, ty] = pts[pts.length - 1];
  const [px, py] = pts[pts.length - 2];
  const len = Math.hypot(tx - px, ty - py);
  const [dx, dy] = [(tx - px) / len, (ty - py) / len];
  const line = [...pts.slice(0, -1), [tx - dx * HEAD.l * 0.5, ty - dy * HEAD.l * 0.5]];
  const d = line.map(([x, y], i) => `${i ? "L" : "M"}${r2(x)} ${r2(y)}`).join(" ");
  const bx = tx - dx * HEAD.l;
  const by = ty - dy * HEAD.l;
  const arrow = `M${r2(tx)} ${r2(ty)} L${r2(bx - dy * HEAD.w)} ${r2(by + dx * HEAD.w)} L${r2(bx + dy * HEAD.w)} ${r2(by - dx * HEAD.w)} Z`;
  return { d, arrow };
}

/* ── the clock ─────────────────────────────────────────────────────────── */

const FADE_MS = 450;
/** in close on the start, still dark, before the run begins */
const LEAD_MS = 700;
/** the camera at rest on the end of the route, lit, before the fade */
const HOLD_MS = 2000;
/** how fast a box or an arrowhead comes on */
const LIGHT_MS = 160;
/** how fast it goes back to ink once the camera has moved on */
const FADE_BACK_MS = 400;
/** the camera's glide between shots: eased at both ends, like a dolly */
const GLIDE = "cubic-bezier(0.45, 0, 0.55, 1)";

type Slot = { start: number; run: number; out: number; end: number };

function buildSlots() {
  const slots: Slot[] = [];
  let t = 0;
  for (const fig of FIGURES) {
    const steps = Math.max(
      ...fig.edges.map((e) => e.step ?? 0),
      ...fig.nodes.map((n) => n.lit ?? 0),
      ...fig.camera.map((s) => s.step),
    );
    const run = t + FADE_MS + LEAD_MS;
    const out = run + steps * fig.stepMs + HOLD_MS;
    slots.push({ start: t, run, out, end: out + FADE_MS });
    t = out + FADE_MS;
  }
  return { slots, cycleMs: t };
}

const { slots: SLOTS, cycleMs: CYCLE_MS } = buildSlots();

const pct = (ms: number) => `${((ms / CYCLE_MS) * 100).toFixed(3)}%`;

/** keyframes by name — elements sharing a moment share one rule */
const KEYFRAMES = new Map<string, string>();

/** the frames after a figure has faded out: back to dark for its next turn
 *  (nothing to reset if it's the last figure, whose fade ends the cycle) */
const reset = (end: number, prop: string, dark: string | number) =>
  end < CYCLE_MS ? `\n  ${pct(end + 1)}, 100% { ${prop}: ${dark}; }` : "";

function figureFade(f: number) {
  const { start, out, end } = SLOTS[f];
  const name = `mf-fig-${f}`;
  KEYFRAMES.set(
    name,
    `@keyframes ${name} {
  0%, ${pct(start)} { opacity: 0; }
  ${pct(start + FADE_MS)}, ${pct(out)} { opacity: 1; }
  ${pct(end)}, 100% { opacity: 0; }
}`,
  );
  return name;
}

/** the camera as a transform: `at` brought to the middle of the glass, at
 *  `zoom`. The same three functions in every frame, so each frame
 *  interpolates term by term. */
const shotTransform = ({ at: [x, y], zoom }: Shot) =>
  `translate(${FRAME.w / 2}px, ${FRAME.h / 2}px) scale(${zoom}) translate(${-x}px, ${-y}px)`;

/** the camera's path: waiting on the first shot until the run starts, then
 *  gliding to each shot across the step that ends on it, and holding the
 *  last until the figure has faded — then back to the start, unseen */
function cameraPath(f: number, fig: Figure) {
  const { run, end } = SLOTS[f];
  const name = `mf-cam-${f}`;
  const [first] = fig.camera;
  const frames = [`  0%, ${pct(run)} { transform: ${shotTransform(first)}; animation-timing-function: ${GLIDE}; }`];
  for (const shot of fig.camera.slice(1)) {
    frames.push(
      `  ${pct(run + shot.step * fig.stepMs)} { transform: ${shotTransform(shot)}; animation-timing-function: ${GLIDE}; }`,
    );
  }
  const last = fig.camera[fig.camera.length - 1];
  frames.push(`  ${pct(end)} { transform: ${shotTransform(last)}; }`);
  if (end < CYCLE_MS) frames.push(`  ${pct(end + 1)}, 100% { transform: ${shotTransform(first)}; }`);
  KEYFRAMES.set(name, `@keyframes ${name} {\n${frames.join("\n")}\n}`);
  return name;
}

/** a box or an arrowhead coming on at `at`, lit until `until`, then fading
 *  back to ink — or, with `until` null, staying lit until the figure has
 *  faded (the end of the route, where the camera comes to rest) */
function lightUp(f: number, at: number, until: number | null) {
  const { end } = SLOTS[f];
  const name = `mf-on-${f}-${Math.round(at)}-${until === null ? "end" : Math.round(until)}`;
  const off =
    until === null
      ? `${pct(at + LIGHT_MS)}, ${pct(end)} { opacity: 1; }${reset(end, "opacity", 0)}`
      : `${pct(at + LIGHT_MS)}, ${pct(until)} { opacity: 1; }
  ${pct(until + FADE_BACK_MS)}, 100% { opacity: 0; }`;
  KEYFRAMES.set(
    name,
    `@keyframes ${name} {
  0%, ${pct(at)} { opacity: 0; }
  ${off}
}`,
  );
  return name;
}

/** an arrow drawn on from its tail to its tip across [`from`, `to`], lit
 *  until `until`, then fading back to ink (`until` null: lit until the
 *  figure has faded). The lit path has `pathLength=1`, so a dash offset of 1
 *  hides it and 0 shows it; once it has faded it stays drawn but invisible,
 *  and the next turn's offset of 1 hides it again before it shows. */
function drawOn(f: number, from: number, to: number, until: number | null) {
  const { end } = SLOTS[f];
  const name = `mf-draw-${f}-${Math.round(from)}-${until === null ? "end" : Math.round(until)}`;
  const off =
    until === null
      ? `${pct(to)}, ${pct(end)} { stroke-dashoffset: 0; opacity: 1; }${reset(end, "stroke-dashoffset", 1)}`
      : `${pct(to)}, ${pct(until)} { stroke-dashoffset: 0; opacity: 1; }
  ${pct(until + FADE_BACK_MS)}, 100% { stroke-dashoffset: 0; opacity: 0; }`;
  KEYFRAMES.set(
    name,
    `@keyframes ${name} {
  0%, ${pct(from)} { stroke-dashoffset: 1; opacity: 1; }
  ${off}
}`,
  );
  return name;
}

/**
 * Everything a figure needs from the clock: its fade, its camera, and per
 * lit edge and node, which animation drives it. Built once, at module load,
 * so the `<style>` and the elements agree.
 *
 * The light only stays where the camera is. A box lights as the run reaches
 * it and stays lit while its outgoing arrows draw (one step), then goes back
 * to ink; an arrow stays lit half a step past drawing on. So at any moment
 * the glow is just the box in focus, the arrows leaving it, and the tail of
 * the ones that led there. Only the last step's — where the camera comes to
 * rest — stay lit until the figure fades.
 */
const PLAN = FIGURES.map((fig, f) => {
  const { run } = SLOTS[f];
  const at = (step: number) => run + step * fig.stepMs;
  const lastStep = Math.max(...fig.edges.map((e) => e.step ?? 0), ...fig.nodes.map((n) => n.lit ?? 0));
  const until = (step: number, linger: number) => (step >= lastStep ? null : at(step + linger));
  return {
    fade: figureFade(f),
    camera: cameraPath(f, fig),
    edges: fig.edges.map((e) => {
      if (e.step === undefined) return null;
      const off = until(e.step, 0.5);
      return {
        draw: drawOn(f, at(e.step - 1), at(e.step), off),
        head: lightUp(f, at(e.step) - 40, off),
        holds: off === null,
      };
    }),
    nodes: fig.nodes.map((n) => {
      if (n.lit === undefined) return null;
      const off = until(n.lit, 1);
      return { anim: lightUp(f, at(n.lit), off), holds: off === null };
    }),
  };
});

const SEQUENCE_CSS = [...KEYFRAMES.values()].join("\n");
/** Each element runs its own animation, so they only stay in step if they all
 *  start on the same frame — keying the root on the generated CSS remounts
 *  everything together whenever a figure or the timing changes. */
const TIMELINE_KEY = [...SEQUENCE_CSS].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0);

/** only the name and length go inline — play-state stays in globals.css so
 *  hovering the screen can pause it */
const anim = (name: string) => ({ animationName: name, animationDuration: `${CYCLE_MS}ms` });

/* ── drawing ───────────────────────────────────────────────────────────── */

function FigureView({ fig, f }: { fig: Figure; f: number }) {
  const plan = PLAN[f];
  const shapes = fig.edges.map(edgeShape);
  const nodeAt = (n: FigNode) => `translate(${n.at[0]} ${n.at[1]})`;
  return (
    // at rest (reduced motion) only the first figure shows, unzoomed, with
    // just the end of its route lit — the inline opacity, transform and
    // dash offsets below are that resting frame
    <g className="mf-play" style={{ ...anim(plan.fade), opacity: f === 0 ? 1 : 0 }}>
      <g className="mf-play" style={{ ...anim(plan.camera), transform: "none" }}>
        {/* the arrows at rest */}
        <g stroke={INK_FAINT} strokeWidth={EDGE_W} fill="none" strokeLinejoin="round">
          {shapes.map(({ d, arrow }, i) => (
            <g key={i}>
              <path d={d} />
              <path d={arrow} fill={INK_FAINT} stroke="none" />
            </g>
          ))}
        </g>

        {/* the boxes at rest */}
        <g stroke={INK_SOFT} strokeWidth={GLYPH_W} fill="none" strokeLinecap="round" strokeLinejoin="round">
          {fig.nodes.map((n, i) => (
            <g key={i} transform={nodeAt(n)}>
              <GlyphShape glyph={n.glyph} />
            </g>
          ))}
        </g>

        {/* the run, lit — butt caps, or the hidden end of each dash would
            still show as a dot at the arrow's tail before it draws on */}
        <g stroke={GLOW} strokeWidth={LIT_W} fill="none" strokeLinecap="butt" strokeLinejoin="round">
          {shapes.map(({ d, arrow }, i) => {
            const lit = plan.edges[i];
            if (!lit) return null;
            return (
              <g key={i}>
                <path
                  className="mf-play"
                  d={d}
                  pathLength={1}
                  strokeDasharray={1}
                  style={{ ...anim(lit.draw), strokeDashoffset: 0, opacity: lit.holds ? 1 : 0 }}
                />
                <path
                  className="mf-play"
                  d={arrow}
                  fill={GLOW}
                  stroke="none"
                  style={{ ...anim(lit.head), opacity: lit.holds ? 1 : 0 }}
                />
              </g>
            );
          })}
        </g>
        <g stroke={GLOW} strokeWidth={GLYPH_W} fill="none" strokeLinecap="round" strokeLinejoin="round">
          {fig.nodes.map((n, i) => {
            const lit = plan.nodes[i];
            if (!lit) return null;
            return (
              <g
                key={i}
                className="mf-play"
                transform={nodeAt(n)}
                style={{ ...anim(lit.anim), opacity: lit.holds ? 1 : 0 }}
              >
                <GlyphShape glyph={n.glyph} />
              </g>
            );
          })}
        </g>
      </g>

      {/* the caption stays put while the diagram moves under it, on a
          patch of the page so passing lines don't run through it */}
      <rect
        x={CAPTION.x - 2}
        y={CAPTION.y - CAPTION.size / 2 - 1}
        width={fig.caption.length * CAPTION.size * 0.6 + 4}
        height={CAPTION.size + 2}
        rx={1.5}
        fill={PAPER}
        stroke="none"
      />
      <text
        x={CAPTION.x}
        y={CAPTION.y}
        dominantBaseline="central"
        fontSize={CAPTION.size}
        fontFamily={MONO}
        fill={INK_FAINT}
        stroke="none"
      >
        {fig.caption}
      </text>
    </g>
  );
}

export default function LaptopExperienceScreen() {
  return (
    <g key={TIMELINE_KEY} className="screen-light" data-light="experience">
      <style>{SEQUENCE_CSS}</style>
      <g className="mf-figs" transform={`translate(${GLASS.x} ${GLASS.y})`}>
        <defs>
          {/* the camera's frame: the zoomed diagram must never spill past
              the glass onto the bezel */}
          <clipPath id={CLIP_ID}>
            <rect
              x={CLIP_INSET}
              y={CLIP_INSET}
              width={FRAME.w - CLIP_INSET * 2}
              height={FRAME.h - CLIP_INSET * 2}
              rx={1}
            />
          </clipPath>
        </defs>
        <g clipPath={`url(#${CLIP_ID})`}>
          {FIGURES.map((fig, f) => (
            <FigureView key={fig.caption} fig={fig} f={f} />
          ))}
        </g>
      </g>
    </g>
  );
}
