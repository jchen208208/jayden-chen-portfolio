"use client";

import Image from "next/image";
import {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type SyntheticEvent,
} from "react";
import { createPortal } from "react-dom";
import type { Shot } from "@/lib/site";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { markOut, peel, type PrintParts } from "./printMotion";
import { ShotPlaceholder } from "./shared";

/**
 * A frame off the About roll, lifted out as a print: it comes out of its
 * frame on the film into a big print on white paper, over the page dimmed
 * nearly to black, and goes back into the frame when it's closed (Esc, the
 * close button, or a click anywhere off it). It peels off the film like a soft
 * handkerchief (`printMotion.ts`), run across the print's layers — the
 * dimming, the paper, its white sheet, its shadow, the picture — and a
 * canvas laid over them for the handkerchief itself. Until it has landed nothing else starts: the
 * sharp picture isn't loaded, the waveform isn't fetched and the clip
 * doesn't play, so nothing competes with the motion. Meanwhile the picture
 * shows from the frame's own copy, already loaded.
 *
 * The print comes alive. A frame with a clip plays it silently on a loop in
 * the print, like a Live Photo — clicking the picture pauses it. A frame with
 * a voice note has a player under the print: its waveform fills amber as it
 * plays and the caption follows along, the word being said lit amber. The
 * intro's voice note is its clip's own sound (`voice: "clip"`): playing it
 * restarts the clip with the sound up, and once it's done the clip goes back
 * to looping silently.
 *
 * It's portalled to `body` so it sits over the desk's section view as well as
 * the stacked page. A portal still passes React events up its React parents,
 * though — so clicks and presses stop here, or one would land on the section
 * view's ground and close the whole section.
 */

/** bars in a voice note's waveform */
const BARS = 72;

/* ── waveform ───────────────────────────────────────────────────────────────── */

const peakCache = new Map<string, Promise<number[]>>();

/** the loudest moment in each of `BARS` slices of the recording, 0–1 — decoded
 *  once per file. Decoding needs no click first, unlike playing. */
function loadPeaks(src: string) {
  let peaks = peakCache.get(src);
  if (!peaks) {
    peaks = fetch(src)
      .then((r) => r.arrayBuffer())
      .then((buf) => new OfflineAudioContext(1, 1, 44100).decodeAudioData(buf))
      .then((audio) => {
        const data = audio.getChannelData(0);
        const step = Math.max(1, Math.floor(data.length / BARS));
        const raw = Array.from({ length: BARS }, (_, i) => {
          let max = 0;
          for (let j = i * step; j < (i + 1) * step && j < data.length; j++) {
            max = Math.max(max, Math.abs(data[j]));
          }
          return max;
        });
        const top = Math.max(...raw) || 1;
        return raw.map((v) => v / top);
      });
    peakCache.set(src, peaks);
  }
  return peaks;
}

function useWaveform(src: string | undefined) {
  const [peaks, setPeaks] = useState<number[] | null>(null);
  useEffect(() => {
    if (!src) return;
    let live = true;
    loadPeaks(src).then(
      (p) => live && setPeaks(p),
      () => {}, // undecodable: the bars stay flat
    );
    return () => {
      live = false;
    };
  }, [src]);
  return peaks;
}

function Waveform({ peaks, progress }: { peaks: number[] | null; progress: number }) {
  const bars = (
    <span className="flex h-full items-center justify-between">
      {Array.from({ length: BARS }, (_, i) => (
        <span
          key={i}
          className="w-[3px] rounded-full bg-current"
          style={{ height: `${Math.round((0.12 + 0.88 * (peaks?.[i] ?? 0)) * 100)}%` }}
        />
      ))}
    </span>
  );
  return (
    <span aria-hidden className="relative block h-9 min-w-0 flex-1">
      <span className="absolute inset-0 text-white/30">{bars}</span>
      <span
        className="absolute inset-0 text-[var(--glow)]"
        style={{ clipPath: `inset(0 ${(100 - progress * 100).toFixed(2)}% 0 0)` }}
      >
        {bars}
      </span>
    </span>
  );
}

