"use client";

import { SECTIONS, type SectionId } from "@/lib/site";
import PcbTitle, { PROJECTS_BOARD } from "../PcbTitle";
import ScreenCard from "../ScreenCard";
import { SKILLS_TITLE, TypedTitle } from "../TypedText";
import { experienceCards } from "./experience";
import { personalCards } from "./personal";
import { projectsCards } from "./projects";
import type { CardOptions, SectionCard } from "./shared";
import { skillsCards } from "./skills";

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

/** the section header's title. Projects is drawn as circuit-board traces,
 *  Skills is a line of C typed in (`typedef struct skills {};`);
 *  the rest are plain text in the header's font (`headerFontClass`). Sized
 *  in `em`, so it follows the header's own font size. */
export function SectionTitle({ id }: { id: SectionId }) {
  const label = SECTIONS[id].screenLabel;
  if (id === "projects") {
    return <PcbTitle glyphs={PROJECTS_BOARD} label={label} className="mx-auto block" style={{ height: "1.15em", width: "auto" }} />;
  }
  if (id === "skills") {
    // the line is ~11.6em long — on a phone it shrinks to fit beside the
    // close button rather than run off the edge
    return <TypedTitle segments={SKILLS_TITLE} label={label} style={{ fontSize: "min(1em, calc((100vw - 7rem) / 11.6))" }} />;
  }
  return <>{label}</>;
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
