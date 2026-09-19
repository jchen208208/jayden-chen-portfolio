"use client";

import type { SectionId } from "@/lib/site";
import ScreenCard from "../ScreenCard";
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

export function sectionCards(id: SectionId, opts: CardOptions): SectionCard[] {
  return BUILDERS[id](opts);
}

/** a section's cards one under another — the mobile / deep-link layout */
export function SectionCardStack({ id }: { id: SectionId }) {
  return (
    <div className="flex flex-col gap-5">
      {sectionCards(id, { layout: "stack", active: true }).map((card) => (
        <ScreenCard key={card.key} title={card.title}>
          {card.body}
        </ScreenCard>
      ))}
    </div>
  );
}
