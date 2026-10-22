/**
 * Site content model for "The Desk" portfolio.
 *
 * Known-real data is filled in. Everything marked `TODO — user` is placeholder
 * shaped like the real thing so the UI renders; swap in real copy before launch.
 */

import type { StaticImageData } from "next/image";
import findverDiagram from "@/assets/experience/findver-diagram.webp";
import hitWithLukeShot from "@/assets/experience/hitwithluke.webp";

/** the tagline's parts — the hero highlights the school on its own */
const STUDY = {
  program: "Computer Engineering",
  school: "University of Waterloo",
  schoolUrl: "https://uwaterloo.ca/",
  classOf: "'31",
} as const;

export const PROFILE = {
  name: "Jayden Chen",
  ...STUDY,
  tagline: `${STUDY.program} · ${STUDY.school} ${STUDY.classOf}`,
  email: "jaydenccan11@gmail.com",
  githubUser: "jchen208208",
  github: "https://github.com/jchen208208",
  // TODO — user: confirm this LinkedIn slug is current
  linkedin: "https://www.linkedin.com/in/jayden-chen-81b50a39b",
  resume: "/resume",
} as const;

/**
 * The résumé PDF, served straight out of `public/`. The file on disk is named
 * as it should appear in a visitor's Downloads folder and in the browser tab —
 * the URL's last segment is the only thing that controls that when the PDF is
 * opened rather than downloaded.
 */
export const RESUME_PDF = {
  href: "/jayden_chen_resume.pdf",
  /** filename for the download; matches the file so both paths agree */
  filename: "jayden_chen_resume.pdf",
  /** shown under the heading — bump when the PDF is replaced */
  updated: "September 2026",
  pageAspect: "8.5 / 11",
} as const;

/* ── sections → screens ─────────────────────────────────────────────────────── */

export type SectionId = "projects" | "experience" | "skills" | "about";

export type SectionMeta = {
  id: SectionId;
  route: `/${SectionId}`;
  /** short label on the mobile card */
  deskLabel: string;
  /** the header the opened section grows into. Uppercase. (On the desk its
   *  screen shows `route` instead — see `ScreenLabel`.) */
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
    deskLabel: "About",
    screenLabel: "ABOUT",
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
  /** display dates, as the résumé writes them */
  period: string;
  /** languages and tools, in résumé order */
  tags: string[];
  /** the résumé's bullets, in its own words */
  highlights: string[];
  repo?: string;
  demo?: string;
  /** the picture in the project's window, imported from `src/assets/projects`
   *  — a placeholder stands in until there is one.
   *  TODO — user: a screenshot or photo for each project */
  image?: StaticImageData;
};

export const PROJECTS: Project[] = [
  {
    slug: "sparc",
    name: "Gesture-Controlled Audio Device (SPARC)",
    period: "May 2026 – Present",
    tags: ["Embedded C++", "Python", "PCB Design", "CAD Modelling", "Soldering"],
    highlights: [
      "Developing an embedded-system device mapping hand gestures to audio playback controls using a light sensor with an ESP32 MCU.",
      "Designed a custom 2-layer PCB in KiCad and a 3D-printed enclosure in Fusion 360, advancing the project through many stages from breadboard components to now a working and tested MVP ready for production and scaling.",
    ],
  },
  {
    slug: "shell",
    name: "Custom Unix Shell",
    period: "June – Sept 2026",
    tags: ["C", "CMake", "POSIX", "termios", "Valgrind", "Electron", "React"],
    highlights: [
      "Built a Unix shell in C with standard built-in commands, custom built-ins, process forking, and manual memory management with no memory leaks using Valgrind.",
      "Designed a Pokémon-themed frontend with various animation features that creates an interactive environment for the shell's user.",
    ],
  },
  {
    slug: "catapult",
    name: "Catapult Physics Simulator",
    period: "August – September 2026",
    tags: ["Python", "JavaScript", "HTML/CSS"],
    highlights: [
      "Wrote a projectile physics engine from scratch; models launch mechanics, velocity, gravity/drag with real-time trajectory rendering.",
      "Adopted by 2 of my high school physics teachers who use it in their classes to demonstrate projectile motion.",
    ],
  },
  {
    slug: "tictactoe",
    name: "Tic-Tac-Toe Engine → Neural Network",
    period: "March – May 2026",
    tags: ["C++", "Python", "PyTorch"],
    highlights: [
      "Implemented depth-weighted minimax algo with alpha-beta pruning in C++, verified unbeatable across all 681 possible game lines.",
      "Generated a labelled dataset of 4,520 positions from the solver's move evaluations to train a neural network reproducing optimal play without search at ~1,000× lower inference latency.",
    ],
  },
  {
    slug: "minesweeper",
    name: "Minesweeper Neural Network",
    period: "August 2026 – Present",
    tags: ["Python", "PyTorch"],
    highlights: [
      "Building a convolutional neural network (CNN) that treats the Minesweeper board as an image, using convolutional layers so the model learns local number-to-mine patterns rather than memorizing board positions.",
      "Built a graphical board interface that shows the network's predictions in real time.",
    ],
  },
];

