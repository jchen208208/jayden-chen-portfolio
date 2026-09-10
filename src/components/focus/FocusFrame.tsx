"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { SECTIONS, type SectionId } from "@/lib/site";
import { useScrollLock } from "@/hooks/useScrollLock";
import ViewTransition from "@/components/motion/ViewTransition";
import AppWindow from "@/components/apps/AppWindow";

/**
 * Fullscreen overlay that hosts one section's "app", morphing out of the desk
 * screen it was opened from. Rendered by each section `page.tsx` on top of the
 * still-mounted desk (which lives in the `(desk)` layout).
 *
 * - `Esc`, the close button, and a click on the dimmed gutter all return to `/`.
 * - Page scroll is locked while open; the section scrolls inside `AppWindow`.
 * - Focus is trapped and returned to the opener on close.
 */
export default function FocusFrame({
  id,
  children,
}: {
  id: SectionId;
  children: React.ReactNode;
}) {
  const meta = SECTIONS[id];
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<Element | null>(null);

  useScrollLock(true);

  const close = useCallback(() => {
    // Navigating to "/" pairs this panel's <ViewTransition> with the desk screen
    // of the same name, so the morph reverses for free.
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

  return (
    <div
      className="fixed inset-0 z-50 flex bg-black/70 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <ViewTransition name={`screen-${id}`} share="morph" fallback="none">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={meta.appName}
          tabIndex={-1}
          className="focus-panel m-auto flex h-full w-full max-w-[1100px] flex-col outline-none sm:h-[min(88vh,760px)] sm:rounded-xl sm:shadow-2xl"
          style={{ ["--accent" as string]: `var(${meta.accentVar})` }}
        >
          <AppWindow
            appName={meta.appName}
            onClose={
              <button
                type="button"
                onClick={close}
                className="rounded px-2 py-0.5 font-mono text-xs text-[color:var(--app-fg-soft)] ring-1 ring-inset ring-white/10 transition-colors hover:text-[color:var(--app-fg)]"
                aria-label="Close and return to the desk"
              >
                esc ✕
              </button>
            }
          >
            <ViewTransition
              name={`screen-${id}-body`}
              enter="auto"
              exit="auto"
              fallback="none"
            >
              <div className="h-full">{children}</div>
            </ViewTransition>
          </AppWindow>
        </div>
      </ViewTransition>
    </div>
  );
}
