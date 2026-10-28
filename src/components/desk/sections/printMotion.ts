/**
 * The ways a print can come out of its frame on the About film, and go back
 * — to choose between with the dev panel (`printLab.tsx`). Once one is chosen
 * the rest go.
 *
 * Every one starts at the frame itself, where it sits in the moving strip,
 * and ends with the print in the middle of the screen. Going back is the
 * same motion run in reverse, a little quicker.
 *
 * They move only what the browser can animate off the main thread —
 * `transform` and `opacity` (plus a small `clip-path` where a hole opens in
 * the frame) — on the print's own layers (`print.tsx`) and on a few throwaway
 * pieces a motion brings with it (shards, a loupe, a burn), which are marked
 * `data-fx` and cleared away once it's done.
 */

import { createCloth, placeholderPicture, randomCloth } from "./cloth";

export type MotionId = "peel" | "part" | "shards" | "loupe" | "burn" | "exposure" | "printhead";

export type PrintParts = {
  /** the dimming over the page */
  backdrop: HTMLElement;
  /** the whole print — what flies and grows */
  paper: HTMLElement;
  /** its white paper */
  sheet: HTMLElement;
  /** its shadow */
  shadow: HTMLElement;
  /** the picture */
  photo: HTMLElement;
  /** layers under and over the print, for a motion's own pieces */
  under: HTMLElement;
  over: HTMLElement;
  /** the frame's button on the film, and its picture */
  origin: HTMLElement;
  frame: HTMLElement;
};

export type MotionContext = PrintParts & {
  /** where the frame's picture is on the film, and where the print's
   *  picture rests, right now */
  from: DOMRect;
  to: DOMRect;
  /** stretches every duration — 2 is twice as long */
  pace: number;
  /** how far Peel curls the paper — 1 is its usual curl */
  curl: number;
  /** going back into the frame: everything runs in reverse */
  back: boolean;
  /** the picture has left the film: its frame shows as an empty window
   *  until the print comes back (`data-out`) */
  empty: () => void;
};

type Motion = {
  id: MotionId;
  name: string;
  blurb: string;
  play: (c: MotionContext) => Animation[];
};

/** how much quicker the way back is */
const BACK = 0.7;

/** marks a frame's button on the film as having its picture out as a
 * print — its window shows empty (globals.css) — or back home */
export function markOut(frame: HTMLElement, out: boolean) {
  if (out) frame.dataset.out = "";
  else delete frame.dataset.out;
}

/** the transform that puts `to` where `from` is */
function flip(from: DOMRect, to: DOMRect, extraScale = 1) {
  const dx = from.left + from.width / 2 - (to.left + to.width / 2);
  const dy = from.top + from.height / 2 - (to.top + to.height / 2);
  const sx = (from.width / to.width) * extraScale;
  const sy = (from.height / to.height) * extraScale;
  return `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`;
}

/** a soft spring, as a `linear()` easing: past its mark at a little over
 *  half the time, by about 3%, and settled by the end */
const SPRING = (() => {
  const zeta = 0.75;
  const omega = 8;
  const damped = omega * Math.sqrt(1 - zeta * zeta);
  const points = Array.from({ length: 41 }, (_, i) => {
    const t = i / 40;
    const x =
      1 -
      Math.exp(-zeta * omega * t) *
        (Math.cos(damped * t) + ((zeta * omega) / damped) * Math.sin(damped * t));
    return i === 40 ? "1" : x.toFixed(4);
  });
  return `linear(${points.join(", ")})`;
})();

const OUT = "cubic-bezier(0.22, 1, 0.36, 1)";
const IN_OUT = "cubic-bezier(0.65, 0, 0.35, 1)";

/** Animates `el` for this run: forwards on the way out, in reverse (and a
 *  little quicker) on the way back, held at both ends so nothing flickers
 *  between a run ending and the next thing taking over. */
function anim(
  c: MotionContext,
  el: Element,
  keyframes: Keyframe[],
  { duration, delay = 0, easing = "linear" }: { duration: number; delay?: number; easing?: string },
) {
  const scale = c.pace * (c.back ? BACK : 1);
  return el.animate(keyframes, {
    duration: duration * scale,
    delay: delay * scale,
    easing,
    direction: c.back ? "reverse" : "normal",
    fill: "both",
  });
}

/** fades in from `startAt` (a fraction of the run) to the end — eased on
 *  that stretch alone, so the fade starts when it says */
