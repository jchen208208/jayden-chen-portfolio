/**
 * How a print comes out of its frame on the About film, and goes back: it
 * peels off the film like a soft handkerchief (`cloth.ts`) — from a different
 * place each time — and floats up to the front of the screen, landing as the
 * print; going back is the same, run in reverse and a little quicker.
 *
 * It moves only what the browser can animate off the main thread — the
 * print's own layers (`print.tsx`) by `transform` and `opacity`, and the
 * handkerchief on a WebGL canvas, a throwaway piece marked `data-fx` and
 * cleared away once it's done.
 */

import { createCloth, placeholderPicture, randomCloth } from "./cloth";

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
  /** a layer over the print, for the peel's own pieces */
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
  /** going back into the frame: everything runs in reverse */
  back: boolean;
  /** the picture has left the film: its frame shows as an empty window
   *  until the print comes back (`data-out`) */
  empty: () => void;
};

/** how long the way out takes (ms), and how much quicker the way back is */
const DURATION = 900;
const BACK = 0.7;
/** how far the paper curls as it peels — 1 is a deep curl, this is gentle */
const CURL = 0.5;

/** marks a frame's button on the film as having its picture out as a
 * print — its window shows empty (globals.css) — or back home */
export function markOut(frame: HTMLElement, out: boolean) {
  if (out) frame.dataset.out = "";
  else delete frame.dataset.out;
}

/** Animates `el` for this run: forwards on the way out, in reverse (and a
 *  little quicker) on the way back, held at both ends so nothing flickers
 *  between a run ending and the next thing taking over. */
function anim(
  c: MotionContext,
  el: Element,
  keyframes: Keyframe[],
  { duration, easing = "linear" }: { duration: number; easing?: string },
) {
  return el.animate(keyframes, {
    duration: duration * (c.back ? BACK : 1),
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

/** a throwaway piece of the peel, in the layer over the print, at a spot on
 *  the screen */
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
  window.setTimeout(c.empty, at);
}

/** eases from 0 to 1 as `u` goes from `a` to `b` */
function ease(u: number, a: number, b: number) {
  const x = Math.min(1, Math.max(0, (u - a) / (b - a)));
  return x * x * (3 - 2 * x);
}

/** Peel without WebGL: the sheet as strips hinged one under another,
 *  peeling from the bottom up and floating out — stiffer than the cloth, but
 *  the same idea */
function stripPeel(c: MotionContext): Animation[] {
  const t = DURATION;
  // strips the sheet bends along, and when its top lets go of the film
  const n = 10;
  const letGo = 0.48;
  // degrees each strip turns from the one above, once it has peeled
  const bend = 8 * CURL;
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

/** The peel: the frame's picture comes off the film as a soft handkerchief
 *  and floats up to the front of the screen as the print — or, going back,
 *  floats down and lies back on the film. */
export function peel(c: MotionContext): Animation[] {
  const t = DURATION;
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
    randomCloth(CURL),
  );
  if (!cloth) return stripPeel(c);
  // drawn before the first paint, so the sheet is already on the frame
  cloth.draw(c.back ? 1 : 0);
  // the cloth is drawn by script, so an animation that does nothing keeps
  // its time — it runs and reverses like any other, and each frame the
  // cloth is drawn at its progress
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
}
