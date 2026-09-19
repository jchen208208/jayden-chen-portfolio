import Link from "next/link";
import { SECTION_ORDER, SECTIONS } from "@/lib/site";

/**
 * Mobile fallback for the desk: the four screens as a plain stacked list of
 * tappable cards, each wearing the same white title strip as its screen on
 * the desk. No SVG, no decor. Each opens its section as a page of stacked
 * `ScreenCard`s — the same cards the desktop overlay shows.
 */
export default function DeskCardList() {
  return (
    <ul className="mx-auto flex w-full max-w-md flex-col gap-4 px-4">
      {SECTION_ORDER.map((id) => {
        const meta = SECTIONS[id];
        return (
          <li key={id}>
            <Link
              href={meta.route}
              className="flex flex-col overflow-hidden rounded-[16px] border-[3px] border-white transition-opacity hover:opacity-85"
            >
              <span className="bg-white px-4 py-2.5 text-center font-mono text-lg font-semibold uppercase text-paper">
                {meta.screenLabel}
              </span>
              <span className="flex items-center justify-between gap-3 px-4 py-3 font-mono text-xs text-white/70">
                {meta.blurb}
                <span aria-hidden className="text-white/50">
                  →
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
