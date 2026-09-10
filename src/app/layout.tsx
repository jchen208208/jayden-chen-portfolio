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
    "Jayden Chen — Computer Engineering @ Waterloo. A portfolio built around the desk: four screens, one for each of projects, experience, skills, and about.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${fraunces.variable} ${inter.variable} ${jetbrainsMono.variable} ${mileast.variable} h-full antialiased`}
    >
      {/* suppressHydrationWarning: the user's browser runs an extension (QuillBot)
          that mutates the DOM before hydration. */}
      <body suppressHydrationWarning className="min-h-full bg-paper text-ink">
        {children}
      </body>
    </html>
  );
}
