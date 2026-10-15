"use client";

import type { ReactNode } from "react";
import { SECTIONS, type SectionId } from "@/lib/site";
import ScreenCard from "../ScreenCard";
import { ExperienceTitle, experienceCards } from "./experience";
import { Panorama } from "./panorama";
import { personalCards } from "./personal";
import { projectsCards } from "./projects";
import type { CardOptions, SectionCard } from "./shared";
import { SkillsMat, skillsCards } from "./skills";

export type { CardLayout, CardOptions, SectionCard } from "./shared";

/**
 * Every section is the same thing — a row of `ScreenCard`s under the
 * section's title — and only the cards' bodies differ. This is the one place
 * that says which cards each section has; the desktop overlay (`DeskScene`)
 * and the mobile / deep-link page (`SectionCardStack`) both read it.
 */
const BUILDERS: Record<SectionId, (opts: CardOptions) => SectionCard[]> = {
  projects: projectsCards,
  skills: skillsCards,
  experience: experienceCards,
  about: personalCards,
};

/** the section header's title (the big one above the cards) — every section
 *  alike, in the desk screens' face (`.section-title`) and the amber
 *  lettering of Skills' mat. Sized in `em`, so it follows the header's own
 *  font size. Experience's casts a shadow off the cursor (`ExperienceTitle`). */
export function SectionTitle({ id }: { id: SectionId }) {
  if (id === "experience") return <ExperienceTitle />;
  return <span className="skills-heading section-title">{SECTIONS[id].screenLabel}</span>;
}

/** What a section lays out under everything else, behind its header and
 *  cards — Skills' cutting mat, Experience's dotted Vancouver. Both the
 *  desktop overlay (`DeskScene`) and the stacked page (`FocusFrame`) draw it.
 *
 *  `coversGround`: the backdrop fills the view (the mat), so clicking around
 *  the cards lands on it rather than on empty ground — and doesn't close the
 *  section. One that only decorates the edges (the panorama) leaves the
 *  ground closing it as usual. */
const BACKDROPS: Partial<Record<SectionId, { draw: () => ReactNode; coversGround: boolean }>> = {
  skills: { draw: () => <SkillsMat />, coversGround: true },
  experience: { draw: () => <Panorama />, coversGround: false },
};

export function hasBackdrop(id: SectionId) {
  return id in BACKDROPS;
}

export function backdropCoversGround(id: SectionId) {
  return BACKDROPS[id]?.coversGround ?? false;
}

export function SectionBackdrop({ id }: { id: SectionId }) {
  return BACKDROPS[id]?.draw() ?? null;
}

export function sectionCards(id: SectionId, opts: CardOptions): SectionCard[] {
  return BUILDERS[id](opts);
}

/** a section's cards one under another — the mobile / deep-link layout */
export function SectionCardStack({ id }: { id: SectionId }) {
  return (
    <div className="flex flex-col gap-5">
      {sectionCards(id, { layout: "stack", active: true }).map((card) => (
        <ScreenCard key={card.key} title={card.title} bare={card.bare}>
          {card.body}
        </ScreenCard>
      ))}
    </div>
  );
}
