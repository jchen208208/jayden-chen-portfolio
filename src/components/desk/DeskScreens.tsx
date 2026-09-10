import Link from "next/link";
import { SCREEN_ORDER, screenById, screenPercentBox } from "@/lib/desk";
import { SECTIONS } from "@/lib/site";
import ViewTransition from "@/components/motion/ViewTransition";
import ScreenPreview from "./ScreenPreview";

/**
 * The interactive layer: one real <Link> per screen, absolutely positioned in
 * `%` of the desk viewBox so each stays glued to its SVG glass rect at every
 * width. Real DOM = real focus order, Enter-to-open, hover, and route prefetch.
 */
export default function DeskScreens() {
  return (
    <div className="absolute inset-0">
      {SCREEN_ORDER.map((id) => {
        const s = screenById(id);
        const meta = SECTIONS[id];
        return (
          <Link
            key={id}
            href={meta.route}
            aria-label={`Open ${meta.deskLabel} — ${meta.appName}`}
            style={screenPercentBox(s)}
            className="group absolute block rounded-[4px] outline-none transition-transform duration-300 hover:-translate-y-[3px] focus-visible:-translate-y-[3px]"
          >
            <span
              aria-hidden
              className="absolute -inset-[6px] rounded-md opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
              style={{
                boxShadow: `0 0 0 1px var(${meta.accentVar}), 0 0 34px -4px color-mix(in srgb, var(${meta.accentVar}) 60%, transparent)`,
              }}
            />
            <ViewTransition name={`screen-${id}`} share="morph" fallback="none">
              <span className="block h-full w-full">
                <ScreenPreview id={id} />
              </span>
            </ViewTransition>
          </Link>
        );
      })}
    </div>
  );
}
