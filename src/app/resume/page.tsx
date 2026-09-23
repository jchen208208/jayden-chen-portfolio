import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/site/icons";
import ResumePreview from "@/components/site/ResumePreview";
import { PROFILE, RESUME_PDF, SOCIALS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Jayden Chen — Résumé",
  description: `Résumé for ${PROFILE.name} — ${PROFILE.tagline}.`,
};

export default function ResumePage() {
  return (
    <main className="mx-auto flex min-h-[100svh] max-w-3xl flex-col px-6 py-20">
      <Link
        href="/"
        className="font-mono text-xs uppercase tracking-[0.3em] text-ink-faint transition-colors hover:text-ink"
      >
        ← Back to the desk
      </Link>

      <h1 className="mt-10 font-title text-4xl tracking-tight text-ink sm:text-5xl">
        Résumé
      </h1>
      <p className="mt-3 font-mono text-xs uppercase tracking-[0.2em] text-ink-faint">
        One page · Updated {RESUME_PDF.updated}
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <a
          href={RESUME_PDF.href}
          download={RESUME_PDF.filename}
          className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 font-mono text-xs uppercase tracking-[0.15em] text-black transition-opacity hover:opacity-80"
        >
          <Icon name="download" size={16} />
          Download résumé
        </a>
        <a
          href={RESUME_PDF.href}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 font-mono text-xs uppercase tracking-[0.15em] text-ink transition-colors hover:border-ink"
        >
          <Icon name="openInNew" size={16} />
          Open résumé
        </a>
      </div>

      <ResumePreview />

      <div className="mt-10 flex flex-wrap gap-3">
        {SOCIALS.map((s) => (
          <a
            key={s.label}
            href={s.href}
            target={s.href.startsWith("http") ? "_blank" : undefined}
            rel={s.href.startsWith("http") ? "noreferrer" : undefined}
            className="rounded-full border border-line px-4 py-1.5 text-sm text-ink transition-colors hover:border-ink"
          >
            {s.label}
          </a>
        ))}
      </div>
      <p className="mt-8 font-mono text-xs text-ink-faint">{PROFILE.tagline}</p>
    </main>
  );
}
