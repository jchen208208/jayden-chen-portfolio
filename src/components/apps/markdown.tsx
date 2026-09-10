import type { ReactNode } from "react";

/**
 * Deliberately tiny markdown renderer — enough for the notes app and project
 * READMEs, no dependency. Supports: #/##/### headings, - and 1. lists, blank-line
 * paragraphs, **bold**, _italic_, `code`, [text](url), and --- rules.
 */

function inline(text: string, keyPrefix: string): ReactNode[] {
  // order matters: code first (so ** inside code is literal), then links, then emphasis
  const tokens: ReactNode[] = [];
  const re =
    /(`[^`]+`)|(\[[^\]]+\]\([^)]+\))|(\*\*[^*]+\*\*)|(_[^_]+_)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) tokens.push(text.slice(last, m.index));
    const t = m[0];
    const key = `${keyPrefix}-${i++}`;
    if (t.startsWith("`")) {
      tokens.push(
        <code
          key={key}
          className="rounded bg-white/10 px-1 py-0.5 font-mono text-[0.85em]"
        >
          {t.slice(1, -1)}
        </code>,
      );
    } else if (t.startsWith("[")) {
      const mm = /\[([^\]]+)\]\(([^)]+)\)/.exec(t)!;
      const external = /^https?:/.test(mm[2]);
      tokens.push(
        <a
          key={key}
          href={mm[2]}
          target={external ? "_blank" : undefined}
          rel={external ? "noreferrer" : undefined}
          className="underline decoration-1 underline-offset-2 hover:opacity-80"
          style={{ color: "var(--accent, currentColor)" }}
        >
          {mm[1]}
        </a>,
      );
    } else if (t.startsWith("**")) {
      tokens.push(
        <strong key={key} className="font-semibold text-white">
          {t.slice(2, -2)}
        </strong>,
      );
    } else {
      tokens.push(
        <em key={key} className="italic">
          {t.slice(1, -1)}
        </em>,
      );
    }
    last = m.index + t.length;
  }
  if (last < text.length) tokens.push(text.slice(last));
  return tokens;
}

export default function Markdown({ source }: { source: string }) {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let para: string[] = [];
  let list: string[] | null = null;
  let ordered = false;
  let k = 0;

  const flushPara = () => {
    if (para.length) {
      blocks.push(
        <p key={`p${k++}`} className="leading-relaxed text-[color:var(--app-fg-soft)]">
          {inline(para.join(" "), `p${k}`)}
        </p>,
      );
      para = [];
    }
  };
  const flushList = () => {
    if (list && list.length) {
      const items = list.map((li, idx) => (
        <li key={idx} className="leading-relaxed">
          {inline(li, `li${k}-${idx}`)}
        </li>
      ));
      blocks.push(
        ordered ? (
          <ol key={`l${k++}`} className="ml-5 list-decimal space-y-1 text-[color:var(--app-fg-soft)]">
            {items}
          </ol>
        ) : (
          <ul key={`l${k++}`} className="ml-5 list-disc space-y-1 text-[color:var(--app-fg-soft)]">
            {items}
          </ul>
        ),
      );
    }
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flushPara();
      flushList();
      continue;
    }
    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    if (h) {
      flushPara();
      flushList();
      const level = h[1].length;
      const cls =
        level === 1
          ? "text-lg font-semibold text-white"
          : level === 2
            ? "mt-2 text-[0.95rem] font-semibold text-white"
            : "mt-2 text-sm font-semibold text-[color:var(--app-fg-soft)]";
      const Tag = (`h${level}` as "h1" | "h2" | "h3");
      blocks.push(
        <Tag key={`h${k++}`} className={cls}>
          {inline(h[2], `h${k}`)}
        </Tag>,
      );
      continue;
    }
    if (/^---+$/.test(line)) {
      flushPara();
      flushList();
      blocks.push(<hr key={`hr${k++}`} className="border-white/10" />);
      continue;
    }
    const ul = /^[-*]\s+(.*)$/.exec(line);
    const ol = /^\d+\.\s+(.*)$/.exec(line);
    if (ul || ol) {
      flushPara();
      const nextOrdered = Boolean(ol);
      if (list && ordered !== nextOrdered) flushList();
      if (!list) {
        list = [];
        ordered = nextOrdered;
      }
      list.push((ul ?? ol)![1]);
      continue;
    }
    para.push(line.trim());
  }
  flushPara();
  flushList();

  return <div className="space-y-3 text-sm">{blocks}</div>;
}
