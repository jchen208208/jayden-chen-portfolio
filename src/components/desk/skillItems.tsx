import {
  SiC,
  SiCplusplus,
  SiGithub,
  SiHtml5,
  SiJavascript,
  SiNextdotjs,
  SiNumpy,
  SiPostgresql,
  SiPython,
  SiPytorch,
  SiSupabase,
} from "react-icons/si";
import { TbSql } from "react-icons/tb";
import type { IconType } from "react-icons";

/**
 * The skills behind the opened Skills section (`sections/skills.tsx`) — one
 * list per card, matched to `SKILLS_BOX_TITLES` by position.
 */

/** one subtitle per card, left to right */
export const SKILLS_BOX_TITLES = ["Languages", "Frameworks & Tools", "Hardware & Design"];

type SkillBase = {
  name: string;
  /** how this skill is spelled in `PROJECTS[].tags` / `EXPERIENCE[].stack` —
   *  the hover caption's "used in" comes from these, so a skill nobody lists
   *  simply has no caption */
  match: string[];
  /** places it is used that aren't in the résumé data (this very site) */
  extra?: string[];
};

/* ── languages ─────────────────────────────────────────────────────────────── */

/** a span of code and how it's coloured: keyword and string take the glow,
 *  plain is ink, dim is ink-faint (the same rule as the desk's code screen) */
export type Tone = "k" | "s" | "p" | "d";
export type Seg = [text: string, tone: Tone];

export type LanguageItem = SkillBase & {
  Icon: IconType;
  /** the typed file's name */
  file: string;
  /** at most four lines, each short enough to fit the narrowest card */
  lines: Seg[][];
};

export const LANGUAGES: LanguageItem[] = [
  {
    name: "Python",
    Icon: SiPython,
    match: ["Python"],
    file: "main.py",
    lines: [
      [["def", "k"], [" greet(name):", "p"]],
      [["    return", "k"], [" f", "p"], ['"hello, {name}"', "s"]],
      [["print(greet(", "p"], ['"world"', "s"], ["))", "p"]],
    ],
  },
  {
    name: "C",
    Icon: SiC,
    match: ["C"],
    file: "main.c",
    lines: [
      [["#include", "k"], [" <stdio.h>", "s"]],
      [["int", "k"], [" main(", "p"], ["void", "k"], [") {", "p"]],
      [["    puts(", "p"], ['"hello"', "s"], [");", "p"]],
      [["}", "p"]],
    ],
  },
  {
    name: "C++",
    Icon: SiCplusplus,
    match: ["C++", "Embedded C++"],
    file: "main.cpp",
    lines: [
      [["#include", "k"], [" <iostream>", "s"]],
      [["int", "k"], [" main() {", "p"]],
      [["    std::cout << ", "p"], ['"hello\\n"', "s"], [";", "p"]],
      [["}", "p"]],
    ],
  },
  {
    name: "JavaScript",
    Icon: SiJavascript,
    match: ["JavaScript"],
    file: "main.js",
    lines: [
      [["const", "k"], [" greet = (name) =>", "p"]],
      [["  ", "p"], ["`hello, ${name}`", "s"], [";", "p"]],
      [["console.log(greet(", "p"], ['"world"', "s"], ["));", "p"]],
    ],
  },
  {
    name: "SQL",
    Icon: TbSql,
    match: ["SQL"],
    file: "query.sql",
    lines: [
      [["SELECT", "k"], [" name, score", "p"]],
      [["FROM", "k"], [" players", "p"]],
      [["WHERE", "k"], [" score > 90", "p"]],
      [["ORDER BY", "k"], [" score ", "p"], ["DESC", "k"], [";", "p"]],
    ],
  },
  {
    name: "HTML/CSS",
    Icon: SiHtml5,
    match: ["HTML/CSS"],
    file: "index.html",
    lines: [
      [["<", "d"], ["h1", "k"], [" class=", "p"], ['"title"', "s"], [">", "d"]],
      [["  hello, world", "p"]],
      [["</", "d"], ["h1", "k"], [">", "d"]],
    ],
  },
];

/* ── frameworks & tools ────────────────────────────────────────────────────── */

export type ToolItem = SkillBase & { Icon: IconType };

/** drawn as the stack diagram (`sections/skillsStack.tsx`), which places each
 *  by name */
export const TOOLS: ToolItem[] = [
  { name: "Next.js", Icon: SiNextdotjs, match: [], extra: ["this site"] },
  { name: "Supabase", Icon: SiSupabase, match: [] },
  { name: "PostgreSQL", Icon: SiPostgresql, match: [] },
  { name: "NumPy", Icon: SiNumpy, match: ["NumPy"] },
  { name: "PyTorch", Icon: SiPytorch, match: ["PyTorch"] },
  { name: "Git/GitHub", Icon: SiGithub, match: [] },
];

/* ── hardware & design ─────────────────────────────────────────────────────── */

export type HardwareItem = SkillBase & {
  /** one line on what it was for, from the résumé's own bullet */
  note: string;
};

/** drawn as three bench strips (`sections/skillsBench.tsx`), in this order */
export const HARDWARE: HardwareItem[] = [
  { name: "Soldering", match: ["Soldering"], note: "Breadboard to working MVP" },
  { name: "PCB Design (KiCad)", match: ["PCB Design"], note: "A custom 2-layer board" },
  { name: "CAD Modelling (Fusion)", match: ["CAD Modelling"], note: "A 3D-printed enclosure" },
];
