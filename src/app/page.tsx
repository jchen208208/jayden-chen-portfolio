import Hero from "@/components/Hero";
import WispCanvas from "@/components/WispCanvas";

export default function Home() {
  return (
    <>
      <WispCanvas />
      <main className="relative z-10">
        <Hero />

        {/* Placeholder next section so the scroll cue has somewhere to go. */}
        <section
          id="projects"
          className="mx-auto flex min-h-[80svh] max-w-3xl flex-col justify-center px-6 py-32"
        >
          <h2 className="text-3xl font-semibold tracking-tight text-wisp sm:text-4xl">
            Projects
          </h2>
          <p className="mt-4 max-w-prose text-foreground/60">
            Coming soon — this is where the real content, generated art plates and
            parallax foliage layers will live.
          </p>
        </section>
      </main>
    </>
  );
}
