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
 * picture, its title and its dates. A click opens the role's own page
 * (`/experience/{slug}`, `RolePage`) with the whole story.
 *
 * Hovering a card switches its lamp on. A little pendant lamp hangs over
 * each picture, dark at rest, with the picture grey and dim under it. Lit,
 * the bulb glows amber, a cone of warm light falls from the shade down over
 * the picture, the picture comes up into colour, and the dates spin like the
 * desk screens' slot reels before landing in amber. All of it is CSS keyed
 * off one `--lit` switch (`.xp-*` in globals.css); only the reel is script.
 *
 * Either side of the column, the panorama (`panorama.tsx`) fills the black.
 */

const LIST_MAX_WIDTH = "56rem";

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

/** the lamp over a picture: a cord, a shade, and the bulb just showing
 *  under the shade's mouth — drawn in the desk's white line art */
function Lamp() {
  return (
    <svg viewBox="0 0 48 40" aria-hidden className="xp-lamp">
      <path d="M24 0 V11" className="xp-lamp-cord" />
      <circle cx="24" cy="24.5" r="5.5" className="xp-lamp-halo" />
      <circle cx="24" cy="24.5" r="3.2" className="xp-lamp-bulb" />
      <circle cx="24" cy="24.5" r="3.2" className="xp-lamp-bulb-lit" />
      <path d="M13 23 L18.5 11 H29.5 L35 23 Z" className="xp-lamp-shade" />
      <path d="M13 23 H35" className="xp-lamp-rim" />
    </svg>
  );
}

/** a role's picture under its lamp, with the light cone between them —
 *  lit whenever an ancestor is (`.xp-card` hovered, or `.xp-lit`) */
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
        <span aria-hidden className="xp-cone" />
      </span>
      <Lamp />
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
        className="xp-card grid grid-cols-1 items-center gap-x-8 gap-y-5 px-5 pb-5 pt-9 @xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] @xl:pt-8"
      >
        <RoleShot role={role} sizes="(min-width: 640px) 22rem, 100vw" eager={index === 0} />
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
    <div className="@container">
      <ul className="flex flex-col gap-10 px-[3%] pb-4">
        {EXPERIENCE.map((role, i) => (
          <RoleCard key={role.slug} role={role} index={i} />
        ))}
      </ul>
    </div>
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
