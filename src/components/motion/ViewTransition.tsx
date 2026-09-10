import { ViewTransition as ReactViewTransition } from "react";
import type { ReactNode } from "react";

/**
 * Thin wrapper around React's experimental `<ViewTransition>`.
 *
 * - Next aliases bare `react` to its bundled copy, which ships the component.
 * - If it is ever missing (older React, a regression), this renders `children`
 *   directly, so every caller degrades to an instant swap with no error.
 * - All view-transition animation is progressive enhancement — the site is
 *   fully functional without it.
 */
export default function ViewTransition({
  name,
  share,
  enter,
  exit,
  fallback = "none",
  children,
}: {
  name?: string;
  share?: string;
  enter?: string;
  exit?: string;
  /** value for the reserved-word `default` prop */
  fallback?: string;
  children: ReactNode;
}) {
  if (typeof ReactViewTransition !== "function") return <>{children}</>;

  return (
    <ReactViewTransition
      name={name}
      share={share}
      enter={enter}
      exit={exit}
      default={fallback}
    >
      {children}
    </ReactViewTransition>
  );
}
