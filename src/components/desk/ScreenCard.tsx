import type { CSSProperties, ReactNode, Ref } from "react";

/**
 * The one card every opened section is built from — same chrome for all four,
 * only the body changes. A 3px white frame with the card's name knocked out of
 * a filled white strip across the top: the strip's white-to-black edge against
 * the dark interior already reads as a dividing line, so there's no extra rule
 * under it, and the name is coloured like the page so it reads as cut out of
 * the fill rather than sitting on top of it. `overflow-hidden` clips the
 * strip's square corners to the card's rounded ones.
 *
 * The genie warp in `DeskScene` animates a snapshot of this exact element, so
 * the animated card is literally the same markup as the one that lands.
 */
export default function ScreenCard({
  title,
  children,
  className = "",
  style,
  ref,
}: {
  title: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  ref?: Ref<HTMLDivElement>;
}) {
  return (
    <div
      ref={ref}
      data-screen-card
      className={`flex min-h-0 flex-col overflow-hidden rounded-[16px] border-[3px] border-white bg-paper ${className}`}
      style={style}
    >
      {/* one line, always — a name that wrapped made its strip taller than
          its neighbours' and knocked the card bodies out of line across the
          row, so a long one is cut with an ellipsis instead (full name in
          the tooltip) */}
      <div className="flex shrink-0 items-center justify-center bg-white px-4 py-5">
        <span
          title={title}
          className="min-w-0 truncate text-center font-title text-[clamp(1.25rem,2.6vw,2.25rem)] uppercase leading-tight tracking-wide"
          style={{ color: "var(--paper, #000)" }}
        >
          {title}
        </span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
