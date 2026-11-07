import type { ReactNode } from "react";
import DeskStage from "@/components/desk/DeskStage";
import SiteFooter from "@/components/site/SiteFooter";
import SmoothScroll from "@/components/site/SmoothScroll";
import { getPlaylist } from "@/lib/itunes";

/**
 * Persistent desk. `DeskStage` stays mounted across `/ ↔ /projects ↔ …` so each
 * section route can render its `<FocusFrame>` as a fixed overlay on top of the
 * still-live desk, and the reverse morph has a real target to land on.
 *
 * The speaker's songs are fetched here, on the server, and handed down.
 */
export default async function DeskLayout({ children }: { children: ReactNode }) {
  const tracks = await getPlaylist();
  return (
    <>
      <SmoothScroll />
      <DeskStage tracks={tracks} />
      <SiteFooter />
      {children}
    </>
  );
}
