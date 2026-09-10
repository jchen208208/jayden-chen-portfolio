"use client";

import { useEffect } from "react";

/**
 * Locks page scroll while `active`, compensating for the scrollbar width so the
 * desk behind doesn't shift. Restores the previous scroll position on release.
 */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const { body, documentElement: html } = document;
    const scrollY = window.scrollY;
    const barWidth = window.innerWidth - html.clientWidth;

    const prev = {
      overflow: html.style.overflow,
      paddingRight: body.style.paddingRight,
    };
    html.style.overflow = "hidden";
    if (barWidth > 0) body.style.paddingRight = `${barWidth}px`;

    return () => {
      html.style.overflow = prev.overflow;
      body.style.paddingRight = prev.paddingRight;
      window.scrollTo(0, scrollY);
    };
  }, [active]);
}