/* ── experience ─────────────────────────────────────────────────────────────── */

export type Role = {
  slug: string;
  /** the title held, exactly as the résumé has it */
  role: string;
  /** what it was about, beside the dates — two research roles share a
   *  title, so this is what tells them apart */
  project?: string;
  /** the one line the role's page leads with */
  blurb: string;
  /** the role's page, in depth — paragraphs between the lead and the
   *  bullets. TODO — user: write these; the page reads fine without */
  story?: string[];
  /** where, and under whom */
  place?: string;
  /** display dates, as the résumé writes them */
  start: string;
  end: string;
  stack?: string[];
  bullets: string[];
  /** the work itself, when it's out in the world */
  link?: string;
  /** the role's picture, imported from `src/assets/experience`, 16:10 — a
   *  placeholder stands in until there is one.
   *  TODO — user: pictures for TRACE, C3M, IT Technician and Private Tutor */
  image?: StaticImageData;
};

/** In résumé order, lead role first. Bullets are the résumé's own words.
 *  Each `slug` is its page's address: `/experience/{slug}`. */
export const EXPERIENCE: Role[] = [
  {
    slug: "findver",
    project: "FinDVer",
    image: findverDiagram,
    blurb: "Financial claim verification: a multi-agent pipeline that matches cloud-only accuracy at about half the cost",
    role: "Lead Student Researcher/First Author",
    place: "Supervised by Prof. Zhen Bi, Huzhou Normal University",
    start: "June 2026",
    end: "Present",
    stack: ["Python", "Ollama", "DeepSeek API", "NumPy", "LaTeX"],
    bullets: [
      "Designed and built a multi-agent pipeline for automated financial claim verification on the FinDVer benchmark, matching cloud-only accuracy at ~50% of inference cost across 1,700 held-out claims.",
      "Architected the routing system and run loop that decide whether each claim goes to a local 3B/7B model or a cloud API call.",
      "Created two custom verification skills for the pipeline that further cut cloud calls by 20% while continuing to tie cloud-only accuracy.",
      "Built a BM25 retriever that retrieves 75.2% of gold evidence, 5.4 points above the best published retrieval model on FinDVer.",
    ],
  },
  {
    slug: "trace",
    project: "TRACE",
    blurb: "TRACE: text-to-image steering that cuts attack success by nearly half at about 1% latency",
    role: "Research Assistant/Co-author",
    place: "Under Prof. Zhen Bi, Huzhou Normal University",
    start: "May 2026",
    end: "Present",
    stack: ["PyTorch", "scikit-learn", "NumPy", "LlamaGuard/XGuard", "Hugging Face Diffusers"],
    bullets: [
      "Co-developed TRACE, a text-to-image steering framework triggering sparse-autoencoder steering only at high-risk denoising steps.",
      "Cut attack success rate by nearly 50% on two test models at ~1% latency overhead, using only 48 MB of added weights.",
      "Trained 50+ per-layer linear risk probes and selected the most predictable layer by AUPRC score and SAE reconstruction error (FVU).",
      "Built the projection and mean-pooling, compressing activations 256× (512 KB → 2 KB), enabling a single-pass sweep across all layers.",
    ],
  },
  {
    slug: "c3m",
    project: "C3M",
    blurb: "C3M: a multimodal memory framework for long-horizon AI agents",
    role: "Research Assistant/Co-author",
    place: "Under Prof. Zhen Bi, Huzhou Normal University",
    start: "August 2026",
    end: "Present",
    stack: ["Python", "PyTorch", "Hugging Face Transformers", "NumPy"],
    bullets: [
      "Co-developed C3M, a multimodal memory framework maintaining a 36-entry, 6,144-token active index for long-horizon AI agents.",
      "Achieved 73%/68% accuracy on the MemLens benchmark at 32K/64K token histories, beating the next best baseline by 9/3%.",
      "Built the evaluation pipeline that feeds MemLens' 789 questions in session order, testing 5 task types across 3 context lengths.",
      "Implemented the confidence-thresholded rule deciding if new memories merge, update, or stay separate from existing entries.",
    ],
  },
  {
    slug: "it-technician",
    blurb: "Hardware and software support for a ~2,000-student school",
    role: "IT Technician",
    place: "Burnaby South Secondary, BC",
    start: "Sept 2025",
    end: "June 2026",
    bullets: [
      "Resolved 100+ hardware and software issues at a ~2,000-student school over 9 months; issues ranged from printer connectivity problems, login and authentication failures, corrupted file recovery, and physical repairs including broken monitor arms.",
    ],
  },
  {
    slug: "web-developer",
    project: "Hit with Luke",
    image: hitWithLukeShot,
    blurb: "A booking site for a tennis coach's hitting sessions",
    role: "Freelance Web Developer",
    place: "Client: Hit with Luke",
    start: "Oct 2026",
    end: "Present",
    stack: ["Next.js", "React", "TypeScript", "Tailwind CSS", "Resend"],
    // TODO — user: confirm these, drafted from the client-website-1 repo
    bullets: [
      "Designed and built hitwithluke.com, a tennis coach's booking site, in Next.js and Tailwind CSS.",
      "Wired the booking form to email the coach through Resend, so every request reaches his phone with the visitor's details and preferred time.",
    ],
    link: "https://hitwithluke.com",
  },
  {
    slug: "private-tutor",
    blurb: "Python, C++, math and science for 6+ students in Grades 5 to 12",
    role: "Private Tutor",
    start: "Oct 2024",
    end: "Present",
    bullets: [
      "Taught Python and C++ fundamentals alongside math and science to 6+ students in Grades 5–12, breaking down technical concepts for students with no prior programming background.",
    ],
  },
];

