/**
 * Site content model for "The Desk" portfolio.
 *
 * Known-real data is filled in. Everything marked `TODO — user` is placeholder
 * shaped like the real thing so the UI renders; swap in real copy before launch.
 */

export const PROFILE = {
  name: "Jayden Chen",
  tagline: "Computer Engineering · University of Waterloo '31",
  email: "jaydenccan11@gmail.com",
  githubUser: "jchen208208",
  github: "https://github.com/jchen208208",
  // TODO — user: confirm this LinkedIn slug is current
  linkedin: "https://www.linkedin.com/in/jayden-chen-81b50a39b",
  resume: "/resume",
} as const;

/* ── sections → screens ─────────────────────────────────────────────────────── */

export type SectionId = "projects" | "experience" | "skills" | "about";

export type SectionMeta = {
  id: SectionId;
  route: `/${SectionId}`;
  /** short label on the desk / mobile card */
  deskLabel: string;
  /** titlebar text of the themed "app" window */
  appName: string;
  /** one-line description under the mobile card */
  blurb: string;
  /** CSS custom property name for this section's accent */
  accentVar: string;
};

export const SECTIONS: Record<SectionId, SectionMeta> = {
  projects: {
    id: "projects",
    route: "/projects",
    deskLabel: "Projects",
    appName: "projects — editor",
    blurb: "Things I've built, software and otherwise.",
    accentVar: "--accent-projects",
  },
  experience: {
    id: "experience",
    route: "/experience",
    deskLabel: "Experience",
    appName: "experience — git log",
    blurb: "Roles, teams, and awards along the way.",
    accentVar: "--accent-experience",
  },
  skills: {
    id: "skills",
    route: "/skills",
    deskLabel: "Skills",
    appName: "skills — zsh",
    blurb: "Languages, tools, and the hardware bench.",
    accentVar: "--accent-skills",
  },
  about: {
    id: "about",
    route: "/about",
    deskLabel: "About",
    appName: "about — notes",
    blurb: "Who's behind the desk.",
    accentVar: "--accent-about",
  },
};

export const SECTION_ORDER: SectionId[] = [
  "projects",
  "experience",
  "skills",
  "about",
];

/* ── projects ───────────────────────────────────────────────────────────────── */

export type Project = {
  slug: string;
  name: string;
  period: string;
  /** short one/two sentence summary */
  blurb: string;
  tags: string[];
  highlights: string[];
  repo?: string;
  demo?: string;
};

// TODO — user: replace with real projects.
export const PROJECTS: Project[] = [
  {
    slug: "placeholder-web",
    name: "Placeholder Project",
    period: "2025",
    blurb:
      "A short description of what this project is and why it exists. Replace this entry with a real one.",
    tags: ["TypeScript", "Next.js"],
    highlights: [
      "A concrete result or interesting technical detail.",
      "Another highlight worth calling out.",
    ],
    repo: "https://github.com/jchen208208",
  },
  {
    slug: "placeholder-hardware",
    name: "Placeholder Hardware Build",
    period: "2024",
    blurb:
      "A hardware/PCB project — what it does, what you designed, what you learned.",
    tags: ["KiCad", "Embedded C"],
    highlights: [
      "Designed a 2-layer board, hand-assembled and brought up.",
      "Firmware in bare-metal C on the target MCU.",
    ],
  },
];

/* ── experience + awards (one merged timeline) ──────────────────────────────── */

export type TimelineEntry = {
  /** ISO date (YYYY-MM-DD) — used for sort + the fake commit hash */
  date: string;
  kind: "role" | "award";
  /** company / school / competition */
  org: string;
  title: string;
  summary?: string;
  details?: string[];
};

// TODO — user: replace with real roles + awards.
export const TIMELINE: TimelineEntry[] = [
  {
    date: "2025-05-01",
    kind: "role",
    org: "Company Name",
    title: "Software Engineering Intern",
    summary: "One line on what the team did and what you owned.",
    details: [
      "A specific thing you shipped or improved.",
      "A number, if you have one.",
    ],
  },
  {
    date: "2024-11-01",
    kind: "award",
    org: "Hackathon Name",
    title: "Placeholder Award",
    summary: "What it was for.",
  },
  {
    date: "2024-09-01",
    kind: "role",
    org: "University of Waterloo",
    title: "Started Computer Engineering",
    summary: "Class of 2031 (co-op stream).",
  },
];

/* ── skills ─────────────────────────────────────────────────────────────────── */

export const SKILLS = {
  languages: ["Python", "C", "C++", "JavaScript", "SQL", "HTML/CSS"],
  // TODO — user: frameworks / libraries / platforms
  frameworksTools: ["React", "Next.js", "Node.js", "Git", "Linux"],
  hardware: ["PCB design", "SMD soldering"],
} as const;

/** proficiency buckets for the optional htop-style view — coarse on purpose */
export type SkillLevel = "core" | "working" | "learning";
export const SKILL_LEVELS: Record<string, SkillLevel> = {
  Python: "core",
  C: "core",
  "C++": "working",
  JavaScript: "core",
  SQL: "working",
  "HTML/CSS": "core",
  React: "working",
  "Next.js": "working",
  "Node.js": "working",
  Git: "core",
  Linux: "working",
  "PCB design": "working",
  "SMD soldering": "working",
};

/* ── about / personal notes ────────────────────────────────────────────────── */

export type Note = {
  slug: string;
  title: string;
  /** minimal markdown: # / ## headings, **bold**, `code`, - lists, [text](url) */
  body: string;
};

// TODO — user: replace with real copy.
export const ABOUT_NOTES: Note[] = [
  {
    slug: "about",
    title: "about.md",
    body: `# About

I'm a Computer Engineering student at the University of Waterloo who likes
building things that sit on the line between **software and hardware** — a
web app, a PCB, and the firmware in between.

Replace this with a few real paragraphs: what you care about, how you work,
what you're looking for.`,
  },
  {
    slug: "now",
    title: "now.md",
    body: `# Now

- Studying: first-year Computer Engineering
- Building: (current project)
- Learning: (current rabbit hole)

_Last updated: replace me._`,
  },
  {
    slug: "colophon",
    title: "colophon.md",
    body: `# Colophon

This site is a hand-built 2D desk. Each screen is a small themed UI.

Built with **Next.js**, **Tailwind**, and \`motion\`. No page builder, no
templates — the desk is drawn in SVG and the section transitions use the
browser's View Transitions API.`,
  },
  {
    slug: "contact",
    title: "contact.md",
    body: `# Contact

- Email: [${PROFILE.email}](mailto:${PROFILE.email})
- GitHub: [@${PROFILE.githubUser}](${PROFILE.github})
- LinkedIn: [profile](${PROFILE.linkedin})

Résumé lives at [/resume](/resume).`,
  },
];

export const SOCIALS = [
  { label: "GitHub", href: PROFILE.github },
  { label: "LinkedIn", href: PROFILE.linkedin },
  { label: "Email", href: `mailto:${PROFILE.email}` },
] as const;
