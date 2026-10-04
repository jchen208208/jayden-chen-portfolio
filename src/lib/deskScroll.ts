/**
 * The desk camera move, driven by `DeskStage`.
 *
 * One continuous move over `DESK_SCROLL` viewport heights of scroll — the
 * desk never stops moving:
 *
 *   0 ──────────────────────── framed ──────────────────────── 1
 *   title over a low,      desk centred at its       desk parked high,
 *   small desk             biggest, passing slowly   the next section risen
 *
 * It used to be three phases (zoom in, hold, zoom out) with a hard gate at
 * the framed beat. The hold moved nothing for a stretch of scrolling and the
 * gate swallowed input until the wheel went quiet, which read as a pause, and
 * the zoom-out then set off at full speed from a standstill. Now the desk
 * only *slows* through the framed pose (see `deskRise`), and the gate is a
 * brief catch (see `SmoothScroll`).
 */

/** scroll the whole move takes, in viewport heights (was 2.15, then 1.8 —
 *  leaving the desk took a bit too much scrolling) */
export const DESK_SCROLL = 1.8;

/**
 * Runway height, in `vh` — the scroll the move travels, plus the viewport the
 * sticky stage itself eats. Sized so the pin releases exactly as the move
 * finishes.
 */
export const DESK_RUNWAY_VH = 100 * (1 + DESK_SCROLL);

/** how much the desk slows as it passes the framed pose: its rise runs at
 *  `1 - LINGER` of its average speed there, and `1 + LINGER` at either end.
 *  Under 1, so it never comes to a stop. */
const LINGER = 0.5;

/**
 * How far the desk has risen (0 → 1) at progress `t` (0 → 1). Monotonic and
 * smooth, slowest at the framed pose in the middle (`t = 0.5`, where it's
 * exactly half way), so the desk lingers there without ever holding still.
 */
export function deskRise(t: number) {
  return t + (LINGER * Math.sin(2 * Math.PI * t)) / (2 * Math.PI);
}

/**
 * How zoomed in the desk is (0 → 1 → 0) at progress `t`: a smooth bump,
 * fully framed at `t = 0.5`, and starting and finishing at rest size with no
 * jolt at either end.
 */
export function deskZoom(t: number) {
  return (1 - Math.cos(2 * Math.PI * t)) / 2;
}

/**
 * Scroll position of the framed beat — the desk centred at its biggest, half
 * way through the move. `SmoothScroll` briefly catches the scroll here so one
 * hard flick can't fly straight past it.
 */
export function deskGateY(viewportH: number) {
  return viewportH * DESK_SCROLL * 0.5;
}
