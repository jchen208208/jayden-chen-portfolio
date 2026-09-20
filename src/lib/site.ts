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
  /** display dates, as the résumé writes them */
  period: string;
  /** languages and tools, in résumé order */
  tags: string[];
  /** the résumé's bullets, in its own words */
  highlights: string[];
  repo?: string;
  demo?: string;
  /** true for the SPARC board: its box shows the real KiCad design turning
   *  in 3D (the same viewer as the Projects monitor on the desk) */
  hasBoardViewer?: boolean;
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
    hasBoardViewer: true,
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
  /** the title held, exactly as the résumé has it — the row's label */
  role: string;
  /** one line under the title while the row is collapsed; names the project,
   *  since two research roles share a title */
  blurb: string;
  /** where, and under whom — shown once the row is opened */
  place?: string;
  /** display dates, as the résumé writes them */
  start: string;
  end: string;
  stack?: string[];
  bullets: string[];
};

/** In résumé order, lead role first. Bullets are the résumé's own words. */
export const EXPERIENCE: Role[] = [
  {
    slug: "claim-verification",
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

/* ── awards ──────────────────────────────────────────────────────────────────── */

export type Award = {
  /** ISO date (YYYY-MM-DD) — sorts the list; its year is shown */
  date: string;
  /** competition / organiser */
  org: string;
  title: string;
  summary?: string;
};

export const AWARDS: Award[] = [
  {
    date: "2025-04-01",
    org: "AAPT",
    title: "PhysicsBowl",
    summary: "Top 80 worldwide, 1st regionally.",
  },
  {
    date: "2025-05-01",
    org: "Waterloo CEMC",
    title: "Canadian Computing Competition",
    summary: "Top 20 nationally, Junior division.",
  },
  {
    date: "2025-02-01",
    org: "Waterloo CEMC",
    title: "Fermat Mathematics Contest",
    summary: "Top 10 regionally.",
  },
  {
    date: "2026-04-01",
    org: "Waterloo CEMC",
    title: "Euclid Mathematics Contest",
    summary: "Top 25%.",
  },
  {
    date: "2025-06-01",
    org: "Academic",
    title: "AP Scholar with Distinction",
    summary: "Also on the Principal's List.",
  },
];

export const SOCIALS = [
  { label: "GitHub", href: PROFILE.github },
  { label: "LinkedIn", href: PROFILE.linkedin },
  { label: "Email", href: `mailto:${PROFILE.email}` },
] as const;
