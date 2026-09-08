import type { Metadata } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

// Mileast — display face for the hero name + primary buttons. Local .otf, see /font.
const mileast = localFont({
  variable: "--font-mileast",
  display: "swap",
  src: [
    { path: "./fonts/Mileast.otf", weight: "400", style: "normal" },
    { path: "./fonts/Mileast-Italic.otf", weight: "400", style: "italic" },
  ],
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

export const metadata: Metadata = {
  title: "Jayden Chen — Portfolio",
  description:
    "Jayden Chen — developer. Projects, experience, skills and awards, set in a birch forest at golden hour.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fraunces.variable} ${inter.variable} ${jetbrainsMono.variable} ${mileast.variable} h-full bg-paper antialiased`}
    >
      {/* suppressHydrationWarning: the user's browser runs an extension (QuillBot)
          that mutates the DOM before hydration.
          No background on <body> — see globals.css (the -z-10 forest backdrop). */}
      <body suppressHydrationWarning className="min-h-full text-ink">
        {children}
      </body>
    </html>
  );
}
