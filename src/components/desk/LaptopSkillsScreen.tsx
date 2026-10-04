"use client";

import { useId } from "react";
import { SKILLS_GLASS_LOCAL } from "@/lib/desk";
import { SKILLS_BOX_ITEMS } from "./skillItems";

/**
 * What the laptop (screen 2) shows while it sits on the desk:
 *
 *    ‹ 🐍 ⚛ 🐳 ⎇ ▲ ›
 *
 * Every skill icon from the opened section scrolls slowly left between a
 * pair of ‹ › chevrons, centred on the glass — so the screen reads as
 * switched on and shows what's inside. (Its name is on the neon sign above
 * it, `NeonSigns`.)
 *
 * Everything is in desk viewBox units and drawn inside `DeskSvg`'s outer
 * `<g>`. Motion lives in globals.css (`.skills-strip-track`), which also
 * brightens the strip while the screen's click target is hovered, and stops
 * it under `prefers-reduced-motion`.
 */

const INK = "var(--ink, #f4f6f8)";
const MONO = "var(--font-mono), ui-monospace, monospace";

/** The laptop's glass at its ORIGINAL, unscaled coordinates: `DeskSvg` wraps
 *  this whole laptop in one `LAPTOP1_TRANSFORM`, so everything here is scaled
 *  up along with the bezel around it. */
const GLASS = SKILLS_GLASS_LOCAL;

/** icon row: square icons between ‹ and ›, centred on the glass */
const STRIP_CENTER_Y = GLASS.y + GLASS.h / 2;
const ICON_SIZE = 18;
const ICON_GAP = 12;
const ICON_PITCH = ICON_SIZE + ICON_GAP;
const CHEVRON_SIZE = 20;
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
    <g className="screen-light" data-light="skills">
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
