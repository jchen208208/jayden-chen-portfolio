import { SKILLS_BOX_TITLES } from "../skillItems";
import type { CardOptions, SectionCard } from "./shared";
import BenchBody from "./skillsBench";
import LanguagesBody from "./skillsLanguages";
import StackBody from "./skillsStack";

/**
 * Skills is three cards, each its own small live thing rather than a grid of
 * icons: a language editor that types, a wired stack diagram that carries a
 * pulse, and a bench of three drawings at work. They share the card chrome and
 * one rule for light — everything ink, with a single amber moment at a time —
 * and a hover on any skill lights it and says where it was used.
 *
 * The bodies and their animations wait for the card to be on screen for real
 * (see `SkillPane`), and show their finished pose under reduced motion.
 */
export function skillsCards(opts: CardOptions): SectionCard[] {
  const bodies = [LanguagesBody, StackBody, BenchBody];
  return SKILLS_BOX_TITLES.map((title, i) => {
    const Body = bodies[i];
    return { key: title, title, body: <Body {...opts} /> };
  });
}
