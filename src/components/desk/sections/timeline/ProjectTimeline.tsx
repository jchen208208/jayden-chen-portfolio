"use client";

import type { TimelineStage } from "@/lib/sparcTimeline";
import { LedTimeline } from "./LedTimeline";
import { StagePanel } from "./StagePanel";
import { useStages } from "./useStages";

/**
 * A project's build as a timeline, on its own page in place of the bullets.
 * It breaks out of the page's column to span the screen: SPARC's LED strip
 * with a light per stage, then the chosen stage's story, then steps.
 */
export function ProjectTimeline({ stages }: { stages: TimelineStage[] }) {
  const s = useStages(stages.length);

  return (
    <div className="tl-bleed">
      <LedTimeline stages={stages} s={s} />

      <StagePanel stage={stages[s.index]} index={s.index} dir={s.dir} />

      <div className="tl-steps">
        <button type="button" onClick={() => s.go(s.index - 1)} disabled={s.index === 0}>
          ← Earlier
        </button>
        <span className="font-screen text-lg text-white/50">
          {String(s.index + 1).padStart(2, "0")} / {String(stages.length).padStart(2, "0")}
        </span>
        <button type="button" onClick={() => s.go(s.index + 1)} disabled={s.index === s.last}>
          Later →
        </button>
      </div>
    </div>
  );
}
