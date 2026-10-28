"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import sample from "@/assets/experience/hitwithluke.webp";
import { PRINT_MOTIONS, type MotionId } from "./printMotion";

/**
 * A panel for trying the ways a print can open (`printMotion.ts`) side by
 * side, under `npm run dev` only — a production build never shows it, and
 * always uses the defaults. A slider picks the motion, another stretches its
 * timing, another sets how far Peel curls the paper, a box lends blank frames a sample picture so the negatives have
 * something to show, and a button opens the last frame again. The choice is
 * kept in this browser's storage, so a reload keeps it.
 *
 * Once a motion is chosen, this goes, with the motions that weren't.
 */

export const LAB = process.env.NODE_ENV === "development";

export type PrintLabState = {
  motion: MotionId;
  /** stretches every duration — 2 is twice as long */
  pace: number;
  /** how far Peel curls the paper — 1 is its usual curl */
  curl: number;
  /** blank frames borrow `SAMPLE_SHOT` */
  sample: boolean;
};

const DEFAULTS: PrintLabState = { motion: "peel", pace: 1, curl: 1, sample: false };
const KEY = "print-lab";

/** a committed picture blank frames can borrow while there are no photos */
export const SAMPLE_SHOT = sample;

let state = DEFAULTS;
let loaded = false;
const listeners = new Set<() => void>();

function snapshot() {
  if (!LAB) return DEFAULTS;
  if (!loaded) {
    loaded = true;
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) ?? "{}") as Partial<PrintLabState>;
      state = { ...DEFAULTS, ...saved };
      if (!PRINT_MOTIONS.some((m) => m.id === state.motion)) state = { ...state, motion: DEFAULTS.motion };
    } catch {
      // no storage: the defaults it is
    }
  }
  return state;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function update(patch: Partial<PrintLabState>) {
  state = { ...snapshot(), ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // kept for this visit only
  }
  listeners.forEach((l) => l());
}

export function usePrintLab() {
  return useSyncExternalStore(subscribe, snapshot, () => DEFAULTS);
}

const noSubscribe = () => () => {};

export function PrintLab({ onReplay, canReplay }: { onReplay: () => void; canReplay: boolean }) {
  const lab = usePrintLab();
  const mounted = useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );
  if (!LAB || !mounted) return null;

  const index = Math.max(
    0,
    PRINT_MOTIONS.findIndex((m) => m.id === lab.motion),
  );
  const motion = PRINT_MOTIONS[index];
  // portalled, but React still passes its events up to the section's view,
  // whose ground closes it — they stop here
  const stop = (e: { stopPropagation: () => void }) => e.stopPropagation();

  return createPortal(
    <div
      role="group"
      aria-label="Print animation lab"
      onClick={stop}
      onMouseDown={stop}
      onPointerDown={stop}
      className="fixed bottom-4 left-4 z-[80] flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-3 rounded-md bg-black/85 p-4 font-mono text-xs text-white/75 ring-1 ring-white/15"
    >
      <div className="flex items-baseline justify-between">
        <span className="font-screen text-lg uppercase leading-none tracking-wide text-[var(--glow)]">
          Print animation
        </span>
        <span className="text-white/35">dev only</span>
      </div>

      <label className="flex flex-col gap-2">
        <span className="uppercase tracking-wide text-white">
          {index + 1} / {PRINT_MOTIONS.length} · {motion.name}
        </span>
        <input
          type="range"
          min={0}
          max={PRINT_MOTIONS.length - 1}
          step={1}
          value={index}
          onChange={(e) => update({ motion: PRINT_MOTIONS[Number(e.target.value)].id })}
          className="w-full cursor-pointer accent-[var(--glow)]"
        />
      </label>
      <p className="min-h-[4.5em] leading-snug text-white/60">{motion.blurb}</p>

      <label className="flex flex-col gap-2">
        <span className="uppercase tracking-wide">Duration ×{lab.pace.toFixed(2)}</span>
        <input
          type="range"
          min={0.5}
          max={2}
          step={0.25}
          value={lab.pace}
          onChange={(e) => update({ pace: Number(e.target.value) })}
          className="w-full cursor-pointer accent-[var(--glow)]"
        />
      </label>

      {motion.id === "peel" && (
        <label className="flex flex-col gap-2">
          <span className="uppercase tracking-wide">Curl ×{lab.curl.toFixed(2)}</span>
          <input
            type="range"
            min={0.25}
            max={2}
            step={0.25}
            value={lab.curl}
            onChange={(e) => update({ curl: Number(e.target.value) })}
            className="w-full cursor-pointer accent-[var(--glow)]"
          />
        </label>
      )}

      <label className="flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={lab.sample}
          onChange={(e) => update({ sample: e.target.checked })}
          className="accent-[var(--glow)]"
        />
        Sample photo on blank frames
      </label>

      <button
        type="button"
        onClick={onReplay}
        disabled={!canReplay}
        className="rounded px-2 py-1.5 uppercase tracking-wide text-white ring-1 ring-inset ring-white/25 transition-colors hover:ring-white/60 disabled:cursor-default disabled:text-white/30 disabled:ring-white/10"
      >
        ↻ Replay last frame
      </button>
    </div>,
    document.body,
  );
}
