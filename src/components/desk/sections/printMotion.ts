/**
 * How a print comes out of its frame on the About film, and goes back:
 * Mount. A thin white border snaps on round the picture while it's still in
 * the strip, like a slide mount, and the mounted print glides up to the
 * front of the screen. Going back is the same, run in reverse and a little
 * quicker — it glides down onto the frame and the border comes off.
 *
 * It moves only what the browser can animate off the main thread — the
 * print's own layers (`print.tsx`), by `transform` and `opacity`.
 */

export type PrintParts = {
  /** the dimming over the page */
  backdrop: HTMLElement;
  /** the whole print — what glides and grows */
  paper: HTMLElement;
  /** its white paper */
  sheet: HTMLElement;
  /** its shadow */
  shadow: HTMLElement;
  /** the picture */
  photo: HTMLElement;
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
const DURATION = 490;
const BACK = 0.7;
/** when the border has snapped on, and the glide starts */
const SNAP = 0.24;

/** marks a frame's button on the film as having its picture out as a
 * print — its window shows empty (globals.css) — or back home */
export function markOut(frame: HTMLElement, out: boolean) {
  if (out) frame.dataset.out = "";
  else delete frame.dataset.out;
}

/** a CSS `cubic-bezier()`, as a function — for the glide's sampled path */
function bezier(x1: number, y1: number, x2: number, y2: number) {
  const curve = (a: number, b: number, s: number) => 3 * a * s * (1 - s) ** 2 + 3 * b * s * s * (1 - s) + s ** 3;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    // find the curve's s for this x by halving, then read its y
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (curve(x1, x2, mid) < x) lo = mid;
      else hi = mid;
    }
    return curve(y1, y2, (lo + hi) / 2);
  };
}

const OUT = "cubic-bezier(0.22, 1, 0.36, 1)";
const glide = bezier(0.5, 0, 0.15, 1);

/** Animates `el` for this run: forwards on the way out, in reverse (and a
 *  little quicker) on the way back, held at both ends so nothing flickers
 *  between a run ending and the next thing taking over. */
function anim(c: MotionContext, el: Element, keyframes: Keyframe[]) {
  return el.animate(keyframes, {
    duration: DURATION * (c.back ? BACK : 1),
    direction: c.back ? "reverse" : "normal",
    fill: "both",
  });
}

/** fades in from `startAt` (a fraction of the run) to the end — eased on
 *  that stretch alone, so the fade starts when it says */
function fade(c: MotionContext, el: Element, startAt: number) {
  return anim(c, el, [{ opacity: 0 }, { opacity: 0, offset: startAt, easing: "ease-out" }, { opacity: 1 }]);
}

const centre = (r: DOMRect) => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 });

/** The paper's way from the frame to the front: held with its picture on
 *  the frame until `start`, then gliding across, its picture growing from
 *  the frame's size to the print's. Sampled, so the glide's easing paces
 *  where it is and how big together. */
function glidePath(c: MotionContext, start: number): Keyframe[] {
  const a = centre(c.from);
  const b = centre(c.to);
  const at = (offset: number, p: number): Keyframe => {
    const w = c.from.width + (c.to.width - c.from.width) * p;
    const h = c.from.height + (c.to.height - c.from.height) * p;
    const x = a.x + (b.x - a.x) * p - b.x;
    const y = a.y + (b.y - a.y) * p - b.y;
    return {
      offset,
      transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${(w / c.to.width).toFixed(4)}, ${(h / c.to.height).toFixed(4)})`,
    };
  };
  const steps = 28;
  return [
    at(0, 0),
    ...Array.from({ length: steps + 1 }, (_, i) => at(start + ((1 - start) * i) / steps, glide(i / steps))),
  ];
}

/** Mount: the border snaps on round the picture in the strip, then the
 *  mounted print glides up to the front — or, going back, glides down onto
 *  the frame and its border comes off. */
export function mount(c: MotionContext): Animation[] {
  // the white sheet starts shrunk to just under the picture, so the border
  // grows out from the picture's edges
  const tucked = `scale(${(c.photo.offsetWidth / Math.max(1, c.paper.offsetWidth)).toFixed(4)}, ${(c.photo.offsetHeight / Math.max(1, c.paper.offsetHeight)).toFixed(4)})`;
  // the picture has left the film once its mount is on
  if (!c.back) window.setTimeout(c.empty, DURATION * SNAP);
  return [
    anim(c, c.sheet, [
      { transform: tucked, opacity: 0, easing: OUT },
      { transform: "scale(1, 1)", opacity: 1, offset: SNAP },
      { transform: "scale(1, 1)", opacity: 1 },
    ]),
    anim(c, c.paper, glidePath(c, SNAP + 0.02)),
    fade(c, c.shadow, 0.3),
    fade(c, c.backdrop, 0.12),
  ];
}
