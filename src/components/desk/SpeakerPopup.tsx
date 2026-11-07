import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { deskUnits } from "@/lib/desk";
import { ARTWORK_PX, type Track } from "@/lib/playlist";
import { Icon } from "@/components/site/icons";
import ScreenMosaic from "./ScreenMosaic";

/**
 * The speaker's popup: a now-playing card in the shape of the phone's
 * lock-screen player or Spotify's — the album cover beside the song and its
 * artist, a progress bar with the time played and the song's length, and
 * previous / play / next — on frosted glass, so the desk behind it blurs
 * through.
 *
 * It plays the playlist (`lib/playlist`) as Apple's 30-second previews, one
 * after another, round and round. The `<audio>` lives here, and the popup is
 * only ever hidden, never unmounted, so a song plays on after the pointer
 * leaves. Nothing is asked of Apple until play is pressed (`preload="none"`),
 * and the covers come through Next's image optimizer, so a visitor who never
 * presses play never contacts Apple at all. The song also goes to the
 * browser's Media Session, so it shows — with working controls — on the
 * visitor's lock screen and media keys.
 *
 * Everything inside is sized in em off one font size given in desk units,
 * so the whole card scales with the desk like everything drawn on it.
 */

/** 1em inside the card, in desk units */
const EM = 16;
/** the cover's side, in desk units (3.5em) — the stand-in mosaic is laid
 *  out in these */
const COVER = 56;
const COVER_SEED = 5;
/** a preview's length, in s, until its audio says exactly */
const PREVIEW_S = 30;
/** previous, pressed more than this far into a song, restarts it — as on a
 *  phone */
const RESTART_AFTER_S = 3;

/** seconds → m:ss */
const clock = (s: number) => {
  const whole = Math.floor(s);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
};

/** one transport button. Like the desk's other controls, a press doesn't
 *  take focus — focusing inside the sticky, transformed desk can make some
 *  browsers snap-scroll the page (see the screen buttons in DeskScene). */
