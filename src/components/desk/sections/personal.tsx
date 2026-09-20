import { AWARDS } from "@/lib/site";
import type { SectionCard } from "./shared";

const MAX_WIDTH = "72rem";

function Heading({ children }: { children: string }) {
  return (
    <h2 className="font-title text-5xl tracking-wide md:text-6xl text-white">{children}</h2>
  );
}

/** About, Awards, Hobbies — plain text on the page, no boxes. Copy marked TODO
 *  is placeholder. */
export function personalCards(): SectionCard[] {
  const awards = [...AWARDS].sort((a, b) => b.date.localeCompare(a.date));
  return [
    {
      key: "personal",
      title: "",
      bare: true,
      fitContent: true,
      maxWidth: MAX_WIDTH,
      body: (
        <div className="flex flex-col gap-16 px-5 py-8 font-mono text-lg text-white md:text-xl">
          <section className="space-y-4">
            <Heading>About</Heading>
            <p className="leading-relaxed text-white/85">
              I&apos;m a Computer Engineering student at the University of Waterloo who likes
              building things on the line between software and hardware — a web app, a PCB, and
              the firmware in between.
            </p>
            <p className="leading-relaxed text-white/85">
              TODO — user: what you care about, how you work, what you&apos;re looking for.
            </p>
          </section>

          <section className="space-y-5">
            <Heading>Awards</Heading>
            <ul className="space-y-5">
              {awards.map((a) => (
                <li key={`${a.date}-${a.title}`} className="space-y-1">
                  <div className="text-2xl leading-snug md:text-3xl">{a.title}</div>
                  <div className="text-sm uppercase tracking-wide text-white/60 md:text-base">
                    {a.date.slice(0, 4)} · {a.org}
                  </div>
                  {a.summary && <p className="text-base leading-relaxed text-white/70 md:text-lg">{a.summary}</p>}
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-4">
            <Heading>Outside the code</Heading>
            <p className="leading-relaxed text-white/85">
              TODO — user: I like to play tennis and MMA, and I love to bake and cook.
            </p>
          </section>
        </div>
      ),
    },
  ];
}
