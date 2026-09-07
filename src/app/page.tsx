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
import WaterfallScene from "@/components/journey/WaterfallScene";
// CanopyScene (video-scrub) parked — scene 2+ being rebuilt as the stitched
// still-painting + code sprites. See CONTEXT.md session 5b.

export default function Home() {
  return (
    <>
      <ScrollRiver />
      <Nav />
      <main className="relative z-10">
        {/* Scene 1 — stitched waterfall + canopy painting, living water */}
        <WaterfallScene />

        {/* Below the falls — sections live here for now; they'll be re-homed
            into the canopy / branches / roots scenes as the journey is built. */}
        <div className="relative bg-paper">
          <Work />
          <Skills />
          <Awards />
          <About />
          <Contact />
          <Footer />
        </div>
      </main>
    </>
  );
}
