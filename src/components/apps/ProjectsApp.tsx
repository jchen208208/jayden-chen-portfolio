"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PROJECTS } from "@/lib/site";
import Pane from "./Pane";

/**
 * Projects as a code editor: a file tree of `*.md` on the left, the selected
 * project rendered as a README "file" with a line gutter on the right. The
 * selected file is mirrored to `?file=` (query only — a documented, safe use of
 * history.replaceState).
 */
export default function ProjectsApp() {
  const params = useSearchParams();
  const fromUrl = params.get("file");
  const initial =
    PROJECTS.find((p) => p.slug === fromUrl)?.slug ?? PROJECTS[0]?.slug ?? "";
  const [slug, setSlug] = useState(initial);

  const project = useMemo(
    () => PROJECTS.find((p) => p.slug === slug) ?? PROJECTS[0],
    [slug],
  );

  function select(next: string) {
    setSlug(next);
    const url = new URL(window.location.href);
    url.searchParams.set("file", next);
    window.history.replaceState(null, "", url);
  }

  if (!project) {
    return (
      <div className="p-6 font-mono text-sm text-[color:var(--app-fg-soft)]">
        No projects yet.
      </div>
    );
  }

  const readme = buildReadme(project);

  return (
    <Pane
      sidebarLabel="Project files"
      sidebar={
        <ul className="font-mono text-xs">
          <li className="px-2 py-1 text-[color:var(--app-fg-soft)]">▾ projects/</li>
          {PROJECTS.map((p) => (
            <li key={p.slug}>
              <button
                type="button"
                onClick={() => select(p.slug)}
                aria-current={p.slug === slug}
                className={`flex w-full items-center gap-1.5 rounded px-2 py-1 pl-5 text-left transition-colors ${
                  p.slug === slug
                    ? "bg-[color:var(--accent)]/15 text-[color:var(--app-fg)]"
                    : "text-[color:var(--app-fg-soft)] hover:bg-white/5"
                }`}
              >
                <span aria-hidden style={{ color: "var(--accent)" }}>
                  #
                </span>
                {p.slug}.md
              </button>
            </li>
          ))}
        </ul>
      }
    >
      {/* tab bar */}
      <div className="flex items-center border-b border-white/10 bg-white/[0.02] px-3 py-1.5 font-mono text-xs text-[color:var(--app-fg-soft)]">
        <span className="rounded-t bg-[color:var(--app-bg)] px-3 py-1 text-[color:var(--app-fg)] ring-1 ring-inset ring-white/10">
          {project.slug}.md
        </span>
      </div>

      {/* file body with line gutter */}
      <div className="flex font-mono text-[13px] leading-6">
        <pre
          aria-hidden
          className="select-none border-r border-white/10 px-3 py-4 text-right text-[color:var(--app-fg-soft)]/50"
        >
          {readme.map((_, i) => `${i + 1}\n`).join("")}
        </pre>
        <div className="min-w-0 flex-1 px-4 py-4">
          {readme.map((line, i) => (
            <ReadmeLine key={i} line={line} />
          ))}
        </div>
      </div>
    </Pane>
  );
}

function buildReadme(p: (typeof PROJECTS)[number]): string[] {
  const lines: string[] = [];
  lines.push(`# ${p.name}`);
  lines.push("");
  lines.push(`_${p.period}_`);
  lines.push("");
  lines.push(p.blurb);
  lines.push("");
  if (p.highlights.length) {
    lines.push("## Highlights");
    lines.push("");
    for (const h of p.highlights) lines.push(`- ${h}`);
    lines.push("");
  }
  lines.push("## Stack");
  lines.push("");
  lines.push(p.tags.join(" · "));
  if (p.repo || p.demo) {
    lines.push("");
    lines.push("## Links");
    lines.push("");
    if (p.repo) lines.push(`- repo: ${p.repo}`);
    if (p.demo) lines.push(`- demo: ${p.demo}`);
  }
  return lines;
}

function ReadmeLine({ line }: { line: string }) {
  if (line.startsWith("# "))
    return (
      <div className="text-base font-semibold text-white">
        <span style={{ color: "var(--accent)" }}>#</span> {line.slice(2)}
      </div>
    );
  if (line.startsWith("## "))
    return (
      <div className="mt-1 font-semibold text-[color:var(--app-fg)]">
        <span style={{ color: "var(--accent)" }}>##</span> {line.slice(3)}
      </div>
    );
  if (line.startsWith("- ")) {
    const body = line.slice(2);
    const link = /^(repo|demo): (https?:\/\/\S+)$/.exec(body);
    return (
      <div className="text-[color:var(--app-fg-soft)]">
        <span style={{ color: "var(--accent)" }}>-</span>{" "}
        {link ? (
          <>
            {link[1]}:{" "}
            <a
              href={link[2]}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2"
              style={{ color: "var(--accent)" }}
            >
              {link[2]}
            </a>
          </>
        ) : (
          body
        )}
      </div>
    );
  }
  if (line.startsWith("_") && line.endsWith("_"))
    return (
      <div className="italic text-[color:var(--app-fg-soft)]">
        {line.slice(1, -1)}
      </div>
    );
  if (!line) return <div>&nbsp;</div>;
  return <div className="text-[color:var(--app-fg-soft)]">{line}</div>;
}
