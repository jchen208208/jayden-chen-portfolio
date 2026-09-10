import type { Metadata } from "next";
import FocusFrame from "@/components/focus/FocusFrame";
import SkillsApp from "@/components/apps/SkillsApp";

export const metadata: Metadata = { title: "Skills — Jayden Chen" };

export default function SkillsPage() {
  return (
    <FocusFrame id="skills">
      <SkillsApp />
    </FocusFrame>
  );
}
