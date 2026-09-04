import ForestBackdrop from "@/components/site/ForestBackdrop";
import Hero from "@/components/site/Hero";
import Nav from "@/components/site/Nav";
import ScrollRiver from "@/components/site/ScrollRiver";
import {
  About,
  Awards,
  Contact,
  Footer,
  Skills,
  Work,
} from "@/components/site/Sections";

export default function Home() {
  return (
    <>
      <ForestBackdrop />
      <ScrollRiver />
      <Nav />
      <main className="relative z-10">
        <Hero />

        {/* Content zone — a soft paper wash so text stays readable over the
            fixed forest, while the hero above stays fully scenic. */}
        <div className="relative">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -top-40 h-40 bg-gradient-to-b from-transparent to-[color-mix(in_srgb,var(--paper)_86%,transparent)]"
          />
          <div className="relative bg-[color-mix(in_srgb,var(--paper)_86%,transparent)]">
            <Work />
            <Skills />
            <Awards />
            <About />
            <Contact />
            <Footer />
          </div>
        </div>
      </main>
    </>
  );
}
