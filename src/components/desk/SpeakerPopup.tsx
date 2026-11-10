import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { getImageProps } from "next/image";
import { DESK_PX, deskUnits } from "@/lib/desk";
import { ARTWORK_PX, type Track } from "@/lib/playlist";
import ScreenMosaic from "./ScreenMosaic";

/**
 * The speaker's popup: a now-playing card in the shape of the phone's
 * lock-screen player or Spotify's — the album cover beside the song and its
 * artist, a progress bar with the time played and the song's length, and
 * previous / play / next.
 *
 * It's pixel art like the desk it stands over, on the desk's own pixel (a
 * quarter of an em in here, `--px`): a solid body with a one-pixel rim lit
 * along its top and left, its corners cut a pixel square (`.speaker-card`);
 * the cover shrunk to 14 × 14 pixels and drawn back up crisp; the words in
 * the screens' pixel face; a one-pixel progress bar that fills a pixel at a
 * time; and pixel icons on the buttons.
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
 *  out in these — and in the desk's pixels */
const COVER = 56;
const COVER_PX = COVER / DESK_PX;
const COVER_SEED = 5;
/** the cover as the image optimizer serves it, before it's shrunk to
 *  pixels: comfortably more than `COVER_PX`, so the shrink can average */
const COVER_SOURCE = 48;
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

/** the skip icons, a pixel each letter (5 × 5) */
const ICONS = {
  next: ["x...x", "xx..x", "xxx.x", "xx..x", "x...x"],
  previous: ["x...x", "x..xx", "x.xxx", "x..xx", "x...x"],
} as const;
const ICON_PATHS = Object.fromEntries(
  Object.entries(ICONS).map(([name, rows]) => [
    name,
    rows
      .flatMap((row, y) => [...row].map((c, x) => (c === "x" ? `M${x} ${y}h1v1h-1z` : "")))
      .join(""),
  ]),
) as Record<keyof typeof ICONS, string>;

/**
 * The play button is drawn finer than the rest — at half the desk's pixel,
 * so its round face and its ▶ / ❚❚ read as pixel art without turning to big
 * steps: a white disc with the symbol cut in dark. The disc's right half is
 * drawn a pixel further out (19 × 18), and the ▶ sits right of centre,
 * which reads as centred.
 */
const PLAY_W = 19;
const PLAY_H = 18;
/** a path of rows, one rectangle per run of set cells */
const rowsPath = (cells: (x: number, y: number) => boolean) => {
  let d = "";
  for (let y = 0; y < PLAY_H; y++) {
    let x = 0;
    while (x < PLAY_W) {
      if (!cells(x, y)) {
        x++;
        continue;
      }
      let n = 1;
      while (x + n < PLAY_W && cells(x + n, y)) n++;
      d += `M${x} ${y}h${n}v1h-${n}z`;
      x += n;
    }
  }
  return d;
};
/** a circle of radius 9 round (9, 9), its right half pushed out a pixel */
const PLAY_DISC = rowsPath((x, y) => {
  const cx = x + 0.5;
  const dx = cx < 9 ? cx - 9 : cx > 10 ? cx - 10 : 0;
  return dx ** 2 + (y + 0.5 - 9) ** 2 <= 8.9 ** 2;
});
/** ▶: ten rows tall from row 4, eight across from column 7; ❚❚: two bars
 *  three wide with three between, centred in the disc */
const PLAY_WIDTHS = [1, 2, 4, 6, 8, 8, 6, 4, 2, 1];
const PLAY_SYMBOL = {
  play: rowsPath((x, y) => y >= 4 && y < 14 && x >= 7 && x < 7 + PLAY_WIDTHS[y - 4]),
  pause: rowsPath((x, y) => y >= 4 && y < 14 && ((x >= 5 && x < 8) || (x >= 11 && x < 14))),
};
/** …and the ▶ nudged back half a pixel, between columns 6 and 7 */
const PLAY_NUDGE = "translate(-0.5 0)";

function PlayFace({ playing }: { playing: boolean }) {
  return (
    <svg aria-hidden viewBox={`0 0 ${PLAY_W} ${PLAY_H}`} shapeRendering="crispEdges" className="size-full">
      <path d={PLAY_DISC} fill="currentColor" />
      <path
        d={PLAY_SYMBOL[playing ? "pause" : "play"]}
        transform={playing ? undefined : PLAY_NUDGE}
        fill="var(--paper, #000)"
      />
    </svg>
  );
}

function PixelIcon({ name, className }: { name: keyof typeof ICONS; className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 5 5" shapeRendering="crispEdges" className={className}>
      <path d={ICON_PATHS[name]} fill="currentColor" />
    </svg>
  );
}

/** the album cover as pixels: it comes through the image optimizer as ever
 *  (so no visitor's browser asks Apple for it), is shrunk to `COVER_PX`
 *  square on a canvas, and the canvas is drawn back up with every pixel
 *  kept square — the desk's own pixel size */
function PixelCover({ src }: { src: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const url = getImageProps({ src, alt: "", width: COVER_SOURCE, height: COVER_SOURCE }).props.src;
  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    const img = new window.Image();
    img.onload = () => {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.clearRect(0, 0, COVER_PX, COVER_PX);
      ctx.drawImage(img, 0, 0, COVER_PX, COVER_PX);
    };
    img.src = url;
    return () => {
      img.onload = null;
    };
  }, [url]);
  return (
    <canvas
      ref={ref}
      width={COVER_PX}
      height={COVER_PX}
      aria-hidden
      className="absolute inset-0 size-full [image-rendering:pixelated]"
    />
  );
}

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
      className="speaker-card pixel-corners px-[0.75em] pb-[0.5em] pt-[0.75em] text-white"
      style={{ fontSize: deskUnits(EM), "--px": deskUnits(DESK_PX) } as CSSProperties}
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
        <div className="relative size-[3.5em] shrink-0 overflow-hidden bg-[#3a3a40]">
          {track ? (
            <PixelCover src={track.artworkUrl} />
          ) : (
            <ScreenMosaic w={COVER} h={COVER} seed={COVER_SEED} burst={null} cell={DESK_PX} />
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
              className="block truncate font-screen text-[1.5em] leading-none outline-none hover:underline"
            >
              {track.title}
            </a>
          ) : (
            <p className="truncate font-screen text-[1.5em] leading-none">Nothing playing</p>
          )}
          <p className="mt-[0.25em] truncate font-screen text-[1.25em] leading-none text-white/60">
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
          className="h-(--px) bg-[#3a3a40]"
        >
          {/* fills a whole pixel at a time (`.speaker-fill`) */}
          <div className="speaker-fill h-full bg-white" style={{ "--p": progress } as CSSProperties} />
        </div>
        <div className="mt-[0.25em] flex justify-between font-screen text-[1.125em] leading-none text-white/50">
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
          className="size-[1.25em] hover:text-white/70"
        >
          <PixelIcon name="previous" className="size-full" />
        </Control>
        <Control
          label={playing ? "Pause" : "Play"}
          disabled={empty}
          onClick={toggle}
          className="h-[2.25em] w-[2.375em] text-white enabled:hover:text-[#c8c8ce]"
        >
          <PlayFace playing={playing} />
        </Control>
        <Control
          label="Next song"
          disabled={empty}
          onClick={next}
          className="size-[1.25em] hover:text-white/70"
        >
          <PixelIcon name="next" className="size-full" />
        </Control>
      </div>
    </div>
  );
}
