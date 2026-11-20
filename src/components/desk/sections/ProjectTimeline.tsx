"use client";

import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import type { PathNode, TimelineStage } from "@/lib/sparcTimeline";

/** a box changed from the stage before (or there was no stage before) */
function isNew(node: PathNode, prev: TimelineStage | undefined) {
  if (!prev) return false;
  const was = prev.path.find((p) => p.id === node.id);
  return !was || was.label !== node.label || was.sub !== node.sub;
}

/** the link into the next box changed */
function linkIsNew(node: PathNode, prev: TimelineStage | undefined) {
  if (!prev) return false;
  const was = prev.path.find((p) => p.id === node.id);
  return !was || was.link !== node.link;
}

/**
 * A project's build as a timeline (`/projects/{slug}`, in place of the
 * bullets). On top, the signal path at the chosen stage — the hand's gesture
 * flowing box to box — with whatever changed since the stage before flashing
 * in the light. Under it, a scrubber with a stop per stage: click a stop, drag
 * along the track, or use the arrow keys. Then the stage itself: what it was,
 * and the problem it ran into and how that got fixed.
 */
export function ProjectTimeline({ stages }: { stages: TimelineStage[] }) {
  const [index, setIndex] = useState(0);
  const stage = stages[index];
  const prev = stages[index - 1];
  const last = stages.length - 1;

  const railRef = useRef<HTMLDivElement>(null);
  const stopRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const dragging = useRef(false);

  const go = (i: number, focus = false) => {
    const next = Math.max(0, Math.min(last, i));
    setIndex(next);
    if (focus) stopRefs.current[next]?.focus();
  };

  /** the stop nearest the pointer along the rail */
  const nearest = (clientX: number) => {
    const rail = railRef.current;
    if (!rail) return index;
    const r = rail.getBoundingClientRect();
    const t = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    return Math.round(t * last);
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    go(nearest(e.clientX), true);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (dragging.current) go(nearest(e.clientX), true);
  };
  const onPointerUp = () => {
    dragging.current = false;
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const to =
      e.key === "ArrowRight" || e.key === "ArrowDown"
        ? index + 1
        : e.key === "ArrowLeft" || e.key === "ArrowUp"
          ? index - 1
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? last
              : null;
    if (to === null) return;
    e.preventDefault();
    go(to, true);
  };

  const pct = (i: number) => (last === 0 ? 0 : (i / last) * 100);
  const panelId = "tl-panel";

  return (
    <div className="tl flex flex-col gap-6">
      {/* the signal path at this stage */}
      <div className="flex flex-col gap-2">
        <ol key={index} className="tl-path" aria-label={`Signal path: ${stage.path.map((n) => n.label).join(", then ")}`}>
          {stage.path.map((node, i) => (
            <li key={node.id} className="tl-step">
              <div className={`tl-node${isNew(node, prev) ? " tl-new" : ""}`}>
                <span className="tl-node-label">{node.label}</span>
                {node.sub && <span className="tl-node-sub">{node.sub}</span>}
              </div>
              {i < stage.path.length - 1 && (
                <div
                  className={`tl-link${node.air ? " tl-air" : ""}${linkIsNew(node, prev) ? " tl-new" : ""}`}
                  aria-hidden
                >
                  <span className="tl-link-label">{node.link}</span>
                  <span className="tl-link-line" />
                </div>
              )}
            </li>
          ))}
        </ol>
        {stage.removed && (
          <p key={`gone-${index}`} className="tl-gone text-xs uppercase tracking-wide text-white/50">
            Dropped:{" "}
            {stage.removed.map((r, i) => (
              <span key={r}>
                {i > 0 && " · "}
                <s className="text-white/70">{r}</s>
              </span>
            ))}
          </p>
        )}
      </div>

      {/* the scrubber */}
      <div
        className="tl-track"
        role="tablist"
        aria-label="Build stages"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
      >
        <div ref={railRef} className="tl-rail">
          <div className="tl-fill" style={{ width: `${pct(index)}%` }} />
          {stages.map((s, i) => (
            <button
              key={s.mark}
              ref={(el) => {
                stopRefs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`tl-stop-${i}`}
              aria-selected={i === index}
              aria-controls={panelId}
              aria-label={`${s.date}: ${s.title}`}
              tabIndex={i === index ? 0 : -1}
              onClick={() => go(i)}
              className={`tl-stop${i < index ? " tl-past" : ""}${i === index ? " tl-here" : ""}`}
              style={{ left: `${pct(i)}%` }}
            >
              <span className="tl-dot" />
              <span className="tl-mark font-screen">{s.mark}</span>
            </button>
          ))}
        </div>
      </div>

      {/* the stage */}
      <div
        key={index}
        id={panelId}
        role="tabpanel"
        aria-labelledby={`tl-stop-${index}`}
        aria-live="polite"
        className="tl-panel flex flex-col gap-3"
      >
        <div className="flex flex-col gap-1">
          <h3 className="font-screen text-2xl uppercase leading-none text-[var(--glow)]">
            {String(index + 1).padStart(2, "0")} · {stage.title}
          </h3>
          <p className="text-xs uppercase tracking-wide text-white/50">{stage.date}</p>
        </div>
        <p className="text-base leading-relaxed text-white/75">{stage.body}</p>
        {(stage.problem || stage.fix) && (
          <dl className="tl-pf">
            {stage.problem && (
              <>
                <dt>Problem</dt>
                <dd>{stage.problem}</dd>
              </>
            )}
            {stage.fix && (
              <>
                <dt>Fix</dt>
                <dd>{stage.fix}</dd>
              </>
            )}
          </dl>
        )}
      </div>

      <div className="flex justify-between text-sm uppercase tracking-wide">
        <button
          type="button"
          onClick={() => go(index - 1)}
          disabled={index === 0}
          className="tl-step-btn"
        >
          ← Earlier
        </button>
        <button
          type="button"
          onClick={() => go(index + 1)}
          disabled={index === last}
          className="tl-step-btn"
        >
          Later →
        </button>
      </div>
    </div>
  );
}
