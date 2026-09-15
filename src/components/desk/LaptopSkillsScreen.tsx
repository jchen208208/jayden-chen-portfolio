"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";
import { SKILLS_BOX_ITEMS } from "./skillItems";

/**
 * What the laptop (screen 2) shows while it sits on the desk, styled like a
 * terminal prompt:
 *
 *      SKILLS▌
 *    ‹ 🐍 ⚛ 🐳 ⎇ ▲ ›
 *
 * "SKILLS" in the site's monospace (JetBrains Mono) with a blinking ▌ block
 * cursor after it, and underneath, every skill icon from the opened section
 * scrolling slowly left between a pair of ‹ › chevrons — so the screen reads
 * as switched on, says what's inside, and still names the section plainly.
 *
 * Everything is in desk viewBox units and drawn inside `DeskSvg`'s outer
 * `<g>`. Motion lives in globals.css (`.skills-strip-track`,
 * `.skills-caret`), which also brightens the strip and holds the cursor
 * steady while the screen's click target is hovered, and stops both under
 * `prefers-reduced-motion`.
 */

const INK = "var(--ink, #f4f6f8)";
const MONO = "var(--font-mono), ui-monospace, monospace";

/** the laptop's glass — must track `Screen x={602} y={300} w={150} h={90}
 *  inset={9}` in `DeskSvg` (and `SCREENS` in `DeskScene`) */
const GLASS = { x: 611, y: 309, w: 132, h: 72 };
const CENTER_X = GLASS.x + GLASS.w / 2;

/** "SKILLS", set on its alphabetic baseline */
const LABEL_BASELINE = 338;
const LABEL_SIZE = 16;

/** ▌ — a left-half block: half a monospace cell wide (cells are 0.6em),
 *  spanning the line from just above the caps to just below the baseline,
 *  the way a terminal's block cursor fills its row */
const CURSOR_W = LABEL_SIZE * 0.3;
const CURSOR_TOP = LABEL_BASELINE - LABEL_SIZE * 0.86;
const CURSOR_BOTTOM = LABEL_BASELINE + LABEL_SIZE * 0.22;

/** icon row: square icons between ‹ and › */
const STRIP_CENTER_Y = 358;
const ICON_SIZE = 14;
const ICON_GAP = 10;
const ICON_PITCH = ICON_SIZE + ICON_GAP;
const CHEVRON_SIZE = 16;
const CHEVRON_L_X = GLASS.x + 9;
const CHEVRON_R_X = GLASS.x + GLASS.w - 9;
/** the window the icons scroll through, just inside the chevrons */
const WINDOW_L = CHEVRON_L_X + 7;
const WINDOW_R = CHEVRON_R_X - 7;

const ICONS = SKILLS_BOX_ITEMS.flat();
/** one full pass of the list — the track is drawn twice and slides left by
 *  exactly this much, so the loop's restart lands on an identical frame */
const LOOP_W = ICONS.length * ICON_PITCH;

export default function LaptopSkillsScreen() {
  const fadeId = useId();
  const labelRef = useRef<SVGTextElement>(null);
  // width of "SKILLS" as actually rendered — the cursor sits right after it,
  // and the font's metrics are only known once it's loaded
  const [labelW, setLabelW] = useState<number | null>(null);

  useLayoutEffect(() => {
    let cancelled = false;
    const measure = () => {
      if (!cancelled && labelRef.current) setLabelW(labelRef.current.getComputedTextLength());
    };
    measure();
    document.fonts?.ready.then(measure);
    return () => {
      cancelled = true;
    };
  }, []);

  // label + cursor are centred as one unit
  const labelX = CENTER_X - CURSOR_W / 2;

  const chevron = (x: number, glyph: string) => (
    <text
      x={x}
      y={STRIP_CENTER_Y}
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={CHEVRON_SIZE}
      fontFamily={MONO}
      fill={INK}
      stroke="none"
    >
      {glyph}
    </text>
  );

  return (
    <g>
      <defs>
        {/* soft fade at both ends of the window, so icons drift out from
            behind one chevron and into the other instead of being cut off */}
        <linearGradient
          id={`${fadeId}-grad`}
          gradientUnits="userSpaceOnUse"
          x1={WINDOW_L}
          x2={WINDOW_R}
          y1={0}
          y2={0}
        >
          <stop offset="0" stopColor="#000" />
          <stop offset="0.18" stopColor="#fff" />
          <stop offset="0.82" stopColor="#fff" />
          <stop offset="1" stopColor="#000" />
        </linearGradient>
        <mask id={`${fadeId}-mask`} maskUnits="userSpaceOnUse">
          <rect
            x={WINDOW_L}
            y={GLASS.y}
            width={WINDOW_R - WINDOW_L}
            height={GLASS.h}
            fill={`url(#${fadeId}-grad)`}
            stroke="none"
          />
        </mask>
      </defs>

      <text
        ref={labelRef}
        x={labelX}
        y={LABEL_BASELINE}
        textAnchor="middle"
        fontSize={LABEL_SIZE}
        fontFamily={MONO}
        fontWeight={600}
        fill={INK}
        stroke="none"
      >
        SKILLS
      </text>
      {labelW !== null && (
        <rect
          className="skills-caret"
          x={labelX + labelW / 2}
          y={CURSOR_TOP}
          width={CURSOR_W}
          height={CURSOR_BOTTOM - CURSOR_TOP}
          fill={INK}
          stroke="none"
        />
      )}

      <g className="skills-strip" style={{ color: INK }}>
        {chevron(CHEVRON_L_X, "‹")}
        {chevron(CHEVRON_R_X, "›")}
        <g mask={`url(#${fadeId}-mask)`}>
          <g
            className="skills-strip-track"
            style={{ ["--skills-strip-loop" as string]: `-${LOOP_W}px` }}
          >
            {[0, 1].map((pass) =>
              ICONS.map(({ name, Icon }, i) => (
                <Icon
                  key={`${pass}-${name}`}
                  x={WINDOW_L + ICON_GAP / 2 + (pass * ICONS.length + i) * ICON_PITCH}
                  y={STRIP_CENTER_Y - ICON_SIZE / 2}
                  size={ICON_SIZE}
                  aria-hidden
                />
              )),
            )}
          </g>
        </g>
      </g>
    </g>
  );
}
