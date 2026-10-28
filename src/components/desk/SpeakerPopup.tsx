import type { ReactNode } from "react";
import { deskUnits } from "@/lib/desk";
import { Icon } from "@/components/site/icons";
import ScreenMosaic from "./ScreenMosaic";

/**
 * The speaker's popup: a now-playing card in the shape of the phone's
 * lock-screen player or Spotify's — the album cover beside the song and its
 * artist, a progress bar with the time played and the song's length, and
 * previous / play / next — on frosted glass, so the desk behind it blurs
 * through.
 *
 * A placeholder for now: one made-up track, and buttons that don't play
 * anything yet. The cover is a mosaic like the screens', in the theme's
 * shades, until real covers arrive.
 *
 * Everything inside is sized in em off one font size given in desk units,
 * so the whole card scales with the desk like everything drawn on it.
 */

/** 1em inside the card, in desk units */
const EM = 16;
/** the cover's side, in desk units (3.5em) — the mosaic is laid out in these */
const COVER = 56;
const COVER_SEED = 5;

/** stand-in until the real songs are wired up */
const TRACK = { title: "Song Title", artist: "Artist Name", elapsed: 72, length: 197 };

/** seconds → m:ss */
const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/** one transport button. Like the desk's other controls, a press doesn't
 *  take focus — focusing inside the sticky, transformed desk can make some
 *  browsers snap-scroll the page (see the screen buttons in DeskScene). */
function Control({
  label,
  className,
  children,
}: {
  label: string;
  className: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onMouseDown={(e) => e.preventDefault()}
      className={`flex shrink-0 cursor-pointer items-center justify-center outline-none transition ${className}`}
    >
      {children}
    </button>
  );
}

export default function SpeakerPopup() {
  return (
    <div
      className="rounded-[1em] border border-white/10 bg-white/8 px-[0.875em] pb-[0.625em] pt-[0.875em] text-white backdrop-blur-md"
      style={{ fontSize: deskUnits(EM) }}
    >
      {/* the song: its cover beside its title and artist */}
      <div className="flex items-center gap-[0.75em]">
        <div className="relative size-[3.5em] shrink-0 overflow-hidden rounded-[0.375em]">
          <ScreenMosaic w={COVER} h={COVER} seed={COVER_SEED} burst={null} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-[1.0625em] font-semibold leading-snug">{TRACK.title}</p>
          <p className="truncate text-[0.9375em] leading-snug text-white/60">{TRACK.artist}</p>
        </div>
      </div>

      {/* how far in: the bar, then the time played and the song's length */}
      <div className="mt-[0.75em]">
        <div className="h-[0.25em] overflow-hidden rounded-full bg-white/20">
          <div
            className="h-full rounded-full bg-white"
            style={{ width: `${(TRACK.elapsed / TRACK.length) * 100}%` }}
          />
        </div>
        <div className="mt-[0.25em] flex justify-between text-[0.6875em] tabular-nums text-white/50">
          <span>{clock(TRACK.elapsed)}</span>
          <span>{clock(TRACK.length)}</span>
        </div>
      </div>

      {/* transport: the big round play button between previous and next.
          Pulled up into the times' line — they sit out at the ends, clear
          of it — to keep the card short. */}
      <div className="-mt-[0.5em] flex items-center justify-center gap-[1.5em]">
        <Control label="Previous track" className="size-[1.5em] hover:text-white/70">
          <Icon name="skipPrevious" className="size-full" />
        </Control>
        <Control
          label="Play"
          className="size-[2.25em] rounded-full bg-white text-paper hover:scale-105"
        >
          <Icon name="play" className="size-[1.25em]" />
        </Control>
        <Control label="Next track" className="size-[1.5em] hover:text-white/70">
          <Icon name="skipNext" className="size-full" />
        </Control>
      </div>
    </div>
  );
}
