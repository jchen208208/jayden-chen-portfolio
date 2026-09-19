import type { Metadata } from "next";
import FocusFrame from "@/components/focus/FocusFrame";
import { SectionCardStack } from "@/components/desk/sections";

export const metadata: Metadata = { title: "Skills — Jayden Chen" };

export default function SkillsPage() {
  return (
    <FocusFrame id="skills">
      <SectionCardStack id="skills" />
    </FocusFrame>
  );
}
