import type { ReactNode } from "react";
import DeskStage from "@/components/desk/DeskStage";

/**
 * Persistent desk. `DeskStage` stays mounted across `/ ↔ /projects ↔ …` so each
 * section route can render its `<FocusFrame>` as a fixed overlay on top of the
 * still-live desk, and the reverse morph has a real target to land on.
 */
export default function DeskLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <DeskStage />
      {children}
    </>
  );
}
