"use client";

import type { ReactNode } from "react";
import { SECTIONS, type SectionId } from "@/lib/site";
import PcbTitle, { PROJECTS_BOARD } from "../PcbTitle";
import ScreenCard from "../ScreenCard";
import { experienceCards } from "./experience";
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

/** Skills and Experience set their header in the display face (Chakra Petch);
 *  the others use the site monospace. Card titles are the display face throughout. */
const DISPLAY_FACE_HEADERS: ReadonlySet<SectionId> = new Set(["skills", "experience"]);

/** the section header's font classes (the big title above the cards) */
export function headerFontClass(id: SectionId) {
  return DISPLAY_FACE_HEADERS.has(id) ? "font-title tracking-wide" : "font-mono font-semibold";
}

/** the section header's title. Projects is drawn as circuit-board traces;
 *  the rest are plain text in the header's font (`headerFontClass`). Sized
 *  in `em`, so it follows the header's own font size. */
export function SectionTitle({ id }: { id: SectionId }) {
  const label = SECTIONS[id].screenLabel;
  if (id === "projects") {
    return <PcbTitle glyphs={PROJECTS_BOARD} label={label} className="mx-auto block" style={{ height: "1.15em", width: "auto" }} />;
  }
  return <>{label}</>;
}

/** What a section lays out under everything else, filling (nearly) the whole
 *  view behind its header and cards — Skills' cutting mat. Both the desktop
 *  overlay (`DeskScene`) and the stacked page (`FocusFrame`) draw it; a
 *  section with one isn't closed by clicking the ground, since the ground is
 *  now the mat. */
const BACKDROPS: Partial<Record<SectionId, () => ReactNode>> = {
  skills: () => <SkillsMat />,
};

export function hasBackdrop(id: SectionId) {
  return id in BACKDROPS;
}

export function SectionBackdrop({ id }: { id: SectionId }) {
  return BACKDROPS[id]?.() ?? null;
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
