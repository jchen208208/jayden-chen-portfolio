"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { SectionId } from "@/lib/site";
import { useScrollLock } from "@/hooks/useScrollLock";
import { SectionBackdrop, SectionTitle, hasBackdrop } from "@/components/desk/sections";

/**
 * A section as its own page — what a phone gets when it taps a card on the
 * stacked desk, and what a deep link (`/skills`, …) shows on any screen. The
 * same header and the same `ScreenCard`s as the desktop overlay in
 * `DeskScene`, just stacked one under another and scrolled normally.
 *
 * Rendered by each section `page.tsx` on top of the still-mounted desk (which
 * lives in the `(desk)` layout).
 *
 * - `Esc`, the close button, and a click on the ground around the cards all
 *   return to `/` — except where a section lays its own backdrop over that
 *   ground (Skills' mat), which runs the length of the page behind it.
 * - Page scroll is locked while open; the frame scrolls itself.
 * - Focus is trapped and returned to the opener on close.
 */
export default function FocusFrame({
  id,
  children,
}: {
  id: SectionId;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<Element | null>(null);

  useScrollLock(true);

  const close = useCallback(() => {
    router.push("/");
  }, [router]);

  useEffect(() => {
    openerRef.current = document.activeElement;
    const panel = panelRef.current;
    panel?.focus({ preventScroll: true });

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key === "Tab" && panel) {
        const focusables = panel.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      const opener = openerRef.current;
      if (opener instanceof HTMLElement) opener.focus({ preventScroll: true });
    };
  }, [close]);

  const panel = (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="section-title"
      tabIndex={-1}
      // over a backdrop (Skills' mat), start below the mat's ruled border
      className={`relative mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 outline-none ${
        hasBackdrop(id) ? "pb-24 pt-24 sm:pt-28" : "py-8 sm:py-12"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <h1
          id="section-title"
          className="text-[clamp(1.75rem,8vw,3.5rem)] uppercase leading-none text-ink"
        >
          <SectionTitle id={id} />
        </h1>
        <button
          type="button"
          onClick={close}
          aria-label="Close and return to the desk"
          className="mt-1 shrink-0 rounded px-2 py-1 font-mono text-xs text-white/60 ring-1 ring-inset ring-white/15 transition-colors hover:text-white"
        >
          esc ✕
        </button>
      </div>
      {children}
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-paper"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      {hasBackdrop(id) ? (
        <div className="relative min-h-full">
          <div aria-hidden className="pointer-events-none absolute inset-3 sm:inset-6">
            <SectionBackdrop id={id} />
          </div>
          {panel}
        </div>
      ) : (
        panel
      )}
    </div>
  );
}
