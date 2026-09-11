"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import type { MouseEvent } from "react";
import { createPortal } from "react-dom";
import { DESK_VIEWBOX } from "@/lib/desk";
import { useScrollLock } from "@/hooks/useScrollLock";
import DeskSvg from "./DeskSvg";
import DeskCardList from "./DeskCardList";

/**
 * Screen 1's glass rect, in viewBox units — must track the inset rect drawn
 * for the leftmost monitor in `DeskSvg` (`Screen x={382} y={239} w={202}
 * h={138}`, default inset 10).
 *
 * First pass at the "click a screen, it takes over the screen" interaction,
 * scoped to just this one screen with a placeholder triangle standing in for
 * real section content — not wired to routing yet.
 *
 * This is an illusion, not a literal camera zoom: continuously scaling the
 * whole hand-drawn desk SVG up to fill the viewport would crop it unevenly
 * (its aspect ratio rarely matches the viewport's) and drag along whatever
 * scroll-driven transform `DeskStage` has applied to an ancestor. Instead, a
 * separate, purpose-built fullscreen view (a fresh triangle, correctly
 * centered and letterboxed) fades/scales in from the click point, portaled
 * straight to `<body>` so it isn't nested inside — and doesn't inherit — any
 * transformed ancestor.
 */
const SCREEN_1_GLASS = { x: 392, y: 249, w: 182, h: 118 };

export default function DeskScene({ className }: { className?: string }) {
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  // `document.body` doesn't exist during SSR — this flips to true only once
  // mounted on the client, without a setState-in-effect.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useScrollLock(zoomed);

  const openScreen1 = useCallback((e: MouseEvent<HTMLButtonElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    setOrigin({
      x: ((box.left + box.width / 2) / window.innerWidth) * 100,
      y: ((box.top + box.height / 2) / window.innerHeight) * 100,
    });
    setZoomed(true);
  }, []);

  const close = useCallback(() => setZoomed(false), []);

  useEffect(() => {
    if (!zoomed) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomed, close]);

  return (
    <div className={className}>
      <div className="mx-auto hidden w-full max-w-[1180px] px-4 md:block">
        <div
          className="relative w-full"
          style={{ aspectRatio: `${DESK_VIEWBOX.w} / ${DESK_VIEWBOX.h}` }}
        >
          <DeskSvg className="absolute inset-0 h-full w-full" />
          <button
            type="button"
            aria-label="Open screen"
            onClick={openScreen1}
            className="absolute cursor-pointer outline-none"
            style={{
              left: `${(SCREEN_1_GLASS.x / DESK_VIEWBOX.w) * 100}%`,
              top: `${(SCREEN_1_GLASS.y / DESK_VIEWBOX.h) * 100}%`,
              width: `${(SCREEN_1_GLASS.w / DESK_VIEWBOX.w) * 100}%`,
              height: `${(SCREEN_1_GLASS.h / DESK_VIEWBOX.h) * 100}%`,
            }}
          />
        </div>
      </div>

      <div className="md:hidden">
        <DeskCardList />
      </div>

      {mounted &&
        createPortal(
          <div
            aria-hidden={!zoomed}
            onClick={close}
            className="fixed inset-0 z-50 flex cursor-pointer items-center justify-center transition-opacity duration-500 ease-out"
            style={{
              backgroundColor: "var(--paper, #000)",
              opacity: zoomed ? 1 : 0,
              pointerEvents: zoomed ? "auto" : "none",
            }}
          >
            {/* fresh, purpose-built fullscreen view — not a scaled copy of the
                desk SVG, so it stays crisp and correctly proportioned at any
                viewport size */}
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="xMidYMid meet"
              className="h-full w-full transition-transform duration-500 ease-out"
              style={{
                transform: zoomed ? "scale(1)" : "scale(0.02)",
                transformOrigin: `${origin.x}% ${origin.y}%`,
              }}
            >
              <polygon points="38,28 38,72 68,50" fill="var(--ink, #f4f6f8)" />
            </svg>
          </div>,
          document.body,
        )}
    </div>
  );
}
