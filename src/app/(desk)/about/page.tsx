import type { Metadata } from "next";
import FocusFrame from "@/components/focus/FocusFrame";
import AboutApp from "@/components/apps/AboutApp";

export const metadata: Metadata = { title: "About — Jayden Chen" };

export default function AboutPage() {
  return (
    <FocusFrame id="about">
      <AboutApp />
    </FocusFrame>
  );
}