function fade(c: MotionContext, el: Element, duration: number, startAt = 0, easing = "ease-out") {
  return anim(c, el, [{ opacity: 0 }, { opacity: 0, offset: startAt, easing }, { opacity: 1 }], {
    duration,
  });
}

/** a throwaway piece of a motion, in the layer over or under the print, at
 *  a spot on the screen */
function piece(layer: HTMLElement, className: string, box: { left: number; top: number; width: number; height: number }) {
  const el = document.createElement("div");
  el.dataset.fx = "";
  el.className = className;
  Object.assign(el.style, {
    left: `${box.left}px`,
    top: `${box.top}px`,
    width: `${box.width}px`,
    height: `${box.height}px`,
  });
  layer.append(el);
  return el;
}

/** the picture as a CSS background — the frame's own copy, already loaded,
 *  or a placeholder's gradient */
function picture(c: MotionContext) {
  const img = c.photo.querySelector("img");
  if (img?.currentSrc) return `url("${img.currentSrc}")`;
  const placeholder = c.photo.querySelector(".shot-placeholder");
  return placeholder ? getComputedStyle(placeholder).backgroundImage : "none";
}

/** the frame empties as soon as the picture lifts out of it */
function emptyAt(c: MotionContext, at: number) {
  if (c.back) return;
  window.setTimeout(c.empty, at * c.pace);
}

/** eases from 0 to 1 as `u` goes from `a` to `b` */
function ease(u: number, a: number, b: number) {
  const x = Math.min(1, Math.max(0, (u - a) / (b - a)));
  return x * x * (3 - 2 * x);
}

/** a seeded random, so a motion's scatter is the same each time */
function seeded(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
}

/** Peel without WebGL: the sheet as strips hinged one under another,
 *  peeling from the bottom up and floating out — stiffer than the cloth, but
 *  the same idea */
function stripPeel(c: MotionContext): Animation[] {
  const t = 1500;
  // strips the sheet bends along, and when its top lets go of the film
  const n = 10;
  const letGo = 0.48;
  // degrees each strip turns from the one above, once it has peeled
  const bend = 8 * c.curl;
  const bg = picture(c);
  const stripH = c.to.height / n;

  // The sheet: strips hinged one under another, each turning about its
  // top edge from the one above — so as the strips peel, bottom first,
  // the paper curls rather than tilting stiffly. Each carries its own
  // band of the picture, and a shade that darkens it as it turns away
  // from the light.
  const sheet = piece(c.over, "fx-peel", {
    left: c.to.left,
    top: c.to.top,
    width: c.to.width,
    height: c.to.height,
  });
  const strips: HTMLElement[] = [];
  const shades: HTMLElement[] = [];
  let parent: HTMLElement = sheet;
  for (let i = 0; i < n; i++) {
    const strip = document.createElement("div");
    strip.className = "fx-peel-strip";
    Object.assign(strip.style, {
      top: i === 0 ? "0px" : `${stripH}px`,
      // a pixel longer than its share, under the next strip, so no
      // hairline of the page shows between them
      height: `${stripH + 1}px`,
      backgroundImage: bg,
      backgroundSize: `${c.to.width}px ${c.to.height}px`,
      backgroundPosition: `0px ${(-i * stripH).toFixed(2)}px`,
    });
    const shade = document.createElement("div");
    shade.className = "fx-peel-shade";
    strip.append(shade);
    parent.append(strip);
    parent = strip;
    strips.push(strip);
    shades.push(shade);
  }

  // strip i's turn at time u (0–1): it peels once the peel creeping up
  // from the bottom reaches it, and straightens again as the sheet floats
  const turn = (i: number, u: number) => {
    const reached = ((n - 1 - i) / n) * letGo * 0.85;
    return bend * ease(u, reached, reached + letGo * 0.3) * (1 - ease(u, letGo, 0.92));
  };
  const steps = Array.from({ length: 37 }, (_, k) => k / 36);
  const stripAnims = strips.map((strip, i) =>
    anim(
      c,
      strip,
      steps.map((u) => ({ transform: `rotateX(${turn(i, u).toFixed(2)}deg)`, offset: u })),
      { duration: t },
    ),
  );
  const shadeAnims = shades.map((shade, i) =>
    anim(
      c,
      shade,
      steps.map((u) => {
        let turned = 0;
        for (let j = 0; j <= i; j++) turned += turn(j, u);
        return { opacity: 0.6 * Math.sin((Math.min(turned, 90) * Math.PI) / 180), offset: u };
      }),
      { duration: t },
    ),
  );

  // the whole sheet: held at the frame by its top while the bottom
  // peels, then off the film and floating up to the front — a touch
  // past full size, as if it came right up to the glass, and back.
  // Shrunk onto the frame, it keeps most of its depth (`zs`), so the
  // peeling bottom visibly comes out toward you.
  const dx = c.from.left + c.from.width / 2 - (c.to.left + c.to.width / 2);
  const dy = c.from.top + c.from.height / 2 - (c.to.top + c.to.height / 2);
  const sx = c.from.width / c.to.width;
  const sy = c.from.height / c.to.height;
  const zs = Math.max(sx, 0.7);
  const lens = "perspective(1100px)";
  const onFilm = `${lens} translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0px) scale3d(${sx.toFixed(4)}, ${sy.toFixed(4)}, ${zs.toFixed(4)})`;
  const close = `${lens} translate3d(0px, ${(-0.012 * c.to.height).toFixed(1)}px, 0px) scale3d(1.035, 1.035, 1.035)`;
  const home = `${lens} translate3d(0px, 0px, 0px) scale3d(1, 1, 1)`;
  emptyAt(c, 0);
  return [
    anim(
      c,
      sheet,
      [
        { transform: onFilm },
        { transform: onFilm, offset: letGo, easing: "cubic-bezier(0.3, 0.6, 0.2, 1)" },
        { transform: close, offset: 0.86, easing: "ease-in-out" },
        { transform: home },
      ],
      { duration: t },
    ),
    ...stripAnims,
    ...shadeAnims,
    // the print itself takes over once the sheet has landed flat
    anim(c, c.photo, [{ opacity: 0 }, { opacity: 0, offset: 0.98 }, { opacity: 1 }], { duration: t }),
    fade(c, c.sheet, t, 0.8),
    fade(c, c.shadow, t, 0.75),
    fade(c, c.backdrop, t, 0.25),
  ];
}

