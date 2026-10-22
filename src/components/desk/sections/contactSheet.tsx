"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ROLL, type Shot } from "@/lib/site";
import { mulberry32 } from "@/lib/svg";
import { Print } from "./print";
import { ShotPlaceholder } from "./shared";

/**
 * About's contact sheet: the roll of film cut into strips and laid on the
 * black page, each a little askew, as if put down by hand. Every frame is an
 * amber negative of its picture. Hovering one develops it — the negative
 * fades and the print comes up out of a pale ghost into colour, like paper
 * in the developer tray — and clicking one lifts it out as a print
 * (`print.tsx`). On a phone there's no hover to wait for, so each frame
 * develops as it scrolls into view. All of the look is CSS (`.film-*` in
 * globals.css), off one switch, `--lit`.
 *
 * The film is drawn to a real 35mm frame's measurements: 38mm from one frame
 * to the next (8 perforations of 4.75mm), a 36 × 24mm picture with 1mm of base
 * either side of it. Its edge printing carries each frame's number and label.
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

/** the strips' hand-laid tilts and nudges — the same every render */
const LAY_SEED = 35;

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
  printing,
  onPrint,
}: {
  shot: Shot;
  number: number;
  printing: boolean;
  onPrint: (button: HTMLButtonElement) => void;
}) {
  return (
    <li className="film-cell">
      <button
        type="button"
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
                <Image src={shot.image} alt="" fill sizes="(min-width: 1024px) 22rem, 50vw" className="object-cover" />
              </span>
              <span className="film-neg">
                <Image src={shot.image} alt="" fill sizes="(min-width: 1024px) 22rem, 50vw" className="object-cover" />
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

export function ContactSheet({
  perStrip,
  active,
  firstIndex,
}: {
  /** frames to a strip */
  perStrip: number;
  /** false while the desk view is closed — a print left out goes away */
  active: boolean;
  /** where the strips come in the page's order of arrival (`--i`) */
  firstIndex: number;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [print, setPrint] = useState<{ index: number; button: HTMLButtonElement } | null>(null);

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
  }, [perStrip]);

  const strips: Shot[][] = [];
  for (let i = 0; i < ROLL.length; i += perStrip) strips.push(ROLL.slice(i, i + perStrip));
  const rnd = mulberry32(LAY_SEED);

  return (
    <div ref={sheetRef} className="flex flex-col gap-6">
      <p
        className="about-in film-hint font-screen text-lg uppercase leading-none tracking-wide"
        style={{ "--i": firstIndex - 1 } as CSSProperties}
      >
        <span className="film-hint-hover">▸ Hover a frame to develop it · click to print</span>
        <span className="film-hint-touch">▸ Tap a frame to print it</span>
      </p>
      <div className="flex flex-col gap-[clamp(1.25rem,3vw,2.25rem)]">
        {strips.map((strip, s) => {
          const tilt = ((rnd() * 2 - 1) * 0.45).toFixed(2);
          const shift = ((rnd() * 2 - 1) * 1.2).toFixed(2);
          return (
            <ul
              key={s}
              className="film-strip"
              style={
                {
                  "--i": firstIndex + s,
                  "--tilt": `${tilt}deg`,
                  "--shift": `${shift}%`,
                  // a short strip is a short length of film, not stretched
                  width: `${(strip.length / perStrip) * 100}%`,
                } as CSSProperties
              }
            >
              {strip.map((shot, f) => {
                const index = s * perStrip + f;
                return (
                  <Frame
                    key={shot.slug}
                    shot={shot}
                    number={index + 1}
                    printing={print?.index === index}
                    onPrint={(button) => setPrint({ index, button })}
                  />
                );
              })}
            </ul>
          );
        })}
      </div>
      {print && (
        <Print
          shot={ROLL[print.index]}
          number={print.index + 1}
          origin={print.button}
          onClosed={() => {
            setPrint(null);
            print.button.focus({ preventScroll: true });
          }}
        />
      )}
    </div>
  );
}
