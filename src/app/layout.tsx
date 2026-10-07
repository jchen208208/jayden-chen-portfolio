import type { Metadata } from "next";
import { Chakra_Petch, Fraunces, Inter, JetBrains_Mono, Orbitron, VT323 } from "next/font/google";
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

// Orbitron (SIL OFL — free for commercial use) — the Skills page's face: its
// title, group labels, sticker names and the mat's ruler numbers. A techno
// step up from Chakra Petch; variable weight, so one file covers all of them.
const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
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

// VT323 (SIL OFL — free for commercial use) — the desk screens' face: each
// screen's section name. Traced from the DEC VT320 terminal's character set,
// so the glass reads as an old monitor; it pairs with the hero name's pixel
// squares.
const vt323 = VT323({
  variable: "--font-vt323",
  subsets: ["latin"],
  weight: "400",
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
      className={`${fraunces.variable} ${inter.variable} ${jetbrainsMono.variable} ${chakraPetch.variable} ${orbitron.variable} ${vt323.variable} h-full antialiased`}
    >
      {/* suppressHydrationWarning: the user's browser runs an extension (QuillBot)
          that mutates the DOM before hydration. */}
      <body suppressHydrationWarning className="min-h-full bg-paper text-ink">
        {children}
      </body>
    </html>
  );
}
