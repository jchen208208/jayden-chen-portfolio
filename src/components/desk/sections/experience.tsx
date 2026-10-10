"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { EXPERIENCE, type Role } from "@/lib/site";
import { markFromList } from "@/lib/experienceNav";
import { useSlotReel, type ReelTiming } from "@/hooks/useSlotReel";
import { ShotPlaceholder, type SectionCard } from "./shared";

/**
 * Experience is one column down the middle: a card per role, each just its
 * picture with its title and dates under it. A click opens the role's own page
 * (`/experience/{slug}`, `RolePage`) with the whole story.
 *
 * At rest each picture is grey and dim. Hovering a card brings it up into
 * colour, and it hops and swings on an elastic overshoot like a Projects
 * window; the title slides a little right and the dates spin like the desk screens' slot reels before landing in
 * amber. All of it is CSS (`.xp-*` in globals.css); only the reel is script.
 *
 * Either side of the column, the panorama (`panorama.tsx`) fills the black.
 */

/** a picture about as wide as the EXPERIENCE heading over it (~33rem, once
 *  the list's and the card's padding are taken off) */
const LIST_MAX_WIDTH = "38rem";

/** the dates' spin on hover — quicker than the desk screens' load-in.
 *  Module-level: `useSlotReel` restarts if this changes identity. */
const CARD_REEL: ReelTiming = {
  firstLandMs: 110,
  landWindowMs: 320,
  jitterMs: 15,
  fastMs: 40,
  slowMs: 130,
  decelMs: 200,
};

/** "FinDVer · June 2026 – Present" */
export function roleWhen(role: Role) {
  const dates = `${role.start} – ${role.end}`;
  return role.project ? `${role.project} · ${dates}` : dates;
}

/** a role's picture in its frame — in colour whenever an ancestor is lit
 *  (`.xp-card` hovered, or `.xp-lit`) */
export function RoleShot({
  role,
  sizes,
  eager = false,
}: {
  role: Role;
  sizes: string;
  eager?: boolean;
}) {
  return (
    <span className="xp-shot">
      <span className="xp-frame">
        <span className="xp-photo">
          {role.image ? (
            <Image
              src={role.image}
              alt=""
              fill
              loading={eager ? "eager" : undefined}
              sizes={sizes}
              className="object-cover"
            />
          ) : (
            <ShotPlaceholder slug={role.slug} />
          )}
        </span>
      </span>
    </span>
  );
}

function RoleCard({ role, index }: { role: Role; index: number }) {
  // bumped on each hover (or keyboard focus) — every bump spins the dates
  const [spins, setSpins] = useState(0);
  const when = useSlotReel(roleWhen(role), { play: spins, timing: CARD_REEL });

  return (
    <li className="xp-item" style={{ "--i": index } as CSSProperties}>
      <Link
        href={`/experience/${role.slug}`}
        onClick={markFromList}
        onPointerEnter={(e) => {
          if (e.pointerType === "mouse") setSpins((n) => n + 1);
        }}
        onFocus={(e) => {
          if (e.currentTarget.matches(":focus-visible")) setSpins((n) => n + 1);
        }}
        className="xp-card flex flex-col gap-2.5 px-5 py-2.5"
      >
        <RoleShot role={role} sizes="(min-width: 640px) 34rem, 100vw" eager={index === 0} />
        <span className="flex min-w-0 flex-col gap-2.5">
          <span className="xp-title font-title text-2xl uppercase leading-tight tracking-wide">
            {role.role}
          </span>
          {/* the reel's text is decoration while it spins — the real dates
              are what's read out */}
          <span className="xp-when font-screen text-xl uppercase leading-none">
            <span aria-hidden>{when}</span>
            <span className="sr-only">{roleWhen(role)}</span>
          </span>
          <span aria-hidden className="xp-go font-mono text-xs uppercase tracking-wide">
            View →
          </span>
        </span>
      </Link>
    </li>
  );
}

function ExperienceList() {
  return (
    // capped here too, so the stacked page's wider column keeps the same size
    <ul className="flex w-full max-w-[38rem] flex-col px-[3%] pb-4">
      {EXPERIENCE.map((role, i) => (
        <RoleCard key={role.slug} role={role} index={i} />
      ))}
    </ul>
  );
}

export function experienceCards(): SectionCard[] {
  return [
    {
      key: "experience",
      title: "",
      body: <ExperienceList />,
      maxWidth: LIST_MAX_WIDTH,
      bare: true,
      fitContent: true,
      ownEntrance: true,
    },
  ];
}
