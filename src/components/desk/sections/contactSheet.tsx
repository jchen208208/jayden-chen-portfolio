"use client";

import Image from "next/image";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent as ReactDragEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { ROLL, type Shot } from "@/lib/site";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { Print } from "./print";
import { ShotPlaceholder } from "./shared";

/**
 * About's roll of film: one strip right across the screen, sliding slowly
 * leftward on a loop, as if being wound through. Every frame is an amber
 * negative of its picture. Hovering one stops the film and develops the frame
 * — the negative fades and the print comes up out of a pale ghost into
 * colour, like paper in the developer tray — and clicking one lifts it out as
 * a print (`print.tsx`). On a phone there's no hover to wait for, so each
 * frame develops as it comes into view. All of the look and the slide is CSS
 * (`.film-*` in globals.css); the frames' is off one switch, `--lit`.
 *
 * The film can be wound by hand, too: press on it and drag left or right and
 * it follows, and let go mid-drag and it coasts on a little before the slow
 * drift takes over again (`useWinding`).
 *
 * The film is drawn to a real 35mm frame's measurements: 38mm from one frame
 * to the next (8 perforations of 4.75mm), a 36mm-wide picture with 1mm of base
 * either side of it — cut 4:3 rather than 35mm's 3:2, to fit the photos whole.
 * Its edge printing carries each frame's number and label.
 */

/** mm from one perforation to the next — eight to a frame */
const PITCH = 4.75;
const CELL = PITCH * 8;
const HOLE_W = 2.8;
const HOLE_H = 1.98;
/** the band of base the holes run along, either edge of the film */
const EDGE = 4.2;

/** the film stock's name, printed faintly along the top edge */
const STOCK = "JC 400";

/** frames in one pass of the loop, at least — the roll repeats until a pass
 *  runs past the edges of even a very wide screen */
const MIN_PASS = 12;

/** seconds for one frame to slide its own width — a slow, steady drift
 *  (~40px a second on a wide screen) */
const SECONDS_PER_FRAME = 9;

/** one frame's worth of perforations — a cell's are the same, so the
 *  holes run on unbroken from frame to frame along the strip. The top edge
 *  keeps room for the stock's name on every frame (`top`), printed on some,
 *  so the pictures stay in line. */
function Perforations({ top = false, stock }: { top?: boolean; stock?: string }) {
  const y = (EDGE - HOLE_H) / 2;
  return (
    <svg
      viewBox={`0 0 ${CELL} ${top ? EDGE + 1.6 : EDGE}`}
      aria-hidden
      className="film-perfs block w-full"
    >
      {Array.from({ length: 8 }, (_, k) => (
        <rect
          key={k}
          x={(k * PITCH + (PITCH - HOLE_W) / 2).toFixed(2)}
          y={y.toFixed(2)}
          width={HOLE_W}
          height={HOLE_H}
          rx={0.45}
        />
      ))}
      {stock && (
        <text x={2.2} y={EDGE + 1.15} className="film-stock">
          {stock}
        </text>
      )}
    </svg>
  );
}

function Frame({
  shot,
  number,
  clone,
  printing,
  onPrint,
}: {
  shot: Shot;
  number: number;
  /** a repeat further along the loop — clickable, but skipped by the
   *  keyboard and screen readers, which have the first of each */
  clone: boolean;
  printing: boolean;
  onPrint: (button: HTMLButtonElement) => void;
}) {
  return (
    <li className="film-cell" aria-hidden={clone || undefined}>
      <button
        type="button"
        tabIndex={clone ? -1 : undefined}
        // a click mustn't leave focus inside the hidden repeat
        onMouseDown={clone ? (e) => e.preventDefault() : undefined}
        data-printing={printing || undefined}
        onClick={(e) => onPrint(e.currentTarget)}
        aria-label={`Print frame ${number}: ${shot.label}`}
        className="film-frame"
      >
        <Perforations top stock={number % 2 === 1 ? STOCK : undefined} />
        <span className="film-window">
          {/* the negative, and under it the print that develops */}
          {shot.image ? (
            <>
              <span className="film-pos">
                <Image src={shot.image} alt="" fill sizes="21rem" className="object-cover" />
              </span>
              <span className="film-neg">
                <Image src={shot.image} alt="" fill sizes="21rem" className="object-cover" />
              </span>
            </>
          ) : (
            <>
              <span className="film-pos">
                <ShotPlaceholder slug={shot.slug} />
              </span>
              {/* nothing on it yet: a frame never exposed is clear base */}
              <span className="film-neg film-unexposed" />
            </>
          )}
        </span>
        <span aria-hidden className="film-edge font-screen uppercase leading-none">
          <span className="film-edge-label">
            {number} ▸ {shot.label}
            {(shot.voice || shot.clip) && (
              <span className="film-edge-marks">
                {shot.clip && "▶"}
                {shot.voice && "♪"}
              </span>
            )}
          </span>
          <span className="film-edge-half">{number}A</span>
        </span>
        <Perforations />
      </button>
    </li>
  );
}