/** 4.2 → "0:04" */
function clock(seconds: number) {
  const s = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/* ── caption ────────────────────────────────────────────────────────────────── */

/** The caption, followed along while its voice note plays: what's been said
 *  in white, the word being said in amber, the rest dim. Without `cues`, each
 *  word's turn comes at an even pace through the recording — by its share of
 *  the letters. At rest it simply reads. */
function Caption({
  text,
  time,
  duration,
  cues,
  following,
}: {
  text: string;
  time: number;
  duration: number;
  cues?: number[];
  following: boolean;
}) {
  const words = text.split(/\s+/);
  let now = -1;
  if (following && duration > 0) {
    let starts = cues;
    if (!starts || starts.length !== words.length) {
      const letters = words.reduce((n, w) => n + w.length, 0);
      let seen = 0;
      starts = words.map((w) => {
        const at = (seen / letters) * duration;
        seen += w.length;
        return at;
      });
    }
    starts.forEach((at, i) => {
      if (at <= time) now = i;
    });
  }
  return (
    <p className="font-mono text-base leading-relaxed text-white/85 md:text-lg">
      {words.map((word, i) => (
        <Fragment key={i}>
          <span
            className="print-word"
            data-said={!following ? undefined : i < now ? "past" : i === now ? "now" : "next"}
          >
            {word}
          </span>{" "}
        </Fragment>
      ))}
    </p>
  );
}

/* ── the print ──────────────────────────────────────────────────────────────── */

export function Print({
  shot,
  number,
  origin,
  onClosed,
}: {
  shot: Shot;
  number: number;
  /** the frame's button on the film — what it came out of, and goes back into */
  origin: HTMLElement;
  onClosed: () => void;
}) {
  const reduced = usePrefersReducedMotion();
  const backdropRef = useRef<HTMLDivElement>(null);
  const overRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const photoRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const closing = useRef(false);
  const opening = useRef<Animation[]>([]);
  // everything a motion started, here or out on the film — all of it is
  // cancelled once the print is gone, so nothing is left held in place
  const started = useRef<Animation[]>([]);
  const [leaving, setLeaving] = useState(false);
  // landed — only now does anything else start (the sharp picture, the
  // waveform, the clip), so nothing competes with the motion
  const [opened, setOpened] = useState(false);
  // the sharp picture has arrived, over the frame's own copy
  const [sharp, setSharp] = useState(false);

  const voiceIsClip = shot.voice === "clip" && !!shot.clip;
  const voiceSrc = voiceIsClip ? shot.clip : shot.voice !== "clip" ? shot.voice : undefined;
  const peaks = useWaveform(opened ? voiceSrc : undefined);
  // the clip is talking — not just looping silently (`voice: "clip"` only)
  const voiced = useRef(false);
  const [speaking, setSpeaking] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const voiceMedia = useCallback(
    () => (voiceIsClip ? videoRef.current : audioRef.current),
    [voiceIsClip],
  );

  const parts = useCallback((): PrintParts | null => {
    const backdrop = backdropRef.current;
    const over = overRef.current;
    const paper = paperRef.current;
    const sheet = sheetRef.current;
    const shadow = shadowRef.current;
    const photo = photoRef.current;
    if (!backdrop || !over || !paper || !sheet || !shadow || !photo) return null;
    const frame = origin.querySelector<HTMLElement>(".film-window") ?? origin;
    return { backdrop, over, paper, sheet, shadow, photo, origin, frame };
  }, [origin]);

  // the picture has left the film — unless the print is already on its way
  // back
  const empty = useCallback(() => {
    if (!closing.current) markOut(origin, true);
  }, [origin]);

  /** the pieces a motion brought with it (shards, a loupe…), done with */
  const clearPieces = useCallback(() => {
    rootRef.current?.querySelectorAll("[data-fx]").forEach((el) => el.remove());
  }, []);

  // come out of the frame
  useLayoutEffect(() => {
    const p = parts();
    if (!p) return;
    closeRef.current?.focus({ preventScroll: true });
    const from = p.frame.getBoundingClientRect();
    const anims =
      reduced || !from.width
        ? [p.backdrop, p.paper].map((el) =>
            el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, easing: "ease-out", fill: "both" }),
          )
        : peel({ ...p, from, to: p.photo.getBoundingClientRect(), back: false, empty });
    opening.current = anims;
    started.current = [...anims];
    let live = true;
    Promise.all(anims.map((a) => a.finished)).then(
      () => {
        // closed before it landed: its way back is under way instead
        if (!live || closing.current) return;
        clearPieces();
        setOpened(true);
      },
      () => {},
    );
    return () => {
      live = false;
      for (const a of started.current) a.cancel();
      clearPieces();
      markOut(origin, false);
    };
  }, [clearPieces, empty, origin, parts, reduced]);

  // only once it's landed does the clip start
  useEffect(() => {
    if (opened && !reduced) void videoRef.current?.play().catch(() => {});
  }, [opened, reduced]);

  // back into the frame (wherever it is now — the page may have scrolled),
  // then go. Closed before it has finished coming out, it goes back the way
  // it came from wherever it got to.
  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    setLeaving(true);
    voiceMedia()?.pause();
    const finish = () => {
      // the picture is home: the frame shows it again as the print goes
      markOut(origin, false);
      onClosed();
    };
    const settle = (anims: Animation[]) => Promise.all(anims.map((a) => a.finished)).then(finish, finish);
    const p = parts();
    if (!p) return finish();
    if (opening.current.some((a) => a.playState === "running")) {
      for (const a of opening.current) a.reverse();
      void settle(opening.current);
      return;
    }
    const from = p.frame.isConnected ? p.frame.getBoundingClientRect() : null;
    const anims =
      reduced || !from?.width
        ? [p.backdrop, p.paper].map((el) =>
            el.animate([{ opacity: 0 }], { duration: 160, easing: "ease-in", fill: "forwards" }),
          )
        : peel({ ...p, from, to: p.photo.getBoundingClientRect(), back: true, empty });
    started.current.push(...anims);
    void settle(anims);
  }, [empty, onClosed, origin, parts, reduced, voiceMedia]);

  // Esc puts the print back — listened for on `document` in the capture
  // phase, ahead of the section's own Esc (which would close everything),
  // and stopped there. Tab stays inside the print.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        close();
        return;
      }
      const root = rootRef.current;
      if (e.key !== "Tab" || !root) return;
      e.stopPropagation();
      const focusables = root.querySelectorAll<HTMLElement>("button:not([disabled])");
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (!root.contains(document.activeElement)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [close]);

  // the play head, read every frame while the voice plays — `timeupdate`
  // comes too seldom to follow words by
  useEffect(() => {
    if (!speaking) return;
    let raf = 0;
    const tick = () => {
      const media = voiceMedia();
      if (media) setTime(media.currentTime);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [speaking, voiceMedia]);

  function toggleVoice() {
    const media = voiceMedia();
    if (!media) return;
    if (speaking) {
      media.pause();
      return;
    }
    if (voiceIsClip && !voiced.current) {
      // from the top, with the sound up, once through
      voiced.current = true;
      media.currentTime = 0;
      media.loop = false;
      media.muted = false;
    }
    // a clip already looping fires no `play` of its own when it starts
    // talking, so this marks it
    media.play().then(
      () => setSpeaking(true),
      () => {},
    );
  }

  function voiceEnded() {
    setSpeaking(false);
    setTime(0);
    const video = videoRef.current;
    if (voiceIsClip && video) {
      // back to looping silently
      voiced.current = false;
      video.muted = true;
      video.loop = true;
      video.currentTime = 0;
      if (!reduced) void video.play().catch(() => {});
    }
  }

  function toggleClip() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play().catch(() => {});
    else video.pause();
  }

  const voiceEvents = {
    onLoadedMetadata: (e: SyntheticEvent<HTMLMediaElement>) =>
      setDuration(e.currentTarget.duration),
    onPlay: () => {
      if (!voiceIsClip || voiced.current) setSpeaking(true);
    },
    onPause: () => setSpeaking(false),
    onEnded: voiceEnded,
  };

  const following = speaking || time > 0;

  return createPortal(
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Frame ${number}: ${shot.label}`}
      data-lenis-prevent
      data-opened={opened || undefined}
      data-leaving={leaving || undefined}
      className="print-root no-scrollbar fixed inset-0 z-[70] overflow-y-auto overscroll-contain"
      onClick={(e) => {
        e.stopPropagation();
        if ((e.target as Element).closest("[data-print-ground]") === e.target) close();
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div ref={backdropRef} aria-hidden className="print-backdrop fixed inset-0" />
      <button
        ref={closeRef}
        type="button"
        onClick={close}
        aria-label="Put the print back"
        className="print-close fixed right-4 top-4 z-10 rounded px-2 py-1 font-mono text-xs text-white/60 ring-1 ring-inset ring-white/15 transition-colors hover:text-white"
      >
        esc ✕
      </button>
      <div
        data-print-ground
        className="relative flex min-h-full cursor-zoom-out flex-col items-center justify-center gap-6 px-4 py-16"
      >
        <div ref={paperRef} className="print-paper cursor-auto">
          <div ref={shadowRef} aria-hidden className="print-shadow" />
          <div ref={sheetRef} aria-hidden className="print-sheet" />
          <div ref={photoRef} className="print-photo relative aspect-[3/2] w-full overflow-hidden bg-black">
            {shot.image ? (
              <>
                {/* the frame's own copy, already loaded — there from the very
                    first frame — and, once the print has landed, the sharp
                    one fading in over it */}
                <Image src={shot.image} alt={opened ? "" : shot.label} fill sizes="21rem" className="object-cover" />
                {opened && (
                  <Image
                    src={shot.image}
                    alt={shot.label}
                    fill
                    sizes="(min-width: 1024px) 60rem, 90vw"
                    onLoad={() => setSharp(true)}
                    className={`object-cover transition-opacity duration-500 ${sharp ? "opacity-100" : "opacity-0"}`}
                  />
                )}
              </>
            ) : (
              <ShotPlaceholder slug={shot.slug} />
            )}
            {shot.clip && (
              <>
                <video
                  ref={videoRef}
                  src={shot.clip}
                  poster={shot.image?.src}
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  className="absolute inset-0 h-full w-full object-cover"
                  {...(voiceIsClip ? voiceEvents : {})}
                />
                <button
                  type="button"
                  onClick={toggleClip}
                  aria-label="Play or pause the clip"
                  className="absolute inset-0 cursor-pointer outline-none focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-[var(--glow)]"
                />
              </>
            )}
          </div>
        </div>

        <div className="print-meta flex w-[var(--print-w)] max-w-full cursor-auto flex-col gap-4">
          <span className="font-screen text-xl uppercase leading-none text-white/50">
            {number} ▸ {shot.label}
          </span>
          {voiceSrc && (
            <div className="flex items-center gap-4">
              {!voiceIsClip && <audio ref={audioRef} src={voiceSrc} preload="metadata" {...voiceEvents} />}
              <button
                type="button"
                onClick={toggleVoice}
                aria-label={speaking ? "Pause the voice note" : "Play the voice note"}
                className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full text-white ring-1 ring-inset ring-white/30 transition-colors hover:ring-white/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--glow)]"
              >
                <svg viewBox="0 0 16 16" aria-hidden className="size-4 fill-current">
                  {speaking ? (
                    <path d="M4 2.5h2.6v11H4zM9.4 2.5H12v11H9.4z" />
                  ) : (
                    <path d="M4.5 2.2 13.5 8l-9 5.8z" />
                  )}
                </svg>
              </button>
              <Waveform peaks={peaks} progress={duration > 0 ? time / duration : 0} />
              <span className="shrink-0 font-screen text-xl leading-none text-white/60">
                {clock(time)} / {clock(duration)}
              </span>
            </div>
          )}
          <Caption
            text={shot.caption}
            time={time}
            duration={duration}
            cues={shot.cues}
            following={following && !!voiceSrc}
          />
        </div>
      </div>
      {/* the peel's own pieces, over the print (`printMotion.ts`) */}
      <div ref={overRef} aria-hidden className="print-fx fixed inset-0" />
    </div>,
    document.body,
  );
}
