"use client";

import Image from "next/image";
import { useId, useState } from "react";
import type { CSSProperties } from "react";
import { EXPERIENCE, type Role } from "@/lib/site";
import { Bullets, CardLink, ShotPlaceholder, type CardOptions, type SectionCard } from "./shared";

/**
 * Experience is a zigzag of pictures, one per role — left, right, left —
 * each captioned with the title and dates. Hovering a picture switches its
 * light on (it comes up from grey into colour), an amber hinge lights along
 * its open edge, and a box slides out from behind it into the empty side
 * with the short version: where, the one line, the tools. Clicking pins the
 * box out and it grows down to the résumé bullets. `.xp-*` in globals.css
 * has the choreography.
 *
 * On the stacked page (phones, deep links) there's no hover to rely on, so
 * every entry is simply picture, caption, box, one under another, with the
 * bullets behind "Details".
 *
 * Like Projects it sits in the page rather than a window of its own, and it
 * brings itself in: each entry glides in from its own side, one after
 * another, once the overlay has settled.
 */

const LIST_MAX_WIDTH = "72rem";

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 12 8"
      aria-hidden
      className={`xp-chevron h-2 w-3 fill-none stroke-current ${open ? "rotate-180" : ""}`}
      strokeWidth={1.6}
    >
      <path d="M1 1.5 L6 6.5 L11 1.5" />
    </svg>
  );
}

function Entry({
  role,
  index,
  stacked,
  open,
  onToggle,
}: {
  role: Role;
  index: number;
  stacked: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  const panelId = useId();
  const side = stacked || index % 2 === 0 ? "left" : "right";
  const name = role.project ? `${role.role} (${role.project})` : role.role;
  // `--k` is each line's place in the box, for the stagger as it slides out
  const line = (k: number) => ({ "--k": k }) as CSSProperties;

  return (
    <li
      className="xp-entry"
      data-side={side}
      data-layout={stacked ? "stack" : "row"}
      data-open={open}
      style={{ "--i": index } as CSSProperties}
    >
      <div className="xp-grid">
        <div className="xp-figure">
          <button
            type="button"
            aria-expanded={open}
            aria-controls={panelId}
            aria-label={name}
            onClick={onToggle}
            className="xp-pic"
          >
            <span className="xp-frame">
              <span className="xp-shot">
                {role.image ? (
                  <Image
                    src={role.image}
                    alt=""
                    fill
                    // the first picture is in view as soon as the page opens
                    loading={index === 0 ? "eager" : undefined}
                    sizes="(min-width: 640px) 32rem, 100vw"
                    className="object-cover"
                  />
                ) : (
                  <ShotPlaceholder slug={role.slug} />
                )}
              </span>
            </span>
            <span aria-hidden className="xp-hinge" />
          </button>
          <div className="xp-caption mt-4">
            <h3 className="font-title text-xl uppercase leading-tight tracking-wide">
              {role.role}
            </h3>
            <p className="mt-1.5 font-mono text-xs uppercase tracking-wide text-white/55">
              {role.project && <>{role.project} · </>}
              {role.start} – {role.end}
            </p>
          </div>
        </div>

        <div className="xp-slot">
          <div id={panelId} className="xp-panel font-mono text-white">
            {role.place && (
              <p className="xp-line text-sm text-white/90" style={line(0)}>
                {role.place}
              </p>
            )}
            <p className="xp-line mt-3 text-[0.95rem] leading-relaxed text-white/80" style={line(1)}>
              {role.blurb}
            </p>
            {role.stack && (
              <p className="xp-line mt-4 text-[0.7rem] uppercase tracking-wide text-white/45" style={line(2)}>
                {role.stack.join(" · ")}
              </p>
            )}
            {/* `grid-template-rows` 0fr → 1fr opens to the bullets' real
                height without measuring them; `inert` keeps them out of the
                tab order and the accessibility tree while closed */}
            <div className="exp-reveal" data-open={open} inert={!open}>
              <div className="min-h-0 overflow-hidden">
                <div className="pt-5">
                  <Bullets items={role.bullets} />
                </div>
              </div>
            </div>
            <div
              className="xp-line mt-5 flex items-center justify-between gap-4 text-xs uppercase tracking-wide"
              style={line(3)}
            >
              {role.link ? (
                <CardLink href={role.link}>Visit site ↗</CardLink>
              ) : (
                <span />
              )}
              <button
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={onToggle}
                className="flex items-center gap-2 text-white/60 transition-colors hover:text-white"
              >
                {open ? "Less" : "Details"}
                <Chevron open={open} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}

function ExperienceList({ layout, active }: CardOptions) {
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());
  // Every time the section opens it starts with nothing pinned. Adjusted
  // during render (React's own pattern for resetting state on a prop change)
  // rather than in an effect, so the reset lands before the open animation.
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

  return (
    <ul className="flex flex-col gap-16 px-[3%] pb-4">
      {EXPERIENCE.map((role, i) => (
        <Entry
          key={role.slug}
          role={role}
          index={i}
          stacked={layout === "stack"}
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
