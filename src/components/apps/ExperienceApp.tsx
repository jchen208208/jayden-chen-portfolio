"use client";

import { useMemo, useState } from "react";
import { TIMELINE, type TimelineEntry } from "@/lib/site";
import { mulberry32 } from "@/lib/svg";
import Expander from "./Expander";

/**
 * Experience + awards as a `git log --graph`: one rail, newest first, each entry
 * a "commit" with a deterministic short hash and a conventional-commit subject.
 */

type Filter = "all" | "role" | "award";

function shortHash(date: string): string {
  const seed = [...date].reduce((a, c) => a + c.charCodeAt(0), 0);
  const rnd = mulberry32(seed);
  let h = "";
  const alphabet = "0123456789abcdef";
  for (let i = 0; i < 7; i++) h += alphabet[Math.floor(rnd() * 16)];
  return h;
}

function subject(e: TimelineEntry): string {
  if (e.kind === "award") return `award: ${e.title}`;
  const scope = e.org.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `feat(${scope}): ${e.title}`;
}

function fmtDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-CA", { year: "numeric", month: "short" });
}

export default function ExperienceApp() {
  const [filter, setFilter] = useState<Filter>("all");

  const entries = useMemo(
    () =>
      [...TIMELINE]
        .sort((a, b) => (a.date < b.date ? 1 : -1))
        .filter((e) => filter === "all" || e.kind === filter),
    [filter],
  );

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 flex gap-1.5 font-mono text-xs">
        {(["all", "role", "award"] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={`rounded-full px-3 py-1 transition-colors ${
              filter === f
                ? "bg-[color:var(--accent)]/20 text-[color:var(--app-fg)] ring-1 ring-inset ring-[color:var(--accent)]/40"
                : "text-[color:var(--app-fg-soft)] hover:bg-white/5"
            }`}
          >
            {f === "all" ? "all" : `${f}s`}
          </button>
        ))}
      </div>

      <ol className="font-mono text-[13px]">
        {entries.map((e, i) => {
          const last = i === entries.length - 1;
          return (
            <li key={e.date + e.title} className="flex gap-3">
              {/* graph gutter */}
              <div className="flex flex-col items-center" aria-hidden>
                <span style={{ color: "var(--accent)" }}>●</span>
                {!last && (
                  <span className="w-px flex-1 bg-white/15" style={{ minHeight: 24 }} />
                )}
              </div>

              <div className="min-w-0 flex-1 pb-5">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-[color:var(--app-fg-soft)]/60">
                    {shortHash(e.date)}
                  </span>
                  <span className="text-[color:var(--app-fg)]">{subject(e)}</span>
                  {e.kind === "award" && (
                    <span
                      className="rounded px-1.5 text-[11px]"
                      style={{
                        color: "var(--accent)",
                        background: "color-mix(in srgb, var(--accent) 18%, transparent)",
                      }}
                    >
                      tag: award
                    </span>
                  )}
                </div>
                <div className="mt-0.5 text-[color:var(--app-fg-soft)]/70">
                  {e.org} · {fmtDate(e.date)}
                </div>
                {e.summary && (
                  <p className="mt-1.5 max-w-prose font-sans text-sm leading-relaxed text-[color:var(--app-fg-soft)]">
                    {e.summary}
                  </p>
                )}
                {e.details && e.details.length > 0 && (
                  <div className="mt-2">
                    <Expander summary={`${e.details.length} more`}>
                      <ul className="ml-1 space-y-1 font-sans text-sm text-[color:var(--app-fg-soft)]">
                        {e.details.map((d) => (
                          <li key={d} className="flex gap-2">
                            <span style={{ color: "var(--accent)" }}>–</span>
                            {d}
                          </li>
                        ))}
                      </ul>
                    </Expander>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {entries.length === 0 && (
        <p className="font-mono text-sm text-[color:var(--app-fg-soft)]">
          nothing on this branch yet.
        </p>
      )}
    </div>
  );
}
