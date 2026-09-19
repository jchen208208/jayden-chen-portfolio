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

export type SectionCard = { key: string; title: string; body: ReactNode };

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

export function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="shrink-0 space-y-1.5 text-xs leading-relaxed text-white/75">
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
