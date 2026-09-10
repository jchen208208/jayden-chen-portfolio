import Link from "next/link";
import { PROFILE } from "@/lib/site";
import { Icon } from "@/components/site/icons";

/**
 * The title card: name, tagline, résumé, socials. This is the site's only
 * contact surface — there is no separate contact section.
 */
export default function Hero() {
  return (
    <div className="flex flex-col items-center px-6 text-center">
      <h1 className="font-title text-[clamp(2.75rem,9vw,6rem)] leading-[0.95] tracking-tight text-white">
        {PROFILE.name}
      </h1>
      <p className="mt-4 font-mono text-xs uppercase tracking-[0.3em] text-white/45 sm:text-sm">
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
