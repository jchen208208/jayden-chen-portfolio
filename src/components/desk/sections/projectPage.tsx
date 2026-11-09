"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import FocusFrame from "@/components/focus/FocusFrame";
import { PROJECTS } from "@/lib/site";
import { takeFromList } from "@/lib/experienceNav";
import { ProjectWindow } from "./projects";
import { Bullets, CardLink } from "./shared";

/** the window lights up this long after the page opens, once the page itself
 *  is in view */
const LIGHT_ON_DELAY_MS = 320;

/**
 * A project's own page — `/projects/{slug}`, opened from its card in the
 * Projects grid. Built like a role's page (`RolePage`): the same raised
 * `FocusFrame` over the desk's open Projects view, and leaving goes back to
 * that view when that's where the visitor came from (`experienceNav`), and to
 * `/projects` otherwise.
 *
 * The project's window comes up lit as the page opens — the card's hover
 * carried through. Then the name and dates, what was done, the build in
 * pictures, the tools, and links out if there are any.
 */
export function ProjectPage({ slug }: { slug: string }) {
  const router = useRouter();
  const project = PROJECTS.find((p) => p.slug === slug)!;

  const leave = useCallback(() => {
    if (takeFromList()) router.back();
    else router.push("/projects");
  }, [router]);

  const [lit, setLit] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setLit(true), LIGHT_ON_DELAY_MS);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <FocusFrame
      id="projects"
      raised
      onClose={leave}
      heading={
        <button
          type="button"
          onClick={leave}
          className="skills-heading section-title text-left text-[clamp(1.5rem,5vw,2.25rem)] uppercase leading-none transition-opacity hover:opacity-80"
        >
          ← Projects
        </button>
      }
    >
      <article className="flex flex-col gap-7 pb-6 font-mono text-white">
        <div className={`proj-card${lit ? " proj-lit" : ""}`}>
          <ProjectWindow project={project} sizes="(min-width: 768px) 46rem, 100vw" eager file={false} />
        </div>

        <header className="flex flex-col gap-3">
          <h1
            id="section-title"
            className="font-title text-[clamp(1.75rem,5vw,2.75rem)] uppercase leading-tight tracking-wide"
          >
            {project.name}
          </h1>
          <p className="font-screen text-2xl uppercase leading-none text-[var(--glow)]">
            {project.period}
          </p>
        </header>

        <section className="flex flex-col gap-3">
          <h2 className="text-xs uppercase tracking-wide text-white/50">What I did</h2>
          <Bullets items={project.highlights} large />
        </section>

        {project.gallery && (
          <section className="flex flex-col gap-4">
            <h2 className="text-xs uppercase tracking-wide text-white/50">The build</h2>
            <ol className="flex flex-col gap-8">
              {project.gallery.map((fig, i) => (
                <li key={fig.caption}>
                  <figure className="flex flex-col gap-3">
                    <div className="proj-figure">
                      <Image
                        src={fig.image}
                        alt={fig.caption}
                        sizes="(min-width: 768px) 46rem, 100vw"
                        className="h-auto w-full"
                      />
                    </div>
                    <figcaption className="flex items-baseline gap-3 text-sm text-white/75">
                      <span className="font-screen text-xl leading-none text-[var(--glow)]">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {fig.caption}
                    </figcaption>
                  </figure>
                </li>
              ))}
            </ol>
          </section>
        )}

        <section className="flex flex-col gap-2">
          <h2 className="text-xs uppercase tracking-wide text-white/50">Tools</h2>
          <p className="text-sm uppercase tracking-wide text-white/75">{project.tags.join(" · ")}</p>
        </section>

        {(project.repo || project.demo) && (
          <p className="flex gap-4 text-sm uppercase tracking-wide">
            {project.repo && <CardLink href={project.repo}>Source ↗</CardLink>}
            {project.demo && <CardLink href={project.demo}>Demo ↗</CardLink>}
          </p>
        )}
      </article>
    </FocusFrame>
  );
}