/** a frame lifted out as a print: which one in the roll, which of its
 *  repeats along the film, and that repeat's button */
type PrintOut = { index: number; key: string; button: HTMLButtonElement };

/** px a press has to move before it's winding the film rather than a click */
const DRAG_SLOP = 6;
/** a fling's speed left after each millisecond — it coasts a short way */
const FRICTION = 0.995;
/** the fastest a fling sets off, px per ms — it coasts at most ~600px */
const MAX_FLING = 3;

/**
 * Winding the film by hand. The slide is a CSS animation (`film-run`), so
 * dragging moves that animation's own clock: the film goes wherever the
 * pointer takes it, the loop stays seamless, and when it's let go the drift
 * carries on from there. A drag that ends moving keeps going and slows to a
 * stop. While the film is being wound (`winding`) it holds still of its own
 * accord, and the click that ends a drag doesn't print the frame it ended
 * on. With reduced motion the film stands still and scrolls instead, so a
 * drag scrolls it, and doesn't coast.
 */
function useWinding() {
  const reelRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);
  const reduced = usePrefersReducedMotion();
  const [winding, setWinding] = useState(false);
  const drag = useRef<{ id: number; startX: number; x: number; t: number; v: number; moved: boolean } | null>(
    null,
  );
  // a drag just ended: the click that comes with letting go isn't a print
  const dragged = useRef(false);
  const fling = useRef(0);

  useEffect(() => () => cancelAnimationFrame(fling.current), []);

  /** moves the film `dx` px — to the right if positive */
  function wind(dx: number) {
    const reel = reelRef.current;
    const track = trackRef.current;
    if (!reel || !track) return;
    const run = track
      .getAnimations()
      .find((a): a is CSSAnimation => a instanceof CSSAnimation && a.animationName === "film-run");
    if (!run) {
      reel.scrollLeft -= dx;
      return;
    }
    const span = Number(run.effect?.getComputedTiming().duration);
    // one pass — half the track — is one run of the animation
    const pass = track.offsetWidth / 2;
    if (!span || !pass) return;
    const t = Number(run.currentTime ?? 0) - (dx / pass) * span;
    run.currentTime = ((t % span) + span) % span;
  }

  function coast(v0: number) {
    if (reduced || Math.abs(v0) < 0.05) {
      setWinding(false);
      return;
    }
    let v = Math.max(-MAX_FLING, Math.min(MAX_FLING, v0));
    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min(32, now - last);
      last = now;
      wind(v * dt);
      v *= FRICTION ** dt;
      if (Math.abs(v) > 0.02) fling.current = requestAnimationFrame(step);
      else setWinding(false);
    };
    fling.current = requestAnimationFrame(step);
  }

  function end(e: ReactPointerEvent, cancelled: boolean) {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    if (!d.moved) return;
    if (cancelled) {
      setWinding(false);
      return;
    }
    // the click that follows, if one does, is the drag's — not a print
    dragged.current = true;
    window.setTimeout(() => (dragged.current = false), 0);
    // held still before letting go: no fling
    coast(e.timeStamp - d.t > 80 ? 0 : d.v);
  }

  const handlers = {
    onPointerDown(e: ReactPointerEvent) {
      if (e.button !== 0) return;
      cancelAnimationFrame(fling.current);
      dragged.current = false;
      drag.current = { id: e.pointerId, startX: e.clientX, x: e.clientX, t: e.timeStamp, v: 0, moved: false };
    },
    onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
      const d = drag.current;
      if (!d || d.id !== e.pointerId) return;
      if (!d.moved) {
        if (Math.abs(e.clientX - d.startX) < DRAG_SLOP) return;
        d.moved = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        setWinding(true);
      }
      const dx = e.clientX - d.x;
      const dt = e.timeStamp - d.t;
      wind(dx);
      if (dt > 0) d.v = 0.7 * (dx / dt) + 0.3 * d.v;
      d.x = e.clientX;
      d.t = e.timeStamp;
    },
    onPointerUp: (e: ReactPointerEvent) => end(e, false),
    onPointerCancel: (e: ReactPointerEvent) => end(e, true),
    onClickCapture(e: ReactMouseEvent) {
      if (!dragged.current) return;
      dragged.current = false;
      e.stopPropagation();
      e.preventDefault();
    },
    // a picture mustn't be picked up and dragged off as an image
    onDragStart: (e: ReactDragEvent) => e.preventDefault(),
  };

  return { reelRef, trackRef, winding, handlers };
}

