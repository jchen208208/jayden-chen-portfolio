"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { CardOptions } from "./shared";

/**
 * What the three Skills bodies share: the sized, "is it live yet" wrapper, and
 * the "used in" caption line.
 */

/** the bodies' inner padding — grows with the card, like their type */
export const PAD = "clamp(14px, 4.5cqw, 28px)";

const LiveContext = createContext(false);

/** true once the card is on screen for real: the overlay is open and the
 *  genie warp has handed over to the live cards. Anything that runs on a
 *  timer waits for it, so the first thing a visitor sees is the start. */
export const useLive = () => useContext(LiveContext);

const HOST = "[data-cards-revealed]";

/**
 * The body's box, and the one place `live` is worked out.
 *
 * Row layout: fills whatever height the card was given from outside, and is a
 * size container so everything inside can scale from its width and height.
 * Stack layout has no outside height, so the box takes a fixed `aspect` instead.
 *
 * `data-live` is what the stylesheet reads: until it is true every `.sk-anim`
 * is held at its first frame (see `.sk-live` in globals.css). The desktop
 * overlay snapshots the cards for the genie warp before it reveals them
 * (`data-cards-revealed`, set on an ancestor); with no such ancestor — the
 * mobile / deep-link page — the body is live as soon as it mounts.
 */
export function SkillPane({
  layout,
  active,
  aspect,
  children,
}: CardOptions & { aspect: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const subscribe = useCallback((notify: () => void) => {
    const host = ref.current?.closest<HTMLElement>(HOST);
    if (!host) return () => {};
    const watch = new MutationObserver(notify);
    watch.observe(host, { attributes: true, attributeFilter: ["data-cards-revealed"] });
    return () => watch.disconnect();
  }, []);
  const revealed = useSyncExternalStore(
    subscribe,
    () => {
      const host = ref.current?.closest<HTMLElement>(HOST);
      return host ? host.dataset.cardsRevealed === "true" : ref.current !== null;
    },
    () => false,
  );
  const live = active && revealed;

  return (
    <LiveContext.Provider value={live}>
      <div
        ref={ref}
        data-live={live}
        className={`sk-live ${layout === "row" ? "min-h-0 flex-1" : "mx-auto w-full"}`}
        style={{
          containerType: "size",
          // the page-wide stack is much wider than a card in the row, so keep
          // the body at a card-like size and centred
          ...(layout === "stack" && { aspectRatio: aspect, maxWidth: "30rem" }),
        }}
      >
        {children}
      </div>
    </LiveContext.Provider>
  );
}

/** the caption under a hovered skill: where it was used, up to three places.
 *  Always the same height, so showing and hiding it never moves anything. */
export function UsedIn({ names }: { names: string[] }) {
  const shown = names.slice(0, 3);
  const more = names.length - shown.length;
  return (
    <div
      className="font-mono uppercase leading-snug tracking-wide"
      style={{ fontSize: "clamp(10px, 2.9cqw, 14px)", minHeight: "2.7em" }}
    >
      {shown.length > 0 && (
        <>
          <span className="text-white/45">Used in </span>
          <span className="text-white/80">
            {shown.join(" · ")}
            {more > 0 && ` +${more}`}
          </span>
        </>
      )}
    </div>
  );
}
