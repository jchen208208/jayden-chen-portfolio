"use client";

import {
  useCallback,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";

/** the panel the stops point at */
export const PANEL_ID = "tl-panel";

/**
 * The timeline's state, shared by every design: which stage is chosen, which
 * way the last move went (+1 later, −1 earlier) and how many moves there have
 * been (so a design can replay its move animation, and skip it on load).
 *
 * The stops are found by their own boxes, so picking "the stop nearest the
 * pointer" works the same for a straight rail, a winding road or a grid of
 * LEDs. A mouse or pen can drag across them; a finger only taps, so the page
 * still scrolls under it.
 */
export function useStages(count: number) {
  const [state, setState] = useState({ index: 0, dir: 1, moves: 0 });
  const stops = useRef<(HTMLElement | null)[]>([]);
  const dragging = useRef(false);
  const last = count - 1;

  const go = useCallback(
    (i: number, focus = false) => {
      const next = Math.max(0, Math.min(last, i));
      setState((s) =>
        next === s.index ? s : { index: next, dir: next > s.index ? 1 : -1, moves: s.moves + 1 },
      );
      if (focus) stops.current[next]?.focus({ preventScroll: true });
    },
    [last],
  );

  const nearest = (x: number, y: number) => {
    let best = -1;
    let bestD = Infinity;
    stops.current.forEach((el, i) => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      const d = (r.left + r.width / 2 - x) ** 2 + (r.top + r.height / 2 - y) ** 2;
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    return best;
  };

  const onPointerDown = (e: PointerEvent<HTMLElement>) => {
    if (e.button !== 0) return;
    const i = nearest(e.clientX, e.clientY);
    if (i >= 0) go(i, true);
    if (e.pointerType === "touch") return;
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    if (!dragging.current) return;
    const i = nearest(e.clientX, e.clientY);
    if (i >= 0) go(i, true);
  };
  const stopDrag = () => {
    dragging.current = false;
  };

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    const to =
      e.key === "ArrowRight" || e.key === "ArrowDown"
        ? state.index + 1
        : e.key === "ArrowLeft" || e.key === "ArrowUp"
          ? state.index - 1
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? last
              : null;
    if (to === null) return;
    e.preventDefault();
    go(to, true);
  };

  /** spread on the element holding the stops */
  const trackProps = {
    role: "tablist" as const,
    "aria-label": "Build stages",
    onPointerDown,
    onPointerMove,
    onPointerUp: stopDrag,
    onPointerCancel: stopDrag,
    onKeyDown,
  };

  /** spread on each stop (a `<button>`) */
  const stopProps = (i: number, label: string, controls = PANEL_ID) => ({
    ref: (el: HTMLElement | null) => {
      stops.current[i] = el;
    },
    type: "button" as const,
    role: "tab" as const,
    id: `tl-stop-${i}`,
    "aria-selected": i === state.index,
    "aria-controls": controls,
    "aria-label": label,
    tabIndex: i === state.index ? 0 : -1,
    onClick: () => go(i),
  });

  return { ...state, count, last, go, trackProps, stopProps };
}

export type Stages = ReturnType<typeof useStages>;
