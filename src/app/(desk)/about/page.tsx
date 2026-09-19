import type { Metadata } from "next";
import FocusFrame from "@/components/focus/FocusFrame";
import { SectionCardStack } from "@/components/desk/sections";

export const metadata: Metadata = { title: "Personal & Awards — Jayden Chen" };

export default function AboutPage() {
  return (
    <FocusFrame id="about">
      <SectionCardStack id="about" />
    </FocusFrame>
  );
}