export function ContactSheet({
  active,
  firstIndex,
}: {
  /** false while the desk view is closed — a print left out goes away, and
   *  the film stops */
  active: boolean;
  /** where the roll comes in the page's order of arrival (`--i`) */
  firstIndex: number;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [print, setPrint] = useState<PrintOut | null>(null);
  const { reelRef, trackRef, winding, handlers } = useWinding();

  // the desk view closing takes any print with it
  if (!active && print) setPrint(null);

  // no hover on a phone: a frame develops once it's mostly in view
  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet || !window.matchMedia("(hover: none)").matches) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.developed = "";
          io.unobserve(entry.target);
        }
      },
      { threshold: 0.6 },
    );
    sheet.querySelectorAll(".film-frame").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // one pass of the loop is the roll as many times over as it takes; the
  // track holds two passes, so sliding by one lands exactly where it began
  const pass = Array.from({ length: Math.ceil(MIN_PASS / ROLL.length) }, () => ROLL).flat();

  return (
    <div ref={sheetRef} className="flex flex-col gap-6">
      <p
        className="about-in film-hint text-center font-screen text-lg uppercase leading-none tracking-wide"
        style={{ "--i": firstIndex - 1 } as CSSProperties}
      >
        <span className="film-hint-hover">▸ Hover a frame to develop it · click to print · drag to wind</span>
        <span className="film-hint-touch">▸ Tap a frame to print it · drag to wind</span>
      </p>
      <div
        ref={reelRef}
        {...handlers}
        className="about-in film-reel"
        data-paused={!active || print !== null || undefined}
        data-winding={winding || undefined}
        style={{ "--i": firstIndex } as CSSProperties}
      >
        <ul
          ref={trackRef}
          className="film-track"
          style={{ "--run": `${pass.length * SECONDS_PER_FRAME}s` } as CSSProperties}
        >
          {[0, 1].map((half) =>
            pass.map((shot, j) => {
              const index = j % ROLL.length;
              const key = `${half}-${j}`;
              return (
                <Frame
                  key={key}
                  shot={shot}
                  number={index + 1}
                  clone={half > 0 || j >= ROLL.length}
                  printing={print?.key === key}
                  onPrint={(button) => setPrint({ index, key, button })}
                />
              );
            }),
          )}
        </ul>
      </div>
      {print && (
        <Print
          shot={ROLL[print.index]}
          number={print.index + 1}
          origin={print.button}
          onClosed={() => {
            setPrint(null);
            // back to the frame it came from, unless that's a repeat
            if (print.button.tabIndex >= 0) print.button.focus({ preventScroll: true });
          }}
        />
      )}
    </div>
  );
}
