import {
  SiAutodesk,
  SiC,
  SiCplusplus,
  SiGithub,
  SiHtml5,
  SiJavascript,
  SiKicad,
  SiNextdotjs,
  SiNumpy,
  SiPostgresql,
  SiPython,
  SiPytorch,
  SiSupabase,
} from "react-icons/si";
import { TbSql } from "react-icons/tb";
import type { IconBaseProps, IconType } from "react-icons";
import SolderingStation, { SOLDERING_BOUNDS } from "./SolderingStation";

/**
 * The skills list, shared by the opened Skills section (`SkillsCard` in
 * `DeskScene`) and the icon strip scrolling across the laptop screen on the
 * desk (`LaptopSkillsScreen`) — one source, so the preview always shows
 * exactly what clicking opens.
 */

/** the desk's soldering station (`SolderingStation`, shared with `DeskSvg`)
 *  standing alone as a skill icon, framed tight by its own bounds. The
 *  card interior is the overlay's page-coloured ground, so the drawing's
 *  opaque `--paper` fills blend in exactly as they do on the desk. Takes
 *  react-icons' props (incl. `size`) so it's interchangeable with them. */
const SOLDERING_ICON_STROKE = 5.5;
export function SolderingIcon({ className, size, title, color, ...rest }: IconBaseProps) {
  const b = SOLDERING_BOUNDS;
  return (
    <svg
      viewBox={`${b.x} ${b.y} ${b.w} ${b.h}`}
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth={SOLDERING_ICON_STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      color={color}
      {...rest}
      {...(size !== undefined && { width: size, height: size })}
    >
      {title && <title>{title}</title>}
      <SolderingStation
        ink="currentColor"
        paper="var(--paper, #000)"
        strokeWidth={SOLDERING_ICON_STROKE}
      />
    </svg>
  );
}

/** one subtitle per card, left to right */
export const SKILLS_BOX_TITLES = ["Languages", "Frameworks & Tools", "Hardware & Design"];

export type SkillItem = {
  name: string;
  Icon: IconType;
  /** the icon's inset inside its tile, as a fraction of the tile — tiles
   *  scale with the card, so the padding has to as well. Overridden for
   *  `SolderingIcon`, whose landscape drawing needs far less inset than a
   *  square brand logo to read as similarly large. Default 0.18. */
  iconInset?: number;
  /** the logo's brand colour — icons are screen content, so they're lit in
   *  colour (see the colour rule at the top of globals.css). Lightened where
   *  the real brand colour is too dark to read on black; left out for brands
   *  that are black themselves, which stay ink. */
  color?: string;
};

/** the actual skills inside each card, matched to `SKILLS_BOX_TITLES` by
 *  index — one array per card, each rendered as an icon tile (brand logo +
 *  name underneath) rather than a plain text chip. Soldering has no brand
 *  logo, so it uses `SolderingIcon` — the same soldering station drawn on
 *  the desk — instead of a `react-icons` glyph. */
export const SKILLS_BOX_ITEMS: SkillItem[][] = [
  [
    { name: "Python", Icon: SiPython, color: "#4b8bbe" },
    { name: "C", Icon: SiC, color: "#a8b9cc" },
    { name: "C++", Icon: SiCplusplus, color: "#659ad2" },
    { name: "JavaScript", Icon: SiJavascript, color: "#f7df1e" },
    { name: "SQL", Icon: TbSql, color: "#f29111" },
    { name: "HTML/CSS", Icon: SiHtml5, color: "#e34f26" },
  ],
  [
    { name: "Git/GitHub", Icon: SiGithub },
    { name: "Next.js", Icon: SiNextdotjs },
    { name: "PostgreSQL", Icon: SiPostgresql, color: "#6b8fe8" },
    { name: "Supabase", Icon: SiSupabase, color: "#3ecf8e" },
    { name: "PyTorch", Icon: SiPytorch, color: "#ee4c2c" },
    { name: "NumPy", Icon: SiNumpy, color: "#4dabcf" },
  ],
  [
    { name: "Soldering", Icon: SolderingIcon, iconInset: 0.05 },
    { name: "PCB Design (KiCad)", Icon: SiKicad, color: "#6a82e0" },
    { name: "CAD Modelling (Fusion)", Icon: SiAutodesk, color: "#f58220" },
  ],
];
