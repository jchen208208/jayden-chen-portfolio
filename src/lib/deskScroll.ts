/**
 * The desk camera timeline — the one source of truth shared by `DeskStage`
 * (which draws the frames) and `SmoothScroll` (which gates the scroll at the
 * framed beat).
 *
 * Lengths are fractions of the viewport height, laid out back to back:
 *
 *   0 ─── zoomIn ───▶ gate ─── hold ───▶ ─── zoomOut ───▶ end
 *   title over a     desk       desk      desk shrinks and lifts,
 *   low, small desk  framed     holds     the next section rises
 */
export const DESK_TIMELINE = {
  /** desk rises from its rest pose into full frame while the title lifts away */
  zoomIn: 0.9,
  /** the framed desk holds still before the next section takes over */
  hold: 0.3,
  /** desk zooms back out — smaller and higher — as the next section arrives */
  zoomOut: 0.95,
} as const;

/**
 * Runway height, in `vh` — the scroll the pinned stage travels, plus the
 * viewport the sticky stage itself eats. Sized so the pin releases exactly as
 * the zoom-out finishes.
 */
export const DESK_RUNWAY_VH =
  100 * (1 + DESK_TIMELINE.zoomIn + DESK_TIMELINE.hold + DESK_TIMELINE.zoomOut);

/**
 * Scroll position of the framed beat: the desk centred and fully zoomed in.
 *
 * Nothing may scroll past this until it has actually been reached, so one
 * hard flick can't skip the frame entirely — see `SmoothScroll`.
 */
export function deskGateY(viewportH: number) {
  return viewportH * DESK_TIMELINE.zoomIn;
}
