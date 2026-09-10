import { DESK_VIEWBOX } from "@/lib/desk";
import DeskSvg from "./DeskSvg";
import DeskCardList from "./DeskCardList";

/**
 * The desk. On wider screens it's the drawn side-elevation scene; on phones it
 * falls back to the stacked card list.
 *
 * The clickable screen overlay (`DeskScreens`) is temporarily removed while the
 * furniture is being drawn — it goes back on once the desk reads right.
 */
export default function DeskScene({ className }: { className?: string }) {
  return (
    <div className={className}>
      <div className="mx-auto hidden w-full max-w-[1180px] px-4 md:block">
        <div
          className="relative w-full"
          style={{ aspectRatio: `${DESK_VIEWBOX.w} / ${DESK_VIEWBOX.h}` }}
        >
          <DeskSvg className="absolute inset-0 h-full w-full" />
        </div>
      </div>

      <div className="md:hidden">
        <DeskCardList />
      </div>
    </div>
  );
}
