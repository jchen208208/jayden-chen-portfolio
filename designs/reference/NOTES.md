# Reference research — session 3

Downloaded source + observations from the two sites Jayden flagged. Files in
this folder:

- `prmntr.com.html` — SSR'd homepage markup
- `prmntr-869b2299a0ef2c13.css`, `prmntr-9600cb1f7c2c18a5.css` — its stylesheets
- `hackthenorth.com.html` — CRA shell (real markup is built by JS)
- `htn-main.d29b78e7.js` — Hack the North's single app bundle (minified)

## prmntr.com

- **Stack:** Next.js (Turbopack build), **Lenis** smooth scroll (`html.lenis`),
  no GSAP, no Framer Motion. Dark theme.
- **Fonts:** a Bauhaus-style geometric display face, Poppins, JetBrains Mono.
- **Signature moves:**
  - Every section has a huge, near-invisible **watermark word** (`toolkit`,
    `work`, `developer`) behind a smaller bold subtitle. The subtitle ends with
    **colored punctuation** (`?!` in yellow/red).
  - Kinetic hero: the name is scroll-scrubbed; a giant watermark scrolls at a
    different rate behind it.
  - Bauhaus primitives (circle / triangle / square) float and react to
    scroll + pointer.
  - Faint grid background.
  - Skills = three cards with **colored header bars** (`LANGUAGES`,
    `FRAMEWORKS`, `TOOLS & PLATFORMS`) holding pill tags.
  - Project grid with screenshot plates + a `TECH SPEC` toggle per card.
- **Keyframes are simple** (`site-fade-up`, `site-drift`, `bh-fade-up`) — the
  richness comes from scroll-linked transforms, not CSS animation.

## hackthenorth.com

- **Stack:** Create React App (single `main.[hash].js`), React, **no GSAP /
  Lenis / Framer / three** — they hand-rolled a scroll-scrub engine
  (`scrollYProgress`-style progress → transforms on layered elements).
- **Fonts:** Castledown (rounded display), Satoshi, plus pixel faces
  (Jersey 10, Pixelify Sans) for accents.
- **Signature moves (the nature/paper-cutout warmth we're copying):**
  - Illustrated **paper-cutout diorama** hero — mountains, forest, a winding
    river, wooden deck, hand-drawn objects (vinyl player, camera, cassette).
  - Long **pinned** sections: giant illustrated objects translate / scale
    through the viewport as scroll drives progress; text blocks slide in from
    the sides and settle.
  - **Torn-paper cards** with a stamp illustration + a rock "paperweight".
  - Scattered polaroid photos, slight rotations.
  - Section backgrounds are **top-down forest floor** (bushes, rocks) or flat
    warm greens — hard cuts between zones, sometimes a white flash wipe.
  - Teal accent line beside headings; deep-teal rounded heading type.

## How this fed the template

`src/components/site/*` takes prmntr's **watermark + colored-punctuation section
headers**, **colored-header skill cards**, and **TECH SPEC project cards**, and
Hack the North's **illustrated layered scenery + scroll-scrub parallax** and
warm, hand-made feel — rendered as a golden-hour birch forest (2D SVG layers,
not WebGL) via `motion`'s `useScroll` / `useTransform`.
