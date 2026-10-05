import type { StaticImageData } from "next/image";
import type { IconType } from "react-icons";
import { SiKicad } from "react-icons/si";
import { TbSql } from "react-icons/tb";
import cLogo from "@/assets/skills/logos/c.svg";
import cppLogo from "@/assets/skills/logos/cplusplus.svg";
import fusionLogo from "@/assets/skills/logos/fusion.svg";
import githubLogo from "@/assets/skills/logos/github.svg";
import html5Logo from "@/assets/skills/logos/html5.svg";
import jsLogo from "@/assets/skills/logos/javascript.svg";
import nextLogo from "@/assets/skills/logos/nextjs.svg";
import numpyLogo from "@/assets/skills/logos/numpy.svg";
import postgresLogo from "@/assets/skills/logos/postgresql.svg";
import pythonLogo from "@/assets/skills/logos/python.svg";
import pytorchLogo from "@/assets/skills/logos/pytorch.svg";
import supabaseLogo from "@/assets/skills/logos/supabase.svg";
import piPhoto from "@/assets/skills/photos/raspberry-pi.webp";
import ironPhoto from "@/assets/skills/photos/soldering-iron.webp";

/**
 * The skills behind the opened Skills section (`sections/skills.tsx`), where
 * each one is a draggable die-cut sticker round its group's label.
 *
 * Stickers carry each logo in its own colours — the full-colour originals
 * from Devicon (MIT, `assets/skills/logos`) — or, for hardware, a photo cut
 * out of its background (`assets/skills/photos`):
 *  - soldering iron: "SH72 soldering iron with pen and ruler for scale.jpg",
 *    Retired electrician, Wikimedia Commons, CC0 (cropped to the iron)
 *  - Raspberry Pi: "Raspberry-Pi-2-Bare-BR.jpg", Evan-Amos, Wikimedia
 *    Commons, public domain
 * KiCad isn't in Devicon and SQL has no logo of its own, so those two are
 * single-colour glyphs in a brand colour.
 */

/** one label per group of stickers */
export const SKILLS_BOX_TITLES = ["Languages", "Frameworks & Tools", "Hardware & Design"];

/** what's printed on a sticker: an image file (logo or photo), or a glyph in
 *  one colour */
export type StickerArt = { image: StaticImageData } | { Icon: IconType; color: string };

export type SkillItem = {
  name: string;
  art: StickerArt;
  /** the sticker's width as a multiple of a standard (logo) sticker — photos
   *  run bigger. Its height follows the art's own proportions. Default 1. */
  scale?: number;
  /** a fixed tilt (deg), instead of the small random one — the long, thin
   *  soldering iron lies diagonally */
  tilt?: number;
};

// SVG imports are typed loosely by Next (so SVG-as-component plugins don't
// clash) — they're static images here
const logo = (m: unknown) => ({ image: m as StaticImageData });

/** the skills in each group, matched to `SKILLS_BOX_TITLES` by index */
export const SKILLS_BOX_ITEMS: SkillItem[][] = [
  [
    { name: "Python", art: logo(pythonLogo) },
    { name: "C", art: logo(cLogo) },
    { name: "C++", art: logo(cppLogo) },
    { name: "JavaScript", art: logo(jsLogo) },
    { name: "SQL", art: { Icon: TbSql, color: "#e48e00" } },
    { name: "HTML/CSS", art: logo(html5Logo) },
  ],
  [
    { name: "Git/GitHub", art: logo(githubLogo) },
    { name: "Next.js", art: logo(nextLogo) },
    { name: "PostgreSQL", art: logo(postgresLogo) },
    { name: "Supabase", art: logo(supabaseLogo) },
    { name: "PyTorch", art: logo(pytorchLogo) },
    { name: "NumPy", art: logo(numpyLogo) },
  ],
  [
    { name: "Soldering", art: { image: ironPhoto }, scale: 3, tilt: -32 },
    { name: "Raspberry Pi", art: { image: piPhoto }, scale: 1.9 },
    { name: "PCB Design (KiCad)", art: { Icon: SiKicad, color: "#314cb0" } },
    { name: "CAD Modelling (Fusion)", art: logo(fusionLogo) },
  ],
];
