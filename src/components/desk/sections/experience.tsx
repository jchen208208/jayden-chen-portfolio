"use client";

import { useId, useState } from "react";
import type { CSSProperties } from "react";
import { EXPERIENCE, type Role } from "@/lib/site";
import type { CardOptions, SectionCard } from "./shared";

/**
 * Experience is a stack of entries, one per role, set edge to edge. Each
 * entry is a white label (the title exactly as the résumé has it, the dates,
 * a triangle) over a black box with a white border holding one line about the
 * work. Opening an entry extends that black box downward with where, the
 * tools and the résumé bullets. Entries open independently.
 *
 * It sits in the page, not in a window of its own: the card is as tall as the
 * list, and the open view scrolls as a whole when entries run long.
 *
 * Opening the section doesn't use the genie warp the other three do: the
 * entries hinge down one after another, like a ladder unrolling (`ownEntrance`
 * on the card, `.exp-row` in globals.css).
 */

/** wide enough for a description on one line, narrow enough to read */
const LIST_MAX_WIDTH = "84rem";

function Triangle({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 12 8"
      aria-hidden
      className={`exp-caret h-2.5 w-4 shrink-0 fill-black/70 ${open ? "rotate-180" : ""}`}
    >
      <path d="M0 0 L12 0 L6 8 Z" />
    </svg>
  );
}

function Row({
  role,
  index,
  open,
  onToggle,
}: {
  role: Role;
  index: number;
  open: boolean;
  onToggle: () => void;
}) {
  const bodyId = useId();
  return (
    // `--i` is this entry's place in the chain; the CSS turns it into the
    // delay before this rung swings down (see `.exp-row` in globals.css)
    <li className="exp-row group flex flex-col" style={{ "--i": index } as CSSProperties}>
      {/* the label is the one real control; the description line below is
          also clickable, as a convenience for the mouse */}
      <button
        type="button"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={onToggle}
        className="flex w-full items-center gap-6 bg-white px-8 py-4 text-left text-black outline-none transition-colors hover:bg-white/90 focus-visible:bg-white/85"
      >
        <span className="flex min-w-0 flex-1 flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <span className="font-title text-3xl uppercase tracking-wide">{role.role}</span>
          <span className="font-mono text-sm uppercase tracking-wide text-black/55">
            {role.start} – {role.end}
          </span>
        </span>
        <Triangle open={open} />
      </button>
      {/* the last box rounds its own bottom corners to match the list's
          clip — otherwise the clip cuts its white border off at the curve */}
      <div className="border-x-[3px] border-b-[3px] border-white bg-paper font-mono text-base group-last:rounded-b-[16px]">
        <p
          onClick={onToggle}
          className="cursor-pointer px-8 py-4 leading-snug text-white/80"
        >
          {role.blurb}
        </p>
        {/* `grid-template-rows` 0fr → 1fr animates to the content's real
            height without measuring it; `inert` keeps a closed entry out of
            the tab order and the accessibility tree */}
        <div id={bodyId} className="exp-reveal" data-open={open} inert={!open}>
          <div className="min-h-0 overflow-hidden">
            <div className="space-y-4 px-8 pb-6 leading-relaxed">
              {role.place && <p className="text-white/90">{role.place}</p>}
              {role.stack && (
                <p className="text-sm uppercase tracking-wide text-white/50">
                  {role.stack.join(" · ")}
                </p>
              )}
              <ul className="space-y-2.5 text-white/80">
                {role.bullets.map((b) => (
                  <li key={b} className="flex gap-3">
                    <span aria-hidden className="text-white/35">
                      —
                    </span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}

function ExperienceList({ active }: CardOptions) {
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());
  // Every time the section opens it starts fully collapsed. Adjusted during
  // render (React's own pattern for resetting state on a prop change) rather
  // than in an effect, so the reset lands before the open animation
  // snapshots the card.
  const [wasActive, setWasActive] = useState(active);
  if (active !== wasActive) {
    setWasActive(active);
    if (active) setOpen(new Set());
  }

  const toggle = (slug: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });

  // entries meet edge to edge; the rounded clip softens the stack's outer
  // corners. The same list in the overlay and on the stacked page — either
  // way the page around it does the scrolling.
  return (
    <ul className="flex flex-col overflow-hidden rounded-[16px]">
      {EXPERIENCE.map((role, i) => (
        <Row
          key={role.slug}
          role={role}
          index={i}
          open={open.has(role.slug)}
          onToggle={() => toggle(role.slug)}
        />
      ))}
    </ul>
  );
}

export function experienceCards(opts: CardOptions): SectionCard[] {
  return [
    {
      key: "experience",
      title: "",
      body: <ExperienceList {...opts} />,
      maxWidth: LIST_MAX_WIDTH,
      bare: true,
      fitContent: true,
      ownEntrance: true,
    },
  ];
}
