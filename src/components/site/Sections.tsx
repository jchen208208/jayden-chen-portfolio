import { AWARDS, PROJECTS, SKILL_GROUPS, SOCIALS } from "@/lib/site";
import ProjectCard from "./ProjectCard";
import Reveal from "./Reveal";
import SectionHeading, { Accent } from "./SectionHeading";

function Section({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="mx-auto max-w-6xl scroll-mt-24 px-5 py-24 sm:px-8 sm:py-32"
    >
      {children}
    </section>
  );
}

/* ------------------------------------------------------------------ Work --- */

export function Work() {
  return (
    <Section id="work">
      <SectionHeading watermark="work" kicker="01 — Selected">
        A few things I&apos;ve shipped<Accent>.</Accent>
      </SectionHeading>
      <div className="grid gap-6 sm:grid-cols-2">
        {PROJECTS.map((project, i) => (
          <Reveal key={project.slug} delay={(i % 2) * 0.08}>
            <ProjectCard project={project} />
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

/* ---------------------------------------------------------------- Skills --- */

export function Skills() {
  return (
    <Section id="skills">
      <SectionHeading watermark="toolkit" kicker="02 — Stack">
        What&apos;s in the pack<Accent>?</Accent>
      </SectionHeading>
      <div className="grid gap-6 md:grid-cols-3">
        {SKILL_GROUPS.map((group, i) => (
          <Reveal key={group.label} delay={i * 0.08}>
            <div className="h-full rounded-2xl border border-line bg-card">
              <div
                className="flex items-center justify-between rounded-t-2xl px-4 py-3"
                style={{ background: group.accent }}
              >
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-white">
                  {group.label}
                </span>
                <span className="font-mono text-[11px] text-white/80">
                  {group.items.length}
                </span>
              </div>
              <ul className="flex flex-wrap gap-2 p-4">
                {group.items.map((item) => (
                  <li
                    key={item}
                    className="rounded-full border border-line bg-paper px-3 py-1.5 text-sm text-ink-soft"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

/* ---------------------------------------------------------------- Awards --- */

export function Awards() {
  return (
    <Section id="awards">
      <SectionHeading watermark="awards" kicker="03 — Recognition">
        Picked up along the way<Accent>.</Accent>
      </SectionHeading>
      <ul className="border-t border-line">
        {AWARDS.map((award, i) => (
          <Reveal key={award.title} as="li" delay={i * 0.06}>
            <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 border-b border-line py-6 sm:grid-cols-[6rem_1fr_auto] sm:items-baseline">
              <span className="font-mono text-sm text-ink-faint">
                {award.year}
              </span>
              <span className="font-display text-lg text-ink">
                {award.title}
              </span>
              <span className="col-span-2 text-sm text-ink-soft sm:col-span-1 sm:text-right">
                {award.detail}
              </span>
            </div>
          </Reveal>
        ))}
      </ul>
    </Section>
  );
}

/* ----------------------------------------------------------------- About --- */

export function About() {
  return (
    <Section id="about">
      <SectionHeading watermark="riverside" kicker="04 — Off the clock">
        A little more<Accent>,</Accent> for context.
      </SectionHeading>
      <div className="grid gap-8 sm:grid-cols-2">
        <Reveal>
          <p className="text-lg leading-relaxed text-ink-soft">
            I grew up near water and never really left it — most weekends I&apos;m
            on a trail with a map that&apos;s three years out of date. That habit
            leaks into the work: I like tools that hold up in the field, load on a
            bad connection, and don&apos;t make you think.
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="text-lg leading-relaxed text-ink-soft">
            Lately I&apos;ve been into offline-first sync, small binaries, and
            making the boring parts of an interface feel considered. If it
            involves maps, rivers, or a suspiciously specific CLI flag, I&apos;m
            probably interested.
          </p>
        </Reveal>
      </div>
    </Section>
  );
}

/* --------------------------------------------------------------- Contact --- */

export function Contact() {
  return (
    <Section id="contact">
      <div className="rounded-3xl border border-line bg-card p-8 text-center sm:p-16">
        <Reveal>
          <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-ink-faint">
            05 — Say hello
          </p>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="mt-4 font-display text-4xl font-normal tracking-tight text-ink sm:text-6xl">
            Let&apos;s build something<span className="text-ember">.</span>
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                className="rounded-full border border-line px-5 py-2.5 text-sm text-ink transition-colors hover:border-ember hover:text-ember"
              >
                {s.label}
              </a>
            ))}
          </div>
        </Reveal>
      </div>
    </Section>
  );
}

/* ---------------------------------------------------------------- Footer --- */

export function Footer() {
  return (
    <footer className="mx-auto max-w-6xl px-5 pb-12 pt-4 sm:px-8">
      <div className="flex flex-col items-center justify-between gap-3 border-t border-line pt-6 text-sm text-ink-faint sm:flex-row">
        <span className="font-mono text-xs">
          © {new Date().getFullYear()} Jayden Chen
        </span>
        <span className="font-mono text-xs">Made among the trees.</span>
      </div>
    </footer>
  );
}