export const PRINT_MOTIONS: Motion[] = [
  {
    id: "peel",
    name: "Peel",
    blurb: "The picture peels off the film like a soft handkerchief — from a different place each time: a corner, an edge, the middle — curls and ripples toward you, then floats to the front of the screen.",
    play: (c) => {
      const t = 1200;
      // the sheet's picture: the frame's own image, already loaded, or a
      // stand-in for a frame still waiting for one
      const img = c.photo.querySelector("img");
      const pictureSource =
        img && img.complete && img.naturalWidth > 0
          ? img
          : placeholderPicture(c.photo.querySelector(".shot-placeholder")?.textContent?.replace(/\.png$/, "") ?? "");
      const cloth = createCloth(
        (canvas) => {
          canvas.dataset.fx = "";
          c.over.append(canvas);
        },
        pictureSource,
        c.from,
        c.to,
        randomCloth(c.curl),
      );
      if (!cloth) return stripPeel(c);
      // drawn before the first paint, so the sheet is already on the frame
      cloth.draw(c.back ? 1 : 0);
      // the cloth is drawn by script, so an animation that does nothing
      // keeps its time — it runs, reverses and stretches like any other,
      // and each frame the cloth is drawn at its progress
      const clock = anim(c, cloth.canvas, [{ opacity: 1 }, { opacity: 1 }], { duration: t });
      const tick = () => {
        if (!cloth.live()) return;
        const p = clock.effect?.getComputedTiming().progress;
        if (p != null) cloth.draw(p);
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      emptyAt(c, 0);
      return [
        clock,
        // the print itself takes over once the sheet has settled flat
        anim(c, c.photo, [{ opacity: 0 }, { opacity: 0, offset: 0.985 }, { opacity: 1 }], { duration: t }),
        fade(c, c.sheet, t, 0.8),
        fade(c, c.shadow, t, 0.75),
        fade(c, c.backdrop, t, 0.15),
      ];
    },
  },
  {
    id: "part",
    name: "Part",
    blurb: "The film splits open at the frame — the strip either side slides apart — and the frame swells out of the gap into the print.",
    play: (c) => {
      const t = 1000;
      const cell = c.origin.closest("li");
      const cells = cell?.parentElement ? [...cell.parentElement.children] : [];
      const at = cell ? cells.indexOf(cell) : -1;
      const spread = c.from.width * 1.35;
      // only the cells on screen need to move
      const near = cells.filter((el) => {
        const r = el.getBoundingClientRect();
        return r.right > -spread && r.left < window.innerWidth + spread;
      });
      emptyAt(c, 0);
      return [
        ...near
          .filter((el) => el !== cell)
          .map((el) =>
            anim(
              c,
              el,
              [{ transform: "none" }, { transform: `translateX(${cells.indexOf(el) < at ? -spread : spread}px)` }],
              { duration: t * 0.5, easing: OUT },
            ),
          ),
        anim(
          c,
          c.paper,
          [
            { transform: flip(c.from, c.to) },
            { transform: flip(c.from, c.to, 1.08), offset: 0.22, easing: SPRING },
            { transform: "none" },
          ],
          { duration: t },
        ),
        fade(c, c.sheet, t, 0.45),
        fade(c, c.shadow, t, 0.4),
        fade(c, c.backdrop, t, 0.2),
      ];
    },
  },
  {
    id: "shards",
    name: "Shards",
    blurb: "The frame bursts into shards, like the desk's screens when they're clicked, that fly out of the strip and fit back together as the print.",
    play: (c) => {
      const t = 1100;
      const cols = 6;
      const rows = 4;
      const rnd = seeded(7);
      const bg = picture(c);
      const s = c.from.width / c.to.width;
      // a jittered grid, each corner shared by the shards round it, so they
      // meet edge to edge
      const corner = Array.from({ length: rows + 1 }, (_, j) =>
        Array.from({ length: cols + 1 }, (_, i) => {
          const edge = i === 0 || j === 0 || i === cols || j === rows;
          const jx = edge && (i === 0 || i === cols) ? 0 : (rnd() - 0.5) * 0.5;
          const jy = edge && (j === 0 || j === rows) ? 0 : (rnd() - 0.5) * 0.5;
          return [((i + jx) / cols) * c.to.width, ((j + jy) / rows) * c.to.height];
        }),
      );
      const fc = { x: c.from.left + c.from.width / 2, y: c.from.top + c.from.height / 2 };
      const shards: Animation[] = [];
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const quad = [corner[j][i], corner[j][i + 1], corner[j + 1][i + 1], corner[j + 1][i]];
          const xs = quad.map((p) => p[0]);
          const ys = quad.map((p) => p[1]);
          const box = { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
          const el = piece(c.over, "fx-shard", {
            left: c.to.left + box.x,
            top: c.to.top + box.y,
            width: box.w,
            height: box.h,
          });
          Object.assign(el.style, {
            backgroundImage: bg,
            backgroundSize: `${c.to.width}px ${c.to.height}px`,
            backgroundPosition: `${-box.x}px ${-box.y}px`,
            clipPath: `polygon(${quad.map(([x, y]) => `${(x - box.x).toFixed(1)}px ${(y - box.y).toFixed(1)}px`).join(", ")})`,
          });
          // where this shard sits inside the frame on the film, and a burst
          // out from the frame's middle on the way up
          const sx = c.from.left + box.x * s;
          const sy = c.from.top + box.y * s;
          const cx = sx + (box.w * s) / 2 - fc.x;
          const cy = sy + (box.h * s) / 2 - fc.y;
          const len = Math.hypot(cx, cy) || 1;
          const kick = 40 + rnd() * 70;
          const spin = (rnd() - 0.5) * 70;
          const start = `translate(${(sx - (c.to.left + box.x)).toFixed(1)}px, ${(sy - (c.to.top + box.y)).toFixed(1)}px) scale(${s.toFixed(4)})`;
          const burst = `translate(${(sx - (c.to.left + box.x) + (cx / len) * kick).toFixed(1)}px, ${(sy - (c.to.top + box.y) + (cy / len) * kick - 30).toFixed(1)}px) scale(${(s * 1.15).toFixed(4)}) rotate(${spin.toFixed(1)}deg)`;
          shards.push(
            anim(
              c,
              el,
              [
                { transform: start, easing: "cubic-bezier(0.2, 0.8, 0.3, 1)" },
                { transform: burst, offset: 0.3, easing: "cubic-bezier(0.5, 0, 0.15, 1)" },
                { transform: "translate(0px, 0px) scale(1) rotate(0deg)" },
              ],
              { duration: t * 0.85, delay: (i + j) * 18 },
            ),
          );
        }
      }
      emptyAt(c, 0);
      return [
        ...shards,
        // the print itself only appears as the last shards land on it
        anim(c, c.photo, [{ opacity: 0 }, { opacity: 0, offset: 0.97 }, { opacity: 1 }], { duration: t }),
        fade(c, c.sheet, t, 0.55),
        fade(c, c.shadow, t, 0.6),
        fade(c, c.backdrop, t * 0.6),
      ];
    },
  },
  {
    id: "loupe",
    name: "Loupe",
    blurb: "A photographer's loupe lands on the frame and magnifies it; then the lens widens out into the whole print.",
    play: (c) => {
      const t = 1200;
      const d = Math.max(c.from.width, c.from.height) * 1.1;
      const fc = { x: c.from.left + c.from.width / 2, y: c.from.top + c.from.height / 2 };
      const tc = { x: c.to.left + c.to.width / 2, y: c.to.top + c.to.height / 2 };
      const ring = piece(c.over, "fx-loupe", { left: fc.x - d / 2, top: fc.y - d / 2, width: d, height: d });
      const mag = 1.7;
      const s = (c.from.width / c.to.width) * mag;
      // the lens's window, in the print's own (unscaled) pixels
      const lens = d / 2 / s;
      const wide = Math.hypot(c.paper.offsetWidth, c.paper.offsetHeight) / 2;
      const move = `translate(${(tc.x - fc.x).toFixed(1)}px, ${(tc.y - fc.y).toFixed(1)}px)`;
      return [
        anim(
          c,
          ring,
          [
            { transform: "scale(1.3)", opacity: 0, easing: OUT },
            { transform: "scale(1)", opacity: 1, offset: 0.28 },
            { transform: "scale(1)", opacity: 1, offset: 0.4, easing: IN_OUT },
            { transform: `${move} scale(1.6)`, opacity: 0, offset: 0.75 },
            { transform: `${move} scale(1.6)`, opacity: 0 },
          ],
          { duration: t },
        ),
        anim(
          c,
          c.paper,
          [
            { transform: flip(c.from, c.to, mag), clipPath: `circle(${lens.toFixed(1)}px at 50% 50%)`, opacity: 0 },
            { transform: flip(c.from, c.to, mag), clipPath: `circle(${lens.toFixed(1)}px at 50% 50%)`, opacity: 1, offset: 0.28 },
            { transform: flip(c.from, c.to, mag), clipPath: `circle(${lens.toFixed(1)}px at 50% 50%)`, opacity: 1, offset: 0.4, easing: IN_OUT },
            { transform: "none", clipPath: `circle(${wide.toFixed(1)}px at 50% 50%)`, opacity: 1 },
          ],
          { duration: t },
        ),
        fade(c, c.sheet, t, 0.7),
        fade(c, c.shadow, t, 0.7),
        fade(c, c.backdrop, t, 0.3),
      ];
    },
  },
  {
    id: "burn",
    name: "Burn",
    blurb: "Like film stuck in a hot projector gate: a glowing amber hole burns open in the frame, and the developed print grows out through it.",
    play: (c) => {
      const t = 1400;
      const s = c.from.width / c.to.width;
      const fc = { x: c.from.left + c.from.width / 2, y: c.from.top + c.from.height / 2 };
      // the hole, in the print's own pixels, wide enough to clear its corners
      const wide = Math.hypot(c.paper.offsetWidth, c.paper.offsetHeight) / 2;
      // the burning edge sits 69% of the way out from the glow's middle
      // (globals.css), so the glow grows to 1/0.69 to keep it on the hole
      const r = wide * s;
      const glow = piece(c.over, "fx-burn", { left: fc.x - r, top: fc.y - r, width: r * 2, height: r * 2 });
      emptyAt(c, t * 0.38);
      return [
        anim(
          c,
          glow,
          [
            { transform: "scale(0)", opacity: 1, easing: "cubic-bezier(0.4, 0, 0.6, 1)" },
            { transform: `scale(${(1 / 0.69).toFixed(3)})`, opacity: 1, offset: 0.38 },
            { transform: `scale(${(1 / 0.69).toFixed(3)})`, opacity: 0, offset: 0.5 },
            { transform: `scale(${(1 / 0.69).toFixed(3)})`, opacity: 0 },
          ],
          { duration: t },
        ),
        anim(
          c,
          c.paper,
          [
            { transform: flip(c.from, c.to), clipPath: "circle(0px at 50% 50%)", easing: "cubic-bezier(0.4, 0, 0.6, 1)" },
            { transform: flip(c.from, c.to), clipPath: `circle(${wide.toFixed(1)}px at 50% 50%)`, offset: 0.38, easing: SPRING },
            { transform: "none", clipPath: `circle(${wide.toFixed(1)}px at 50% 50%)` },
          ],
          { duration: t },
        ),
        fade(c, c.sheet, t, 0.6),
        fade(c, c.shadow, t, 0.55),
        fade(c, c.backdrop, t, 0.35),
      ];
    },
  },
  {
    id: "exposure",
    name: "Long exposure",
    blurb: "The frame streaks out to the middle trailing ghosts of its negative, like a long-exposure photo, and lands sharp and developed.",
    play: (c) => {
      const t = 850;
      const bg = picture(c);
      emptyAt(c, 0);
      const ghosts = [0.5, 0.36, 0.24, 0.14, 0.08].map((strength, k) => {
        const el = piece(c.under, "fx-ghost", {
          left: c.to.left,
          top: c.to.top,
          width: c.to.width,
          height: c.to.height,
        });
        el.style.backgroundImage = bg;
        return anim(
          c,
          el,
          [
            { transform: flip(c.from, c.to), opacity: strength, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
            { transform: "none", opacity: strength * 0.6, offset: 0.8 },
            { transform: "none", opacity: 0 },
          ],
          { duration: t, delay: (k + 1) * 45 },
        );
      });
      return [
        ...ghosts,
        anim(c, c.paper, [{ transform: flip(c.from, c.to) }, { transform: "none" }], {
          duration: t,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
        }),
        fade(c, c.sheet, t, 0.5),
        fade(c, c.shadow, t, 0.5),
        fade(c, c.backdrop, t * 0.7),
      ];
    },
  },
  {
    id: "printhead",
    name: "Print head",
    blurb: "An amber scan line reads down the frame, then the print feeds out of it, drawn onto white paper line by line as it grows.",
    play: (c) => {
      const t = 1500;
      const scan = piece(c.over, "fx-scan", {
        left: c.from.left,
        top: c.from.top,
        width: c.from.width,
        height: 2,
      });
      // blank paper over the picture, rolling up off it from the top down,
      // and the print head riding its edge — both on the print, so they
      // move with it
      const blank = document.createElement("div");
      blank.dataset.fx = "";
      blank.className = "fx-blank";
      const head = document.createElement("div");
      head.dataset.fx = "";
      head.className = "fx-head";
      c.photo.append(blank, head);
      const h = c.to.height;
      return [
        anim(
          c,
          scan,
          [
            { transform: "translateY(0px)", opacity: 0 },
            { transform: "translateY(0px)", opacity: 1, offset: 0.04 },
            { transform: `translateY(${c.from.height.toFixed(1)}px)`, opacity: 1, offset: 0.26 },
            { transform: `translateY(${c.from.height.toFixed(1)}px)`, opacity: 0, offset: 0.3 },
            { transform: `translateY(${c.from.height.toFixed(1)}px)`, opacity: 0 },
          ],
          { duration: t, easing: "linear" },
        ),
        anim(
          c,
          c.paper,
          [
            { transform: flip(c.from, c.to), opacity: 0 },
            { transform: flip(c.from, c.to), opacity: 0, offset: 0.24 },
            { transform: flip(c.from, c.to), opacity: 1, offset: 0.3, easing: OUT },
            { transform: "none", opacity: 1, offset: 0.62 },
            { transform: "none", opacity: 1 },
          ],
          { duration: t },
        ),
        anim(
          c,
          blank,
          [
            { transform: "scaleY(1)" },
            { transform: "scaleY(1)", offset: 0.38 },
            { transform: "scaleY(0)" },
          ],
          { duration: t, easing: "linear" },
        ),
        anim(
          c,
          head,
          [
            { transform: "translateY(0px)", opacity: 0 },
            { transform: "translateY(0px)", opacity: 1, offset: 0.38 },
            { transform: `translateY(${h.toFixed(1)}px)`, opacity: 1, offset: 0.97 },
            { transform: `translateY(${h.toFixed(1)}px)`, opacity: 0 },
          ],
          { duration: t, easing: "linear" },
        ),
        fade(c, c.sheet, t, 0.24),
        fade(c, c.shadow, t, 0.35),
        fade(c, c.backdrop, t, 0.2),
      ];
    },
  },
];

export function printMotion(id: MotionId) {
  return PRINT_MOTIONS.find((m) => m.id === id) ?? PRINT_MOTIONS[0];
}
