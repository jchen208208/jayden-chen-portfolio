"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import crest from "@/assets/waterloo-crest.png";
import { PROFILE, ROLL } from "@/lib/site";
import { ContactSheet } from "./contactSheet";
import type { CardOptions, SectionCard } from "./shared";
import { TrophyShelf } from "./trophyShelf";

/**
 * About is a page in three parts, top to bottom: a few lines of intro, a
 * contact sheet of the roll of film his life is on (`contactSheet.tsx` —
 * negatives that develop on hover and lift out as prints that come alive),
 * and a trophy shelf for the awards (`trophyShelf.tsx`). Each part drifts in
 * one after another once the section's header has settled
 * (`data-cards-revealed`); on the stacked page they're simply there.
 */

const MAX_WIDTH = "72rem";

function About({ layout, active }: CardOptions) {
  // three frames to a strip across the desk view, two on the stacked page
  const perStrip = layout === "row" ? 3 : 2;
  const strips = Math.ceil(ROLL.length / perStrip);
  return (
    <div className="flex flex-col gap-14 px-[3%] pb-6">
      {/* TODO — user: the intro, in your own words */}
      <div
        className="about-in mx-auto max-w-[46rem] space-y-4 font-mono text-lg leading-relaxed text-white/85 md:text-xl"
        style={{ "--i": 0 } as CSSProperties}
      >
        <p>
          I&apos;m Jayden, a {PROFILE.program} student at{" "}
          <a href={PROFILE.schoolUrl} target="_blank" rel="noreferrer" className="school-mark whitespace-nowrap">
            {PROFILE.school}
            <Image src={crest} alt="" className="school-crest ml-1.5" />
          </a>{" "}
          who likes building things on the line between software and hardware: a web app, a PCB, and
          the firmware in between.
        </p>
        <p>
          Away from the desk I&apos;m on a tennis court, training MMA, or in the kitchen. The roll
          below has the evidence.
        </p>
      </div>
      <ContactSheet perStrip={perStrip} active={active} firstIndex={2} />
      <TrophyShelf perShelf={layout === "row" ? 5 : 3} firstIndex={2 + strips} />
    </div>
  );
}

export function aboutCards(opts: CardOptions): SectionCard[] {
  return [
    {
      key: "about",
      title: "",
      body: <About {...opts} />,
      maxWidth: MAX_WIDTH,
      bare: true,
      fitContent: true,
      ownEntrance: true,
    },
  ];
}
