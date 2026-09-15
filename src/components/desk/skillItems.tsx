import {
  SiAutodesk,
  SiBlender,
  SiC,
  SiCplusplus,
  SiDocker,
  SiFirebase,
  SiGithub,
  SiHtml5,
  SiJavascript,
  SiKicad,
  SiMysql,
  SiNextdotjs,
  SiNodedotjs,
  SiPython,
  SiReact,
  SiTailwindcss,
  SiVercel,
} from "react-icons/si";
import { FaJava } from "react-icons/fa6";
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
export const SKILLS_BOX_TITLES = ["Languages", "Tools & Frameworks", "Hardware & Design"];

export type SkillItem = {
  name: string;
  Icon: IconType;
  /** overrides the icon box's default padding — used for `SolderingIcon`,
   *  whose landscape drawing needs a lot less inset than a square brand
   *  logo to read as similarly large inside the same square tile */
  iconPadding?: string;
};

/** the actual skills inside each card, matched to `SKILLS_BOX_TITLES` by
 *  index — one array per card, each rendered as an icon tile (brand logo +
 *  name underneath) rather than a plain text chip. Soldering has no brand
 *  logo, so it uses `SolderingIcon` — the same soldering station drawn on
 *  the desk — instead of a `react-icons` glyph. */
export const SKILLS_BOX_ITEMS: SkillItem[][] = [
  [
    { name: "Python", Icon: SiPython },
    { name: "C", Icon: SiC },
    { name: "C++", Icon: SiCplusplus },
    { name: "JavaScript", Icon: SiJavascript },
    { name: "Java", Icon: FaJava },
    { name: "SQL", Icon: TbSql },
    { name: "HTML/CSS", Icon: SiHtml5 },
  ],
  [
    { name: "Git/GitHub", Icon: SiGithub },
    { name: "MySQL", Icon: SiMysql },
    { name: "Docker", Icon: SiDocker },
    { name: "Node.js", Icon: SiNodedotjs },
    { name: "React", Icon: SiReact },
    { name: "Next.js", Icon: SiNextdotjs },
    { name: "Vercel", Icon: SiVercel },
    { name: "Firebase", Icon: SiFirebase },
    { name: "Tailwind CSS", Icon: SiTailwindcss },
  ],
  [
    { name: "Soldering", Icon: SolderingIcon, iconPadding: "p-1" },
    { name: "PCB Design (KiCad)", Icon: SiKicad },
    { name: "CAD Modelling (Fusion 360)", Icon: SiAutodesk },
    { name: "3D Graphics Design", Icon: SiBlender },
  ],
];