/* ── about: the roll ─────────────────────────────────────────────────────────── */

/** A frame on the About page's roll of film — and the print it lifts out as
 *  when it's clicked. Stills are imported from `src/assets/about`; clips and
 *  voice notes are served from `public/about`. Until a frame has its picture
 *  it shows as an unexposed one. */
export type Shot = {
  slug: string;
  /** printed on the film's edge under the frame */
  label: string;
  /** what the voice note says, word for word — shown under the print, and
   *  followed along as it plays */
  caption: string;
  /** the frame's picture, 3:2 — and the clip's first frame, if it has one */
  image?: StaticImageData;
  /** `/about/{slug}.mp4`: a few seconds that loop silently in the print */
  clip?: string;
  /** `/about/{slug}.m4a` — or `"clip"` when the clip's own sound is the voice
   *  note (the intro, talking to camera) */
  voice?: string;
  /** each word's start, in seconds, for when following at an even pace drifts */
  cues?: number[];
};

/** In the roll's order. TODO — user: photos, clips and voice notes for each
 *  frame; these captions are drafts for you to rewrite in your own words. */
export const ROLL: Shot[] = [
  {
    slug: "hello",
    label: "Hello",
    caption:
      "Hi, I'm Jayden. I study Computer Engineering at Waterloo, and most of what I make sits somewhere between a circuit board and a screen. Away from the desk, I'm on a tennis court, training MMA, or in the kitchen.",
  },
  {
    slug: "tennis",
    label: "On court",
    caption:
      "Tennis is the one thing I'll always make time for. A long rally clears my head better than anything else.",
  },
  {
    slug: "mma",
    label: "MMA",
    caption:
      "MMA keeps me honest. You can't fake a sparring round: either you've put the hours in or you find out.",
  },
  {
    slug: "baking",
    label: "Baking",
    caption:
      "Baking is engineering you can eat. Exact measurements, careful timing, and the oven tells you straight away if you got it wrong.",
  },
  {
    slug: "cooking",
    label: "Cooking",
    caption: "Cooking is the opposite: taste as you go and adjust. I like having both.",
  },
];

/* ── awards ──────────────────────────────────────────────────────────────────── */

/** what stands on the About page's trophy shelf for an award */
export type AwardObject = "cup" | "medal" | "plaque" | "certificate" | "rosette";

export type Award = {
  /** ISO date (YYYY-MM-DD) — sorts the list; its year is shown */
  date: string;
  /** competition / organiser */
  org: string;
  title: string;
  /** the placing, short — the big line on the award's label */
  rank: string;
  summary?: string;
  object: AwardObject;
};

// TODO — user: confirm each rank and which object stands for it
export const AWARDS: Award[] = [
  {
    date: "2025-04-01",
    org: "AAPT",
    title: "PhysicsBowl",
    rank: "1st",
    summary: "1st regionally, top 80 worldwide.",
    object: "cup",
  },
  {
    date: "2025-05-01",
    org: "Waterloo CEMC",
    title: "Canadian Computing Competition",
    rank: "Top 20",
    summary: "Nationally, Junior division.",
    object: "medal",
  },
  {
    date: "2025-02-01",
    org: "Waterloo CEMC",
    title: "Fermat Mathematics Contest",
    rank: "Top 10",
    summary: "Regionally.",
    object: "plaque",
  },
  {
    date: "2026-04-01",
    org: "Waterloo CEMC",
    title: "Euclid Mathematics Contest",
    rank: "Top 25%",
    object: "certificate",
  },
  {
    date: "2025-06-01",
    org: "Academic",
    title: "AP Scholar",
    rank: "Distinction",
    summary: "Also on the Principal's List.",
    object: "rosette",
  },
];

export const SOCIALS = [
  { label: "GitHub", href: PROFILE.github },
  { label: "LinkedIn", href: PROFILE.linkedin },
  { label: "Email", href: `mailto:${PROFILE.email}` },
] as const;
