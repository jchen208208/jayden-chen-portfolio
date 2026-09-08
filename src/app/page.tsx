import Nav from "@/components/site/Nav";
import WaterfallScene from "@/components/journey/WaterfallScene";
// CanopyScene (video-scrub) parked — scene 2+ being rebuilt as the stitched
// still-painting + code sprites. See CONTEXT.md session 5b.

export default function Home() {
  return (
    <>
      <Nav />
      <main className="relative z-10">
        {/* Scene 1 — stitched waterfall + canopy painting, living water */}
        <WaterfallScene />
      </main>
    </>
  );
}
