"use client";

import { useLayoutEffect, useSyncExternalStore, type CSSProperties } from "react";
import { usePathname } from "next/navigation";
import { DEFAULT_THEME, THEMES, applyTheme, savedTheme } from "@/lib/theme";

/**
 * The theme bar: a dev-tools strip of swatches that swaps the site's one
 * light (`--glow` and its shades) for another. On the main page it sits in
 * the footer (`SiteFooter`); everywhere else it floats in the bottom-right
 * corner — the section pages, the résumé, and a section opened from the desk
 * on the main page itself (`data-desk-open`), which covers the footer.
 * The choice is kept in localStorage and put back on <html> before paint by
 * `THEME_SCRIPT` in the root layout; the active swatch is read straight off
 * <html>, so it's right whoever set it.
 */

function subscribe(onChange: () => void) {
  const mo = new MutationObserver(onChange);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "data-desk-open"] });
  return () => mo.disconnect();
}

const current = () => document.documentElement.dataset.theme ?? DEFAULT_THEME;
const deskOpen = () => document.documentElement.dataset.deskOpen !== undefined;

export default function ThemeBar({ floating = false }: { floating?: boolean }) {
  const theme = useSyncExternalStore(subscribe, current, () => DEFAULT_THEME);
  const sectionOverDesk = useSyncExternalStore(subscribe, deskOpen, () => false);
  const pathname = usePathname();

  // in dev, Strict Mode's remount resets <html> to its JSX attributes,
  // dropping the theme the head script set — put it back before paint
  useLayoutEffect(() => {
    const saved = savedTheme();
    if (saved) document.documentElement.dataset.theme = saved;
  }, []);

  // the main page has the footer's own — unless a section is open over it
  if (floating && pathname === "/" && !sectionOverDesk) return null;

  return (
    <div role="group" aria-label="Colour theme" className={floating ? "theme-bar theme-bar-float" : "theme-bar"}>
      {THEMES.map((t) => (
        <button
          key={t.id}
          type="button"
          aria-label={t.id}
          aria-pressed={theme === t.id}
          title={t.id}
          className="theme-swatch"
          style={{ "--swatch": t.swatch } as CSSProperties}
          onClick={() => applyTheme(t.id)}
        />
      ))}
    </div>
  );
}
