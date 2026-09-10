import type { Metadata } from "next";
import Link from "next/link";
import { PROFILE, SOCIALS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Jayden Chen — Résumé",
};

export default function ResumePage() {
  return (
    <main className="mx-auto flex min-h-[100svh] max-w-2xl flex-col justify-center px-6 py-24">
      <Link
        href="/"
        className="mb-10 font-mono text-xs uppercase tracking-[0.3em] text-ink-faint transition-colors hover:text-ink"
      >
        ← Back to the desk
      </Link>
      <h1 className="font-title text-4xl tracking-tight text-ink sm:text-5xl">
        Résumé
      </h1>
      <p className="mt-4 text-ink-soft">
        Placeholder — the full résumé and a PDF download will live here.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
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
      <p className="mt-10 font-mono text-xs text-ink-faint">{PROFILE.tagline}</p>
    </main>
  );
}
