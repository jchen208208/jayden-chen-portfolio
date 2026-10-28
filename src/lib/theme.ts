/**
 * The site's lights (`ThemeBar`): amber is its own, the rest stand in for it.
 * Each one's colours are in globals.css under `:root[data-theme]`; `swatch`
 * is its glow, repeated here for the bar's button.
 */
export const THEMES = [
  { id: "amber", swatch: "#ffbe5c" },
  { id: "blue", swatch: "#63b8ff" },
  { id: "green", swatch: "#5fe48c" },
  { id: "pink", swatch: "#ff8fbf" },
] as const;

export type Theme = (typeof THEMES)[number]["id"];

export const DEFAULT_THEME: Theme = "amber";

const KEY = "theme";
const IDS: readonly string[] = THEMES.map((t) => t.id);

/** the theme the visitor last picked, if it's still one of ours */
export function savedTheme(): Theme | null {
  try {
    const t = localStorage.getItem(KEY);
    return t && IDS.includes(t) ? (t as Theme) : null;
  } catch {
    return null;
  }
}

/** light the site in `theme`, and remember it */
export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(KEY, theme);
  } catch {}
}

/** run in <head> as the page is parsed, so a saved theme is on <html>
 *  before anything paints (no flash of amber first) */
export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(KEY)});if(${JSON.stringify(IDS)}.indexOf(t)>-1)document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;
