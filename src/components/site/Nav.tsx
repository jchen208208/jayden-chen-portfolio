"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { NAV } from "@/lib/site";
import { EASE_OUT } from "./motion";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
      // near the top we're in the hero — clear any lingering section highlight
      if (window.scrollY < 120) setActive("");
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const ids = NAV.map((n) => n.href.slice(1));
    const els = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (els.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(`#${visible.target.id}`);
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.25, 0.5, 1] },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <motion.nav
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: EASE_OUT }}
      className={`fixed inset-x-0 top-0 z-40 transition-colors duration-300 ${
        scrolled ? "frost border-b border-line" : ""
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
        <Link
          href="#top"
          className="flex items-center gap-2 font-mono text-sm tracking-[0.2em] text-ink"
          aria-label="Back to top"
        >
          <span
            aria-hidden
            className="inline-block h-4 w-4 rounded-full"
            style={{
              background:
                "radial-gradient(circle at 30% 30%, var(--sun-soft), var(--ember))",
            }}
          />
          JC
        </Link>

        <div className="hidden gap-7 text-sm sm:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`relative py-1 transition-colors ${
                active === item.href
                  ? "text-ink"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              {item.label}
              {active === item.href && (
                <motion.span
                  layoutId="nav-underline"
                  className="absolute inset-x-0 -bottom-0.5 h-px bg-ember"
                  transition={{ duration: 0.35, ease: EASE_OUT }}
                />
              )}
            </Link>
          ))}
        </div>

        <Link
          href="/resume"
          className="rounded-full border border-line px-4 py-1.5 text-sm text-ink transition-colors hover:border-ember hover:text-ember"
        >
          Résumé
        </Link>
      </div>
    </motion.nav>
  );
}
