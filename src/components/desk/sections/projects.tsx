"use client";

import dynamic from "next/dynamic";
import { PROJECTS, type Project } from "@/lib/site";
import { Bullets, CardBody, CardLink, Meta, type CardOptions, type SectionCard } from "./shared";

/** the same viewer as the Projects monitor on the desk — client-only, and
 *  fetched on demand (three.js is the heaviest thing on the site) */
const PcbViewer = dynamic(() => import("../pcb/PcbViewer"), { ssr: false });

function ProjectBody({ project: p, layout, active }: { project: Project } & CardOptions) {
  return (
    <CardBody>
      {p.hasBoardViewer && (
        <PcbViewer
          boards={["esp32"]}
          running={active}
          className={
            layout === "row"
              ? "relative min-h-[140px] flex-1"
              : "relative aspect-[4/3] w-full shrink-0"
          }
        />
      )}
      <Meta>
        {p.period} · {p.tags.join(" · ")}
      </Meta>
      <p className="shrink-0 leading-relaxed text-white/85">{p.blurb}</p>
      <Bullets items={p.highlights} />
      {(p.repo || p.demo) && (
        <div className="flex shrink-0 gap-4 text-xs uppercase tracking-wide">
          {p.repo && <CardLink href={p.repo}>Source</CardLink>}
          {p.demo && <CardLink href={p.demo}>Demo</CardLink>}
        </div>
      )}
    </CardBody>
  );
}

export function projectsCards(opts: CardOptions): SectionCard[] {
  return PROJECTS.map((p) => ({
    key: p.slug,
    title: p.name,
    body: <ProjectBody project={p} {...opts} />,
  }));
}
