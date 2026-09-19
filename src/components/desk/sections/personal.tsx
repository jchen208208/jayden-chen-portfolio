import { PROFILE, TIMELINE } from "@/lib/site";
import { PodiumStill } from "../PortraitMonitorScreen";
import { CardBody, CardLink, Meta, type SectionCard } from "./shared";

/** Tennis, Awards, About — what the portrait monitor's story is about. Copy
 *  marked TODO is placeholder. */
export function personalCards(): SectionCard[] {
  const awards = TIMELINE.filter((e) => e.kind === "award").sort((a, b) =>
    b.date.localeCompare(a.date),
  );
  return [
    {
      key: "tennis",
      title: "Tennis",
      body: (
        <CardBody>
          {/* the last frame of the desk monitor's story, standing still */}
          <PodiumStill className="mx-auto h-auto w-full max-w-[220px] shrink-0" />
          <p className="shrink-0 leading-relaxed text-white/85">
            TODO — user: a few lines on playing — how long, what level, what it&apos;s taught you.
          </p>
        </CardBody>
      ),
    },
    {
      key: "awards",
      title: "Awards",
      body: (
        <CardBody>
          <ul className="shrink-0 space-y-4">
            {awards.map((a) => (
              <li key={`${a.date}-${a.title}`} className="space-y-1">
                <Meta>
                  {a.date.slice(0, 4)} · {a.org}
                </Meta>
                <div className="leading-snug">{a.title}</div>
                {a.summary && <p className="text-xs leading-relaxed text-white/70">{a.summary}</p>}
              </li>
            ))}
          </ul>
        </CardBody>
      ),
    },
    {
      key: "about",
      title: "About",
      body: (
        <CardBody>
          <p className="shrink-0 leading-relaxed text-white/85">
            I&apos;m a Computer Engineering student at the University of Waterloo who likes
            building things on the line between software and hardware — a web app, a PCB, and
            the firmware in between.
          </p>
          <p className="shrink-0 leading-relaxed text-white/85">
            TODO — user: what you care about, how you work, what you&apos;re looking for.
          </p>
          <div className="mt-auto flex shrink-0 flex-wrap gap-x-4 gap-y-2 pt-2 text-xs uppercase tracking-wide">
            <CardLink href={`mailto:${PROFILE.email}`}>Email</CardLink>
            <CardLink href={PROFILE.github}>GitHub</CardLink>
            <CardLink href={PROFILE.linkedin}>LinkedIn</CardLink>
            <CardLink href={PROFILE.resume}>Résumé</CardLink>
          </div>
        </CardBody>
      ),
    },
  ];
}
