"use client";

import dynamic from "next/dynamic";
import type { CSSProperties } from "react";
import { PROJECTS, type Project } from "@/lib/site";
import { Bullets, CardLink, Meta, type CardOptions, type SectionCard } from "./shared";

/** the same viewer as the Projects monitor on the desk — client-only, and
 *  fetched on demand (three.js is the heaviest thing on the site) */
const PcbViewer = dynamic(() => import("../pcb/PcbViewer"), { ssr: false });

/**
 * Projects is a stack of boxes, one per project: a white strip with the name
 * and dates over a black body with the tools and the résumé bullets. Like
 * Experience it sits in the page rather than a window of its own, and its
 * boxes drop in one after another (`.exp-row` in globals.css).
 */

const LIST_MAX_WIDTH = "84rem";

function ProjectBox({
  project: p,
  index,
  active,
}: {
  project: Project;
  index: number;
  active: boolean;
}) {
  return (
    <li
      className="exp-row overflow-hidden rounded-[16px] border-[3px] border-white bg-paper"
      style={{ "--i": index } as CSSProperties}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 bg-white px-8 py-4 text-black">
        <h3 className="font-title text-3xl uppercase tracking-wide">{p.name}</h3>
        <span className="font-mono text-sm uppercase tracking-wide text-black/55">{p.period}</span>
      </div>
      <div className="flex flex-col gap-4 px-8 py-6 font-mono text-base text-white">
        {p.hasBoardViewer && (
          <PcbViewer
            boards={["sparc"]}
            running={active}
            className="relative aspect-[16/7] w-full"
          />
        )}
        <Meta>{p.tags.join(" · ")}</Meta>
        <Bullets items={p.highlights} large />
        {(p.repo || p.demo) && (
          <div className="flex gap-4 text-xs uppercase tracking-wide">
            {p.repo && <CardLink href={p.repo}>Source</CardLink>}
            {p.demo && <CardLink href={p.demo}>Demo</CardLink>}
          </div>
        )}
      </div>
    </li>
  );
}

function ProjectList({ active }: CardOptions) {
  return (
    <ul className="flex flex-col gap-5">
      {PROJECTS.map((p, i) => (
        <ProjectBox key={p.slug} project={p} index={i} active={active} />
      ))}
    </ul>
  );
}

export function projectsCards(opts: CardOptions): SectionCard[] {
  return [
    {
      key: "projects",
      title: "",
      body: <ProjectList {...opts} />,
      maxWidth: LIST_MAX_WIDTH,
      bare: true,
      fitContent: true,
      ownEntrance: true,
    },
  ];
}
