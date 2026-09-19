import type { Metadata } from "next";
import FocusFrame from "@/components/focus/FocusFrame";
import { SectionCardStack } from "@/components/desk/sections";

export const metadata: Metadata = { title: "Experience — Jayden Chen" };

export default function ExperiencePage() {
  return (
    <FocusFrame id="experience">
      <SectionCardStack id="experience" />
    </FocusFrame>
  );
}
