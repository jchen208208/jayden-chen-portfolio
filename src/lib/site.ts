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
  /** short label on the mobile card */
  deskLabel: string;
  /** the title every screen wears — in the white strip on the desk glass,
   *  and as the header the opened section grows into. Uppercase, mono. */
  screenLabel: string;
  /** one-line description under the mobile card */
  blurb: string;
};

export const SECTIONS: Record<SectionId, SectionMeta> = {
  projects: {
    id: "projects",
    route: "/projects",
    deskLabel: "Projects",
    screenLabel: "PROJECTS",
    blurb: "Things I've built, software and otherwise.",
  },
  experience: {
    id: "experience",
    route: "/experience",
    deskLabel: "Experience",
    screenLabel: "EXPERIENCE",
    blurb: "Roles and teams along the way.",
  },
  skills: {
    id: "skills",
    route: "/skills",
    deskLabel: "Skills",
    screenLabel: "SKILLS",
    blurb: "Languages, tools, and the hardware bench.",
  },
  about: {
    id: "about",
    route: "/about",
    deskLabel: "Personal & Awards",
    screenLabel: "PERSONAL & AWARDS",
    blurb: "Who's behind the desk, on and off the court.",
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
  /** true for the ESP32 board: its card shows the real KiCad design turning
   *  in 3D (the same viewer as the Projects monitor on the desk) */
  hasBoardViewer?: boolean;
};

// The ESP32 board is real. TODO — user: replace the rest with real projects.
export const PROJECTS: Project[] = [
  {
    slug: "esp32-usb",
    name: "ESP32-S3 USB Dongle",
    period: "2025",
    blurb:
      "A thumb-sized ESP32-S3-WROOM-1 board that plugs straight into a USB-A port — designed, hand-assembled and brought up from scratch.",
    tags: ["KiCad", "ESP32-S3", "SMD"],
    highlights: [
      "2-layer board, 20 × 35 mm, with the module's antenna overhanging the edge for range.",
      "USB edge fingers on the board itself — no connector to solder.",
      "AMS1117 regulator, boot button, status LED; every part hand-placed and reflowed.",
    ],
    hasBoardViewer: true,
  },
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

export const SOCIALS = [
  { label: "GitHub", href: PROFILE.github },
  { label: "LinkedIn", href: PROFILE.linkedin },
  { label: "Email", href: `mailto:${PROFILE.email}` },
] as const;
