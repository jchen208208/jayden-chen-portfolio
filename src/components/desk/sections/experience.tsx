import { TIMELINE } from "@/lib/site";
import { Bullets, CardBody, Meta, monthYear, type SectionCard } from "./shared";

/** one card per role, oldest first, so the row reads left to right in time.
 *  Awards live on the Personal & Awards screen. */
export function experienceCards(): SectionCard[] {
  return TIMELINE.filter((e) => e.kind === "role")
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => ({
      key: `${e.date}-${e.org}`,
      title: e.org,
      body: (
        <CardBody>
          <Meta>Since {monthYear(e.date)}</Meta>
          <div className="shrink-0 text-base leading-snug">{e.title}</div>
          {e.summary && <p className="shrink-0 leading-relaxed text-white/85">{e.summary}</p>}
          {e.details && <Bullets items={e.details} />}
        </CardBody>
      ),
    }));
}
