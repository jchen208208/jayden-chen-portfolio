import Link from "next/link";
import { SECTION_ORDER, SECTIONS } from "@/lib/site";
import ViewTransition from "@/components/motion/ViewTransition";
import ScreenPreview from "./ScreenPreview";

/**
 * Mobile fallback for the desk: the four screens as a plain stacked list of
 * tappable cards. No SVG, no decor.
 */
export default function DeskCardList() {
  return (
    <ul className="mx-auto flex w-full max-w-md flex-col gap-3 px-4">
      {SECTION_ORDER.map((id) => {
        const meta = SECTIONS[id];
        return (
          <li key={id}>
            <Link
              href={meta.route}
              className="flex items-stretch gap-3 overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] p-3 transition-colors hover:border-white/25"
            >
              <span
                aria-hidden
                className="w-1 shrink-0 rounded-full"
                style={{ background: `var(${meta.accentVar})` }}
              />
              <ViewTransition name={`screen-${id}`} share="morph" fallback="none">
                <span className="block aspect-[16/10] w-24 shrink-0 overflow-hidden rounded-md">
                  <ScreenPreview id={id} />
                </span>
              </ViewTransition>
              <span className="flex min-w-0 flex-col justify-center">
                <span className="font-mono text-sm text-white">{meta.deskLabel}</span>
                <span className="text-xs text-white/50">{meta.blurb}</span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