function Control({
  label,
  className,
  disabled,
  onClick,
  children,
}: {
  label: string;
  className: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      onMouseDown={(e) => e.preventDefault()}
      className={`flex shrink-0 cursor-pointer items-center justify-center outline-none transition disabled:cursor-default disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
}

export default function SpeakerPopup({ tracks }: { tracks: Track[] }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(PREVIEW_S);
  // set when a skip happens mid-song: the next one starts playing once it's in
  const resume = useRef(false);
  const track = tracks[index] as Track | undefined;
  const empty = !track;

  const play = useCallback(() => {
    // refused (no network, or a browser that wants a press first): show it
    // as stopped rather than leave the button saying pause
    audioRef.current?.play().catch(() => setPlaying(false));
  }, []);
  const pause = useCallback(() => audioRef.current?.pause(), []);
  const toggle = useCallback(() => {
    if (audioRef.current?.paused) play();
    else pause();
  }, [play, pause]);

  /** step through the playlist, wrapping at either end */
  const skip = useCallback(
    (step: number, keepPlaying: boolean) => {
      const audio = audioRef.current;
      if (!audio || tracks.length === 0) return;
      setElapsed(0);
      setDuration(PREVIEW_S);
      if (tracks.length === 1) {
        // nowhere else to go: start this one again
        audio.currentTime = 0;
        if (keepPlaying) play();
        return;
      }
      resume.current = keepPlaying;
      setIndex((i) => (i + step + tracks.length) % tracks.length);
    },
    [tracks.length, play],
  );
  const next = useCallback(() => skip(1, !audioRef.current?.paused), [skip]);
  const previous = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audio.currentTime > RESTART_AFTER_S) {
      audio.currentTime = 0;
      return;
    }
    skip(-1, !audio?.paused);
  }, [skip]);

  // the new song's source is in place by now: carry on if the last was playing
  useEffect(() => {
    if (!resume.current) return;
    resume.current = false;
    play();
  }, [index, play]);

  // the lock screen / media keys: what's playing…
  useEffect(() => {
    if (!track || !("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist,
      artwork: [{ src: track.artworkUrl, sizes: `${ARTWORK_PX}x${ARTWORK_PX}`, type: "image/jpeg" }],
    });
  }, [track]);
  // …and its controls
  useEffect(() => {
    if (empty || !("mediaSession" in navigator)) return;
    const session = navigator.mediaSession;
    const actions: [MediaSessionAction, () => void][] = [
      ["play", play],
      ["pause", pause],
      ["previoustrack", previous],
      ["nexttrack", next],
    ];
    for (const [action, handler] of actions) {
      try {
        session.setActionHandler(action, handler);
      } catch {
        // a browser without this action just doesn't get it
      }
    }
    return () => {
      for (const [action] of actions) {
        try {
          session.setActionHandler(action, null);
        } catch {}
      }
    };
  }, [empty, play, pause, previous, next]);

  const progress = Math.min(1, elapsed / duration);

  return (
    <div
      className="rounded-[1em] border border-white/10 bg-white/8 px-[0.875em] pb-[0.625em] pt-[0.875em] text-white backdrop-blur-md"
      style={{ fontSize: deskUnits(EM) }}
    >
      <audio
        ref={audioRef}
        src={track?.previewUrl}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setElapsed(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration;
          if (Number.isFinite(d) && d > 0) setDuration(d);
        }}
        onEnded={() => skip(1, true)}
      />

      {/* the song: its cover beside its title and artist. The title links
          to the song on Apple Music, whose previews these are. */}
      <div className="flex items-center gap-[0.75em]">
        <div className="relative size-[3.5em] shrink-0 overflow-hidden rounded-[0.375em] bg-white/10">
          {track ? (
            <Image src={track.artworkUrl} alt="" fill sizes="96px" className="object-cover" />
          ) : (
            <ScreenMosaic w={COVER} h={COVER} seed={COVER_SEED} burst={null} />
          )}
        </div>
        <div className="min-w-0">
          {track ? (
            <a
              href={track.pageUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${track.title} on Apple Music`}
              onMouseDown={(e) => e.preventDefault()}
              className="block truncate text-[1.0625em] font-semibold leading-snug outline-none hover:underline"
            >
              {track.title}
            </a>
          ) : (
            <p className="truncate text-[1.0625em] font-semibold leading-snug">Nothing playing</p>
          )}
          <p className="truncate text-[0.9375em] leading-snug text-white/60">
            {track ? track.artist : "Songs couldn't load"}
          </p>
        </div>
      </div>

      {/* how far in: the bar, then the time played and the preview's length */}
      <div className="mt-[0.75em]">
        <div
          role="progressbar"
          aria-label="Song progress"
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.floor(elapsed)}
          className="h-[0.25em] overflow-hidden rounded-full bg-white/20"
        >
          {/* `timeupdate` only fires every ~¼s, so while playing the fill
              glides between updates instead of stepping */}
          <div
            className="h-full rounded-full bg-white"
            style={{
              width: `${progress * 100}%`,
              transition: playing ? "width 250ms linear" : "none",
            }}
          />
        </div>
        <div className="mt-[0.25em] flex justify-between text-[0.6875em] tabular-nums text-white/50">
          <span>{clock(elapsed)}</span>
          <span>{clock(duration)}</span>
        </div>
      </div>

      {/* transport: the big round play button between previous and next.
          Pulled up into the times' line — they sit out at the ends, clear
          of it — to keep the card short. */}
      <div className="-mt-[0.5em] flex items-center justify-center gap-[1.5em]">
        <Control
          label="Previous song"
          disabled={empty}
          onClick={previous}
          className="size-[1.5em] hover:text-white/70"
        >
          <Icon name="skipPrevious" className="size-full" />
        </Control>
        <Control
          label={playing ? "Pause" : "Play"}
          disabled={empty}
          onClick={toggle}
          className="size-[2.25em] rounded-full bg-white text-paper enabled:hover:scale-105"
        >
          <Icon name={playing ? "pause" : "play"} className="size-[1.25em]" />
        </Control>
        <Control
          label="Next song"
          disabled={empty}
          onClick={next}
          className="size-[1.5em] hover:text-white/70"
        >
          <Icon name="skipNext" className="size-full" />
        </Control>
      </div>
    </div>
  );
}
