"use client";

import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { PROJECTS, type Project } from "@/lib/site";
import { markFromList } from "@/lib/experienceNav";
import { Bullets, CardLink, Meta, ShotPlaceholder, type SectionCard } from "./shared";

/**
 * Projects is a grid of little program windows, one per project: a picture
 * of the project inside an amber frame, a file icon dropped over its bottom
 * corner, and the name and résumé lines underneath. Hovering one switches
 * its light on — the window hops and swings, the title slides — after Lars
 * Olson's portfolio (`.proj-*` in globals.css has the timings). Like
 * Experience it sits in the page rather than a window of its own, and its
 * cards drop in one after another (`.exp-row`).
 *
 * A project with a build gallery has its own page (`/projects/{slug}`,
 * `ProjectPage`), and its whole card opens it.
 */

const LIST_MAX_WIDTH = "72rem";

/** the project's picture in its amber program window — lit (`.proj-lit`, or
 *  a hovered `.proj-card`) it drops its shade and the frame turns gradient */
export function ProjectWindow({
  project: p,
  sizes,
  eager = false,
  file = true,
}: {
  project: Project;
  sizes: string;
  eager?: boolean;
  /** the dog-eared page hung off its bottom corner */
  file?: boolean;
}) {
  return (
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
                loading={eager ? "eager" : undefined}
                sizes={sizes}
                className="object-cover"
              />
            ) : (
              <ShotPlaceholder slug={p.slug} />
            )}
            <div className="proj-shade" />
          </div>
        </div>
      </div>
      {file && <span aria-hidden className="proj-file" />}
    </div>
  );
}

function ProjectCard({ project: p, index }: { project: Project; index: number }) {
  const opens = Boolean(p.gallery?.length);
  const face = (
    <>
      <ProjectWindow project={p} sizes="(min-width: 640px) 24rem, 100vw" />
      <h3 className="proj-title mt-3 font-title text-xl uppercase leading-tight tracking-wide text-white">
        {p.name}
      </h3>
      <div className="mt-2 flex flex-col gap-3 font-mono text-white">
        <Meta>{p.period}</Meta>
        <Meta>{p.tags.join(" · ")}</Meta>
        <Bullets items={p.highlights} />
        {opens && (
          <span aria-hidden className="proj-go text-xs uppercase tracking-wide">
            View →
          </span>
        )}
      </div>
    </>
  );

  return (
    <li className="exp-row proj-card" style={{ "--i": index } as CSSProperties}>
      {opens ? (
        <Link href={`/projects/${p.slug}`} onClick={markFromList} className="proj-link block">
          {face}
        </Link>
      ) : (
        face
      )}
      {/* outside the card's own link — links can't nest */}
      {(p.repo || p.demo) && (
        <div className="mt-3 flex gap-4 font-mono text-xs uppercase tracking-wide text-white">
          {p.repo && <CardLink href={p.repo}>Source</CardLink>}
          {p.demo && <CardLink href={p.demo}>Demo</CardLink>}
        </div>
      )}
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
