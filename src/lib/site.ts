/**
 * Placeholder content for the portfolio template.
 * Swap these values for real copy — structure is what matters here.
 */

export const NAV = [
  { label: "Work", href: "#work" },
  { label: "Skills", href: "#skills" },
  { label: "Awards", href: "#awards" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
] as const;

export type Project = {
  slug: string;
  name: string;
  period: string;
  blurb: string;
  tags: string[];
  spec: string[];
  href?: string;
};

export const PROJECTS: Project[] = [
  {
    slug: "riverkeeper",
    name: "Riverkeeper",
    period: "2025",
    blurb:
      "A field-logging app for watershed volunteers — offline-first sample entry, map clustering, and a dashboard the county actually uses.",
    tags: ["Next.js", "PostGIS", "React Native"],
    spec: [
      "Offline queue with conflict-free merge on reconnect",
      "Vector tiles served from a single Postgres + PostGIS box",
      "Auth via passkeys, no passwords stored",
    ],
    href: "#work",
  },
  {
    slug: "canopy",
    name: "Canopy",
    period: "2024 — 2025",
    blurb:
      "Internal tooling and marketing site for a tree-care firm: scheduling, crew routing, and before/after galleries.",
    tags: ["TypeScript", "Remix", "Mapbox"],
    spec: [
      "Route optimisation shaves ~40 min off a typical crew day",
      "Image pipeline: upload → EXIF strip → responsive derivatives",
      "Role-based views for office vs. field",
    ],
    href: "#work",
  },
  {
    slug: "emberlog",
    name: "Emberlog",
    period: "2024",
    blurb:
      "A tiny structured-logging library with a golden-hour color scheme and zero dependencies. Because the terminal should be nice too.",
    tags: ["Rust", "CLI", "OSS"],
    spec: [
      "< 30 KB compiled, no allocations on the hot path",
      "Pluggable sinks: stdout, file, JSON, OTLP",
      "Used in three of my other projects",
    ],
    href: "#work",
  },
  {
    slug: "trailhead",
    name: "Trailhead",
    period: "2023",
    blurb:
      "Course-planning tool for a hiking club — elevation profiles, water sources, and a printable one-pager for each route.",
    tags: ["Svelte", "D3", "GPX"],
    spec: [
      "Client-side GPX parsing and smoothing",
      "SVG elevation charts that print cleanly",
      "Shareable links encode the full route in the URL",
    ],
    href: "#work",
  },
];

export const SKILL_GROUPS = [
  {
    label: "Languages",
    accent: "var(--ember)",
    items: ["TypeScript", "JavaScript", "Rust", "Python", "SQL", "HTML / CSS"],
  },
  {
    label: "Frameworks",
    accent: "var(--leaf)",
    items: ["React", "Next.js", "Remix", "Svelte", "Node.js", "React Native"],
  },
  {
    label: "Tools & Platforms",
    accent: "var(--water-deep)",
    items: ["Postgres / PostGIS", "Mapbox", "Vercel", "Docker", "Figma", "Git"],
  },
] as const;

export type Award = {
  year: string;
  title: string;
  detail: string;
};

export const AWARDS: Award[] = [
  {
    year: "2025",
    title: "Best Civic Tech Hack",
    detail: "Riverkeeper — regional hackathon, 60+ teams.",
  },
  {
    year: "2024",
    title: "Dean's Honour List",
    detail: "Top 5% of the faculty, two terms running.",
  },
  {
    year: "2024",
    title: "Open Source Grant",
    detail: "Small maintainer grant toward Emberlog.",
  },
  {
    year: "2023",
    title: "1st — Intro CS Design Challenge",
    detail: "Trailhead, judged on usability and craft.",
  },
];

export const SOCIALS = [
  { label: "Email", href: "mailto:jaydenccan11@gmail.com" },
  { label: "GitHub", href: "https://github.com/" },
  { label: "LinkedIn", href: "https://linkedin.com/" },
] as const;
