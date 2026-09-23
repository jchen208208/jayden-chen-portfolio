"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/site/icons";
import { PROFILE, RESUME_PDF } from "@/lib/site";

const SRC = `${RESUME_PDF.href}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`;

/**
 * The résumé's first page, drawn by the browser's own PDF viewer.
 *
 * The page itself is the frame — no border, since a white rule around a white
 * page only reads as one once there's a gap between them, and Chrome's viewer
 * insets the page ~5px inside the embed and top-aligns it, none of it
 * styleable. Scaling the embed just past the container pushes those insets
 * outside the rounded clip so the page bleeds to all four edges. Anchoring at
 * `origin-top` is what keeps it: scaling about the centre lifts the name off
 * the top edge, and a larger scale (1.05 was tried) runs the last line off the
 * bottom. At 1.025 the overscan is ~3px into the PDF's own ~37px margin.
 *
 * Until the viewer has painted, it fills the embed with its own dark grey
 * backdrop, which on this black page reads as a glitch — so the embed stays
 * transparent over the white ground and fades in once there's a page to show.
 */
export default function ResumePreview() {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    // Browsers that refuse to draw a PDF inline — most mobile ones — render
    // the fallback children instead and never fire `load`. There's no viewer
    // backdrop to hide in that case, so don't cover them at all: waiting would
    // only delay the fallback link they actually need.
    // Anything that does draw one but never reports `load` falls back to the
    // long stop, so the cover can't strand the preview blank. Deliberately
    // long — tripping it early would uncover the grey backdrop, which is the
    // whole thing being avoided.
    const noInlineViewer = window.navigator.pdfViewerEnabled === false;
    const timer = window.setTimeout(() => setShown(true), noInlineViewer ? 0 : 10000);
    return () => window.clearTimeout(timer);
  }, []);

  // `load` means the PDF has been fetched, which is a beat before the viewer
  // has painted page one — revealing on the same tick still shows grey. The
  // settle is deliberately generous: the cover is the same white as the page
  // behind it, so holding it a moment too long is invisible, while lifting it
  // a moment too early is the grey flash this exists to prevent.
  const reveal = () => window.setTimeout(() => setShown(true), 400);

  return (
    <div
      className="mt-10 overflow-hidden rounded-[16px] bg-white"
      style={{ aspectRatio: RESUME_PDF.pageAspect }}
    >
      <object
        data={SRC}
        type="application/pdf"
        aria-label={`${PROFILE.name} résumé, one page`}
        onLoad={reveal}
        onError={reveal}
        className={`resume-embed h-full w-full origin-top -translate-y-[3px] scale-[1.025] transition-opacity duration-300 ${
          shown ? "opacity-100" : "opacity-0"
        }`}
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
      {/* nothing reveals the embed without JS, so opt straight back out of it */}
      <noscript>
        <style>{`.resume-embed{opacity:1!important}`}</style>
      </noscript>
    </div>
  );
}
