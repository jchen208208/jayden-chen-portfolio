import type { Metadata } from "next";
import FocusFrame from "@/components/focus/FocusFrame";
import { SectionCardStack } from "@/components/desk/sections";

export const metadata: Metadata = { title: "Projects — Jayden Chen" };

export default function ProjectsPage() {
  return (
    <FocusFrame id="projects">
      <SectionCardStack id="projects" />
    </FocusFrame>
  );
}
