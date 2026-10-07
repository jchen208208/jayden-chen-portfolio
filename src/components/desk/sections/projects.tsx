"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { PROJECTS, type Project } from "@/lib/site";
import { Bullets, CardLink, Meta, type SectionCard } from "./shared";

/**
 * Projects is a grid of little program windows, one per project: a picture
 * of the project inside an amber frame, a file icon dropped over its bottom
 * corner, and the name and résumé lines underneath. Hovering one switches
 * its light on — the window hops and swings, the title slides — after Lars
 * Olson's portfolio (`.proj-*` in globals.css has the timings). Like
 * Experience it sits in the page rather than a window of its own, and its
 * cards drop in one after another (`.exp-row`).
 */

const LIST_MAX_WIDTH = "72rem";

/** stands in for a project's picture until it has one — the file it's
 *  waiting for, on the desk screens' umber glass */
function ShotPlaceholder({ slug }: { slug: string }) {
  return (
    <div className="proj-placeholder flex h-full w-full flex-col items-center justify-center gap-[4%]">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
        aria-hidden
        className="w-[18%]"
      >
        <rect x="3" y="4" width="18" height="16" rx="1" />
        <circle cx="9" cy="9.5" r="1.75" />
        <path d="M3 17l5-5 4 4 3-3 5 5" />
      </svg>
      <span className="font-screen text-lg leading-none">{slug}.png</span>
    </div>
  );
}

function ProjectCard({ project: p, index }: { project: Project; index: number }) {
  return (
    <li className="exp-row proj-card" style={{ "--i": index } as CSSProperties}>
      <div className="relative">
        <div className="proj-window">
          {/* the title bar's three buttons */}
          <svg
            viewBox="0 0 76 32"
            fill="none"
            stroke="currentColor"
            strokeWidth={4}
            aria-hidden
            className="absolute top-0 left-0 w-[21.1%] text-black"
          >
            <rect x="8" y="8" width="14" height="14" />
            <rect x="32" y="8" width="14" height="14" />
            <rect x="56" y="8" width="14" height="14" />
          </svg>
          <div className="proj-screen">
            <div className="proj-shot">
              {p.image ? (
                <Image
                  src={p.image}
                  alt={p.name}
                  fill
                  sizes="(min-width: 640px) 24rem, 100vw"
                  className="object-cover"
                />
              ) : (
                <ShotPlaceholder slug={p.slug} />
              )}
              <div className="proj-shade" />
            </div>
          </div>
        </div>
        <span aria-hidden className="proj-file" />
      </div>
      <h3 className="proj-title mt-3 font-title text-xl uppercase leading-tight tracking-wide text-white">
        {p.name}
      </h3>
      <div className="mt-2 flex flex-col gap-3 font-mono text-white">
        <Meta>{p.period}</Meta>
        <Meta>{p.tags.join(" · ")}</Meta>
        <Bullets items={p.highlights} />
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

/** columns follow the space the grid is given, not the viewport — the desk
 *  overlay is much wider than the stacked page */
function ProjectGrid() {
  return (
    <div className="@container">
      <ul className="grid grid-cols-1 gap-x-12 gap-y-16 px-[3%] @xl:grid-cols-2 @5xl:grid-cols-3">
        {PROJECTS.map((p, i) => (
          <ProjectCard key={p.slug} project={p} index={i} />
        ))}
      </ul>
    </div>
  );
}

export function projectsCards(): SectionCard[] {
  return [
    {
      key: "projects",
      title: "",
      body: <ProjectGrid />,
      maxWidth: LIST_MAX_WIDTH,
      bare: true,
      fitContent: true,
      ownEntrance: true,
    },
  ];
}
