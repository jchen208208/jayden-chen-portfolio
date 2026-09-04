import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Jayden Chen — Résumé",
};

// Reachable only by hyperlink (nav / direct URL), never by scrolling the home page.
export default function ResumePage() {
  return (
    <main className="relative z-10 mx-auto flex min-h-[100svh] max-w-2xl flex-col justify-center px-6 py-24">
      <Link
        href="/#top"
        className="mb-10 font-mono text-xs uppercase tracking-[0.3em] text-ink-faint transition-colors hover:text-ember"
      >
        ← Back
      </Link>
      <h1 className="font-display text-4xl font-normal tracking-tight text-ink sm:text-5xl">
        Résumé
      </h1>
      <p className="mt-4 text-ink-soft">
        Placeholder — the real résumé (and a PDF download) will live here.
      </p>
    </main>
  );
}
