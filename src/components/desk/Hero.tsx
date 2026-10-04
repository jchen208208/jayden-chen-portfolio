import Link from "next/link";
import { PROFILE } from "@/lib/site";
import { Icon } from "@/components/site/icons";
import ContributionName from "./ContributionName";

/**
 * The title card: name, tagline, résumé, socials. This is the site's only
 * contact surface — there is no separate contact section.
 */
export default function Hero() {
  return (
    <div className="flex flex-col items-center px-6 text-center">
      <p className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.04] py-1.5 pr-3.5 pl-3 font-mono text-[10px] uppercase tracking-[0.25em] text-white/75 sm:text-[11px]">
        <Icon name="hardHat" size={15} className="text-white" />
        Under construction
      </p>
      {/* the name, spelled out in squares like a GitHub contribution graph */}
      <ContributionName />
      <p className="mt-6 font-mono text-xs uppercase tracking-[0.3em] text-white/65 sm:text-sm">
        {PROFILE.tagline}
      </p>

      <div className="mt-9 flex items-center gap-4">
        <Link
          href={PROFILE.resume}
          className="rounded-full border border-white/20 px-5 py-2 font-title text-sm text-white transition-colors hover:border-white/60"
        >
          Résumé
        </Link>
        <a
          href={PROFILE.github}
          target="_blank"
          rel="noreferrer"
          aria-label="GitHub"
          className="text-white/50 transition-colors hover:text-white"
        >
          <Icon name="github" />
        </a>
        <a
          href={PROFILE.linkedin}
          target="_blank"
          rel="noreferrer"
          aria-label="LinkedIn"
          className="text-white/50 transition-colors hover:text-white"
        >
          <Icon name="linkedin" />
        </a>
      </div>

      <p className="mt-10 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-white/25">
        Scroll
        <span aria-hidden className="scroll-cue">
          ↓
        </span>
      </p>
    </div>
  );
}
