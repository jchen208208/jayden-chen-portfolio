import type { Metadata } from "next";
import { Chakra_Petch, Fraunces, Inter, JetBrains_Mono, Tilt_Neon } from "next/font/google";
import "./globals.css";

// Chakra Petch (SIL OFL — free for commercial use) — the title face: section
// and card titles, the résumé button. The hero name is not text but squares
// (`ContributionName`).
const chakraPetch = Chakra_Petch({
  variable: "--font-chakra",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["SOFT", "opsz"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

// Tilt Neon — monoline, drawn to look like bent tubes: the desk's neon signs.
const tiltNeon = Tilt_Neon({
  variable: "--font-neon",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Jayden Chen — Portfolio",
  description:
    "Jayden Chen — Computer Engineering @ Waterloo. A portfolio built around the desk: four screens, one each for projects, skills, experience, and about.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${fraunces.variable} ${inter.variable} ${jetbrainsMono.variable} ${chakraPetch.variable} ${tiltNeon.variable} h-full antialiased`}
    >
      {/* suppressHydrationWarning: the user's browser runs an extension (QuillBot)
          that mutates the DOM before hydration. */}
      <body suppressHydrationWarning className="min-h-full bg-paper text-ink">
        {children}
      </body>
    </html>
  );
}
