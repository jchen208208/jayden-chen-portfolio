import { Suspense } from "react";
import type { Metadata } from "next";
import FocusFrame from "@/components/focus/FocusFrame";
import ProjectsApp from "@/components/apps/ProjectsApp";

export const metadata: Metadata = { title: "Projects — Jayden Chen" };

export default function ProjectsPage() {
  return (
    <FocusFrame id="projects">
      <Suspense fallback={null}>
        <ProjectsApp />
      </Suspense>
    </FocusFrame>
  );
}
