"use client";

import { useState } from "react";
import { ABOUT_NOTES } from "@/lib/site";
import Pane from "./Pane";
import Markdown from "./markdown";

/**
 * About / personal as a notes app: a note list on the left, the selected note
 * rendered as markdown on the right, with a raw ⇄ preview toggle.
 */
export default function AboutApp() {
  const [slug, setSlug] = useState(ABOUT_NOTES[0]?.slug ?? "");
  const [raw, setRaw] = useState(false);
  const note = ABOUT_NOTES.find((n) => n.slug === slug) ?? ABOUT_NOTES[0];

  if (!note) {
    return (
      <div className="p-6 font-mono text-sm text-[color:var(--app-fg-soft)]">
        No notes yet.
      </div>
    );
  }

  return (
    <Pane
      sidebarLabel="Notes"
      sidebar={
        <ul className="text-xs">
          {ABOUT_NOTES.map((n) => (
            <li key={n.slug}>
              <button
                type="button"
                onClick={() => setSlug(n.slug)}
                aria-current={n.slug === slug}
                className={`w-full rounded px-2 py-1.5 text-left font-mono transition-colors ${
                  n.slug === slug
                    ? "bg-[color:var(--accent)]/15 text-[color:var(--app-fg)]"
                    : "text-[color:var(--app-fg-soft)] hover:bg-white/5"
                }`}
              >
                {n.title}
              </button>
            </li>
          ))}
        </ul>
      }
    >
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2 font-mono text-xs text-[color:var(--app-fg-soft)]">
        <span>{note.title}</span>
        <button
          type="button"
          onClick={() => setRaw((v) => !v)}
          className="rounded px-2 py-1 ring-1 ring-inset ring-white/10 transition-colors hover:text-[color:var(--app-fg)]"
        >
          {raw ? "preview" : "raw"}
        </button>
      </div>

      <div className="p-5 sm:p-8">
        {raw ? (
          <pre className="whitespace-pre-wrap font-mono text-[13px] leading-6 text-[color:var(--app-fg-soft)]">
            {note.body}
          </pre>
        ) : (
          <div className="max-w-prose">
            <Markdown source={note.body} />
          </div>
        )}
      </div>
    </Pane>
  );
}
