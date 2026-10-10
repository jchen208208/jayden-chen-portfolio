"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import FocusFrame from "@/components/focus/FocusFrame";
import { EXPERIENCE } from "@/lib/site";
import { takeFromList } from "@/lib/experienceNav";
import { RoleShot } from "./experience";
import { Bullets, CardLink } from "./shared";

/** the lamp over the picture switches on this long after the page opens,
 *  once the page itself is in view */
const LAMP_ON_DELAY_MS = 320;

/**
 * A role's own page — `/experience/{slug}`, opened from a card in the
 * Experience list. Same frame as a section's stacked page (`FocusFrame`),
 * with the panorama behind it, raised over the desk's section view so that
 * view can stay open underneath: leaving goes back to it, at the same
 * scroll, when that's where the visitor came from (`experienceNav`), and to
 * `/experience` otherwise.
 *
 * The picture's lamp switches on as the page opens — the hover from the list
 * carried through. Then the title, where and when, the one-line lead, the
 * story if there is one, what was done, the tools, a link out if the work is
 * live, and the neighbouring roles. The page route keys this by slug, so
 * moving to a neighbour starts the page (and the lamp) afresh.
 */
export function RolePage({ slug }: { slug: string }) {
  const router = useRouter();
  const index = EXPERIENCE.findIndex((r) => r.slug === slug);
  const role = EXPERIENCE[index];
  const prev = EXPERIENCE[index - 1];
  const next = EXPERIENCE[index + 1];

  const leave = useCallback(() => {
    if (takeFromList()) router.back();
    else router.push("/experience");
  }, [router]);

  const [lit, setLit] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setLit(true), LAMP_ON_DELAY_MS);
    return () => window.clearTimeout(t);
  }, []);

  const meta = [role.project, role.place].filter(Boolean).join(" · ");

  return (
    <FocusFrame
      id="experience"
      raised
      onClose={leave}
      heading={
        <button
          type="button"
          onClick={leave}
          className="skills-heading section-title text-left text-[clamp(1.5rem,5vw,2.25rem)] uppercase leading-none transition-opacity hover:opacity-80"
        >
          ← Experience
        </button>
      }
    >
      <article className="xp-role flex flex-col gap-7 pb-6 font-mono text-white">
        {/* room above the picture for its lamp */}
        <div className={`pt-12 ${lit ? "xp-lit" : ""}`}>
          <RoleShot role={role} sizes="(min-width: 768px) 46rem, 100vw" eager />
        </div>

        <header className="flex flex-col gap-3">
          <h1
            id="section-title"
            className="font-title text-[clamp(1.75rem,5vw,2.75rem)] uppercase leading-tight tracking-wide"
          >
            {role.role}
          </h1>
          {meta && <p className="text-sm text-white/70">{meta}</p>}
          <p className="font-screen text-2xl uppercase leading-none text-[var(--glow)]">
            {role.start} – {role.end}
          </p>
        </header>

        <p className="text-lg leading-relaxed text-white/85">{role.blurb}</p>
        {role.story?.map((p) => (
          <p key={p} className="text-base leading-relaxed text-white/75">
            {p}
          </p>
        ))}

        <section className="flex flex-col gap-3">
          <h2 className="text-xs uppercase tracking-wide text-white/50">What I did</h2>
          <Bullets items={role.bullets} large />
        </section>

        {role.stack && (
          <section className="flex flex-col gap-2">
            <h2 className="text-xs uppercase tracking-wide text-white/50">Tools</h2>
            <p className="text-sm uppercase tracking-wide text-white/75">{role.stack.join(" · ")}</p>
          </section>
        )}

        {role.link && (
          <p className="text-sm uppercase tracking-wide">
            <CardLink href={role.link}>Visit site ↗</CardLink>
          </p>
        )}

        {/* neighbours replace this page in the history rather than adding to
            it, so leaving still lands on the list */}
        <nav
          aria-label="Other roles"
          className="mt-4 flex items-start justify-between gap-6 border-t border-white/10 pt-5 text-xs uppercase tracking-wide"
        >
          {prev ? (
            <Link href={`/experience/${prev.slug}`} replace className="xp-neighbour text-white/60">
              ← {prev.project ?? prev.role}
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link
              href={`/experience/${next.slug}`}
              replace
              className="xp-neighbour text-right text-white/60"
            >
              {next.project ?? next.role} →
            </Link>
          )}
        </nav>
      </article>
    </FocusFrame>
  );
}
