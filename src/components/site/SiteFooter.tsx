import Link from "next/link";
import type { ReactNode } from "react";
import { PROFILE, SECTION_ORDER, SECTIONS } from "@/lib/site";
import FooterBlocks, { FooterDrift, FooterScatter } from "./FooterBlocks";
import { Icon } from "./icons";
import ThemeBar from "./ThemeBar";

const mailto = `mailto:${PROFILE.email}`;

/** muted, brightening with an underline on hover */
const LINK =
  "rounded-sm text-ink-soft underline-offset-4 transition-colors hover:text-ink hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--glow)]";

function Column({ title, children }: { title: string; children: ReactNode }) {
  const id = `footer-${title.toLowerCase()}`;
  return (
    <nav aria-labelledby={id} className="space-y-3">
      <h2 id={id} className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--glow)]">
        {title}
      </h2>
      {children}
    </nav>
  );
}

/** opens in a new tab, with a small ↗ that stays with the label's last word */
function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className={`group ${LINK}`}>
      <span className="whitespace-nowrap">
        {children}
        <Icon
          name="openInNew"
          size={14}
          className="ml-1 inline align-[-0.125em] opacity-60 transition-opacity group-hover:opacity-100"
        />
      </span>
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

/**
 * The sign-off under the desk, reached once the desk's scroll move is over
 * (laid out after the Handover site's footer): who, the four sections again,
 * elsewhere, how to get in touch — then the © and the theme bar.
 */
export default function SiteFooter() {
  return (
    // positioned, so it paints over the desk's pinned stage, whose bottom it
    // tucks up over (`FOOTER_TUCK_VH` in `DeskStage`)
    <footer className="relative bg-paper text-ink-soft">
      {/* the blocks sit behind the content and stop above the bottom bar:
          the side gutters' fill, and a sparser scatter behind the text —
          all drifting into place as the footer scrolls in */}
      <FooterDrift />
      <div className="relative">
        <FooterBlocks side="left" />
        <FooterBlocks side="right" />
        <FooterScatter />
        <div className="relative mx-auto max-w-6xl px-4 pt-10 pb-8 sm:px-6 sm:pt-12">
          {/* on wide screens the four columns sit an equal space apart */}
          <div className="grid gap-8 sm:grid-cols-2 sm:gap-10 lg:flex lg:justify-between">
            <div className="space-y-4 sm:col-span-2">
              <p className="font-title text-2xl font-semibold text-ink">{PROFILE.name}</p>
              <p className="max-w-xs text-base leading-relaxed">
                {PROFILE.program} at the {PROFILE.school}, class of {PROFILE.classOf}.
              </p>
            </div>

            <Column title="Explore">
              <ul className="grid grid-cols-2 gap-x-6 gap-y-2 text-base sm:grid-cols-1">
                {SECTION_ORDER.map((id) => (
                  <li key={id}>
                    <Link href={SECTIONS[id].route} className={LINK}>
                      {SECTIONS[id].deskLabel}
                    </Link>
                  </li>
                ))}
              </ul>
            </Column>

            <Column title="Elsewhere">
              <ul className="space-y-2 text-base">
                <li>
                  <ExternalLink href={PROFILE.github}>GitHub</ExternalLink>
                </li>
                <li>
                  <ExternalLink href={PROFILE.linkedin}>LinkedIn</ExternalLink>
                </li>
                <li>
                  <Link href={PROFILE.resume} className={LINK}>
                    Résumé
                  </Link>
                </li>
              </ul>
            </Column>

            <Column title="Contact">
              <p className="max-w-xs text-base leading-relaxed">Got a role, a project or a question? Get in touch.</p>
              <a
                href={mailto}
                className="inline-flex max-w-full items-center gap-2 rounded-sm border-b-2 border-[var(--glow)]/70 pb-0.5 text-base font-semibold break-all text-ink transition-colors hover:border-[var(--glow)] hover:text-[var(--glow)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--glow)]"
              >
                <Icon name="mail" size={16} className="shrink-0 text-[var(--glow)]" />
                {PROFILE.email}
              </a>
            </Column>
          </div>
        </div>
      </div>

      {/* the bottom bar runs the full width: © at the left edge, the theme bar at the right */}
      <div>
        <div className="flex flex-col items-start gap-3 px-4 py-4 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            © {new Date().getFullYear()} {PROFILE.name}
          </p>
          <ThemeBar />
        </div>
      </div>
    </footer>
  );
}
