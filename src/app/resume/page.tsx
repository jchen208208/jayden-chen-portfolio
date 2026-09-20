import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/site/icons";
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

      {/* The page itself is the frame — no border, since a white rule around a
          white page only reads as one once there's a gap between them, and the
          gap is the thing being removed here.

          Chrome's built-in PDF viewer insets the page ~5px inside the embed
          and top-aligns it, and none of that is styleable. Scaling the embed
          just past the container pushes those insets outside the rounded clip,
          so the page bleeds to all four edges. Anchoring at `origin-top` is
          what keeps it: scaling about the centre lifts the page's name off the
          top edge, and a larger scale (1.05 was tried) runs the last line off
          the bottom. At 1.025 the overscan is ~3px into the PDF's own ~37px
          margin. White ground, because the viewer paints nothing until the PDF
          parses.

          `<object>` renders its children only when the browser refuses to draw
          a PDF inline — which most mobile browsers do — so the fallback needs
          no JS to appear. */}
      <div
        className="mt-10 overflow-hidden rounded-[16px] bg-white"
        style={{ aspectRatio: RESUME_PDF.pageAspect }}
      >
        <object
          data={`${RESUME_PDF.href}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
          type="application/pdf"
          aria-label={`${PROFILE.name} résumé, one page`}
          className="h-full w-full origin-top -translate-y-[3px] scale-[1.025]"
        >
          <div className="flex h-full flex-col items-center justify-center gap-4 bg-paper px-6 text-center">
            <p className="text-sm text-ink-soft">
              Your browser won&apos;t show a PDF inline.
            </p>
            <a
              href={RESUME_PDF.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 font-mono text-xs uppercase tracking-[0.15em] text-ink transition-colors hover:border-ink"
            >
              <Icon name="openInNew" size={16} />
              Open the résumé
            </a>
          </div>
        </object>
      </div>

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
