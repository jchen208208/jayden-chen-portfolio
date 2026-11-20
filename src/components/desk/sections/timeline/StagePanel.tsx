"use client";

import type { CSSProperties } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useSlotReel, type ReelTiming } from "@/hooks/useSlotReel";
import type { TimelineStage } from "@/lib/sparcTimeline";
import { PANEL_ID } from "./useStages";

/** the stage number's spin — the desk screens' reel, sped up */
const PANEL_REEL: ReelTiming = {
  firstLandMs: 120,
  landWindowMs: 260,
  jitterMs: 20,
  fastMs: 35,
  slowMs: 110,
  decelMs: 180,
};
/** the slash between number and code holds still */
const SLASH = /\//;

/** the problem → fix block */
function ProblemFix({ stage }: { stage: TimelineStage }) {
  if (!stage.problem && !stage.fix) return null;
  return (
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
  );
}

/**
 * The chosen stage, under whichever timeline is showing: on the left its
 * number and code, spinning like the desk screens' labels as it changes,
 * then its title and dates; on the right what happened, and the problem it
 * hit and the fix. It slides in from the way the timeline moved.
 */
export function StagePanel({
  stage,
  index,
  dir,
}: {
  stage: TimelineStage;
  index: number;
  dir: number;
}) {
  const code = `${String(index + 1).padStart(2, "0")}/${stage.tag}`;
  const spun = useSlotReel(code, { play: 1, timing: PANEL_REEL, fixed: SLASH });
  // with reduced motion the reel never runs, so it would keep the first code
  const shown = usePrefersReducedMotion() ? code : spun;

  return (
    <div
      id={PANEL_ID}
      role="tabpanel"
      aria-labelledby={`tl-stop-${index}`}
      aria-live="polite"
      className="tl-panel"
    >
      <div key={index} className="tl-panel-in" style={{ "--dir": dir } as CSSProperties}>
        <div className="tl-panel-head">
          <p aria-hidden className="tl-panel-code font-screen uppercase">
            {shown}
          </p>
          <h3 className="font-title text-[clamp(1.4rem,3vw,2rem)] uppercase leading-tight tracking-wide">
            {stage.title}
          </h3>
          <p className="text-xs uppercase tracking-wide text-white/50">{stage.date}</p>
        </div>
        <div className="flex flex-col gap-4">
          <p className="text-base leading-relaxed text-white/80 md:text-lg">{stage.body}</p>
          <ProblemFix stage={stage} />
        </div>
      </div>
    </div>
  );
}
