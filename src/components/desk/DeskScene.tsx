import { DESK_VIEWBOX } from "@/lib/desk";
import DeskSvg from "./DeskSvg";
import DeskScreens from "./DeskScreens";
import DeskCardList from "./DeskCardList";

/**
 * The desk. Renders BOTH layouts and toggles them with CSS only (no JS media
 * query, no hydration flash): the SVG + overlay above `md`, the stacked card
 * list below it.
 */
export default function DeskScene({ className }: { className?: string }) {
  return (
    <div className={className}>
      {/* desktop / tablet: the drawn desk */}
      <div className="mx-auto hidden w-full max-w-[1120px] px-4 md:block">
        <div
          className="relative w-full"
          style={{ aspectRatio: `${DESK_VIEWBOX.w} / ${DESK_VIEWBOX.h}` }}
        >
          <DeskSvg className="absolute inset-0 h-full w-full" />
          <DeskScreens />
        </div>
      </div>

      {/* phone: stacked cards */}
      <div className="md:hidden">
        <DeskCardList />
      </div>
    </div>
  );
}
