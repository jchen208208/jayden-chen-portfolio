import type { ReactNode } from "react";

/** how a section's cards are being laid out:
 *  - `row`: side by side in the desktop overlay, each card given a fixed
 *    height from outside (see `boxLayout` in `DeskScene`) — bodies fill it and
 *    scroll inside themselves if they have to
 *  - `stack`: one under another on the mobile / deep-link page, each card as
 *    tall as its own content */
export type CardLayout = "row" | "stack";

export type CardOptions = {
  layout: CardLayout;
  /** false while the overlay is closed — anything that animates on its own
   *  (the board viewer) parks itself */
  active: boolean;
};

export type SectionCard = {
  key: string;
  /** empty for a card with no title strip */
  title: string;
  body: ReactNode;
  /** caps the row's width in the desktop overlay (the first card's value is
   *  used) — a single wide card reads better centred than edge to edge */
  maxWidth?: string;
  /** render without the card's own frame (see `ScreenCard`'s `bare`) */
  bare?: boolean;
  /** size the row to its content instead of filling the view — the open
   *  view then scrolls as a page when the content runs long (first card's
   *  value is used) */
  fitContent?: boolean;
  /** the card animates itself in instead of being unfurled by the genie
   *  warp — it is simply revealed once the header has settled, and its own
   *  CSS takes it from there (first card's value is used) */
  ownEntrance?: boolean;
};

/** the scrolling text body most cards use — mono, one consistent padding */
export function CardBody({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-5 py-5 font-mono text-sm text-white ${className}`}
    >
      {children}
    </div>
  );
}

/** a small uppercase line above a card's main text — dates, periods, tags */
export function Meta({ children }: { children: ReactNode }) {
  return <div className="shrink-0 text-xs uppercase tracking-wide text-white/60">{children}</div>;
}

export function Bullets({ items, large = false }: { items: string[]; large?: boolean }) {
  return (
    <ul
      className={`shrink-0 space-y-1.5 leading-relaxed text-white/75 ${large ? "text-base" : "text-xs"}`}
    >
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span aria-hidden className="text-white/40">
            —
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** stands in for a project's or a role's picture until it has one — the file
 *  it's waiting for, on the desk screens' umber glass */
export function ShotPlaceholder({ slug }: { slug: string }) {
  return (
    <div className="shot-placeholder flex h-full w-full flex-col items-center justify-center gap-[4%]">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
        aria-hidden
        className="w-[18%]"
      >
        <rect x="3" y="4" width="18" height="16" rx="1" />
        <circle cx="9" cy="9.5" r="1.75" />
        <path d="M3 17l5-5 4 4 3-3 5 5" />
      </svg>
      <span className="font-screen text-lg leading-none">{slug}.png</span>
    </div>
  );
}

export function CardLink({ href, children }: { href: string; children: ReactNode }) {
  const external = /^https?:/.test(href);
  return (
    <a
      href={href}
      {...(external && { target: "_blank", rel: "noreferrer" })}
      className="underline decoration-white/30 underline-offset-4 transition-colors hover:decoration-white"
    >
      {children}
    </a>
  );
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2025-05-01" → "May 2025" — by hand, not `toLocaleDateString`, so the
 *  server and the browser can't disagree about the locale */
export function monthYear(iso: string) {
  const [y, m] = iso.split("-");
  return `${MONTHS[Number(m) - 1]} ${y}`;
}
