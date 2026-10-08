import Link from "next/link";
import { PROFILE } from "@/lib/site";
import { Icon, iconMaskImage } from "@/components/site/icons";
import ContributionName from "./ContributionName";

/** the hover sweep: dark, mid, then pale amber (see `.sweep-bar`) */
const SWEEP_BARS = [
  { left: "0%", delay: "0ms", background: "color-mix(in srgb, var(--glow, #ffbe5c) 55%, #000)" },
  { left: "29%", delay: "150ms", background: "var(--glow, #ffbe5c)" },
  { left: "58%", delay: "300ms", background: "color-mix(in srgb, var(--glow, #ffbe5c) 55%, #fff)" },
];

/** GitHub / LinkedIn: the bare glyph, with the sweep running only inside its shape */
const ICON_LINK = "sweep-btn text-white/50 transition-colors hover:text-white";

function SweepIcon({ name, size }: { name: "github" | "linkedin"; size: number }) {
  const mask = iconMaskImage(name);
  return (
    <span
      aria-hidden
      className="sweep-icon"
      style={{ width: size, height: size, maskImage: mask, WebkitMaskImage: mask }}
    >
      <SweepBars />
    </span>
  );
}

function SweepBars() {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0">
      {SWEEP_BARS.map((bar) => (
        <span
          key={bar.left}
          className="sweep-bar"
          style={{ left: bar.left, background: bar.background, transitionDelay: bar.delay }}
        />
      ))}
    </span>
  );
}

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
      {/* letter-spacing trails the last letter too, so the same space up
          front (`pl`) keeps the letters themselves centred under the name */}
      <p className="mt-8 pl-[0.3em] font-mono text-sm uppercase tracking-[0.3em] text-white/65 sm:text-base">
        {PROFILE.tagline}
      </p>

      <div className="mt-7 flex items-center gap-4">
        <a
          href={PROFILE.github}
          target="_blank"
          rel="noreferrer"
          aria-label="GitHub"
          className={ICON_LINK}
        >
          <SweepIcon name="github" size={22} />
        </a>
        <Link
          href={PROFILE.resume}
          className="sweep-btn rounded-full border-2 border-white/65 px-5 py-2 font-title text-sm text-white/65 transition-colors hover:border-white"
        >
          <span className="sweep-label">Résumé</span>
          <SweepBars />
        </Link>
        <a
          href={PROFILE.linkedin}
          target="_blank"
          rel="noreferrer"
          aria-label="LinkedIn"
          className={ICON_LINK}
        >
          <SweepIcon name="linkedin" size={22} />
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
