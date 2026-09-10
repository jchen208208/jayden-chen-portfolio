import type { Metadata } from "next";
import FocusFrame from "@/components/focus/FocusFrame";
import ExperienceApp from "@/components/apps/ExperienceApp";

export const metadata: Metadata = { title: "Experience — Jayden Chen" };

export default function ExperiencePage() {
  return (
    <FocusFrame id="experience">
      <ExperienceApp />
    </FocusFrame>
  );
}
