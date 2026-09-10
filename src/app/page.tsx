import Nav from "@/components/site/Nav";

/**
 * Clean slate — the whole "Descent" journey scene (Hero + waterfall/canopy/
 * jungle/roots pieces + skill-ledge sections) was removed to rebuild from
 * scratch. The parallax rig is preserved at
 * `src/components/journey/parallax.ts`. Next step: plan the new design.
 */

export default function Home() {
  return (
    <>
      <Nav />
      <main id="top" className="relative z-10 flex min-h-[100svh] items-center justify-center px-6">
        <p className="font-mono text-sm tracking-[0.15em] text-ink-faint">
          rebuilding — planning next
        </p>
      </main>
    </>
  );
}
