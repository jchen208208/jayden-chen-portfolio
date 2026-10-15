"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { EXPERIENCE, SECTIONS, type Role } from "@/lib/site";
import { markFromList } from "@/lib/experienceNav";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
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

/** px between the EXPERIENCE heading's box and the list, in the desk view —
 *  closer than other sections' rows. The first picture ends up ~80px under
 *  the letters (the heading's box runs ~20px below them, and each card has
 *  10px of padding on top). */
const GAP_UNDER_HEADER = 50;

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

/** the title's shadow eases this far toward where the cursor says it should
 *  be each 60fps frame — a soft follow, not a snap */
const SHADOW_EASE = 0.12;

/**
 * The EXPERIENCE heading, casting a shadow as if the cursor were its light
 * (lars-olson.com's pineapple and thumb): a flat copy of the letters sits
 * behind them and falls away from the pointer, further the further off the
 * pointer is, up to its reach at half the viewport's long side. It eases
 * after the pointer, and settles back to rest — the light up and to the left
 * — when the pointer leaves the window. Touch and reduced motion keep it at
 * rest.
 *
 * The shadow's direction is `--cast-x` / `--cast-y` (-1…1) on the title; how
 * far that throws it, and its colour, are `.cast-title` in globals.css.
 */
export function ExperienceTitle() {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduced) {
      el.style.removeProperty("--cast-x");
      el.style.removeProperty("--cast-y");
      return;
    }

    // the CSS's resting direction, so the first move eases off from it
    const rest = getComputedStyle(el);
    const REST_X = parseFloat(rest.getPropertyValue("--cast-rest-x")) || 0;
    const REST_Y = parseFloat(rest.getPropertyValue("--cast-rest-y")) || 0;
    let x = REST_X;
    let y = REST_Y;
    let toX = REST_X;
    let toY = REST_Y;
    let raf = 0;
    let last = 0;

    const tick = (now: number) => {
      const dt = last ? Math.min(now - last, 100) : 1000 / 60;
      last = now;
      const k = 1 - Math.pow(1 - SHADOW_EASE, dt / (1000 / 60));
      x += (toX - x) * k;
      y += (toY - y) * k;
      el.style.setProperty("--cast-x", x.toFixed(3));
      el.style.setProperty("--cast-y", y.toFixed(3));
      if (Math.abs(toX - x) + Math.abs(toY - y) > 0.002) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = 0;
        last = 0;
      }
    };
    const aim = (ax: number, ay: number) => {
      toX = ax;
      toY = ay;
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const box = el.getBoundingClientRect();
      const reach = Math.max(window.innerWidth, window.innerHeight) / 2;
      // from the light (the pointer) through the title, and on past it
      let ax = (box.left + box.width / 2 - e.clientX) / reach;
      let ay = (box.top + box.height / 2 - e.clientY) / reach;
      const len = Math.hypot(ax, ay);
      if (len > 1) {
        ax /= len;
        ay /= len;
      }
      aim(ax, ay);
    };
    // out of the window altogether (`relatedTarget` is null only then)
    const onOut = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && !e.relatedTarget) aim(REST_X, REST_Y);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerout", onOut);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerout", onOut);
      cancelAnimationFrame(raf);
    };
  }, [reduced]);

  const label = SECTIONS.experience.screenLabel;
  return (
    <span ref={ref} className="skills-heading section-title cast-title">
      <span aria-hidden className="cast-shadow">
        {label}
      </span>
      <span className="cast-text">{label}</span>
    </span>
  );
}

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
    <ul className="flex w-full max-w-[38rem] flex-col gap-2 px-[3%] pb-4">
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
      gapAbove: GAP_UNDER_HEADER,
    },
  ];
}
