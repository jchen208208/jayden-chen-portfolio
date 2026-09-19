import { SKILLS_BOX_ITEMS, SKILLS_BOX_TITLES, type SkillItem } from "../skillItems";
import type { CardOptions, SectionCard } from "./shared";

/**
 * Row layout: the card's height is dictated from outside, so the grid takes
 * what's left of it and divides that into three equal rows — `grid-rows-3`
 * rather than auto rows — and each icon tile is as big as its row leaves room
 * for. That also keeps every card's rows the same height, so icons line up
 * across all three cards. The vertical padding is deliberately uneven: each
 * label reserves two lines (`h-8`) but most use one, and moving 8px from the
 * bottom to the top is what makes the gap above the first row and below the
 * last row's text look equal.
 *
 * Stack layout has no outside height to divide, so tiles get a fixed size.
 */
function SkillGrid({ items, layout }: { items: SkillItem[]; layout: CardOptions["layout"] }) {
  if (layout === "stack") {
    return (
      <div className="grid grid-cols-3 gap-x-4 gap-y-5 px-4 py-6">
        {items.map((item) => (
          <div key={item.name} className="flex flex-col items-center gap-2">
            <div
              className={`flex h-16 w-16 items-center justify-center rounded-lg border-2 border-white text-white ${item.iconPadding ?? "p-3"}`}
            >
              <item.Icon className="h-full w-full" />
            </div>
            <span className="text-center font-mono text-[11px] uppercase leading-tight tracking-wide text-white">
              {item.name}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="grid min-h-0 flex-1 grid-cols-3 grid-rows-3 justify-items-center gap-x-5 gap-y-5 px-6 pt-8 pb-4">
      {items.map((item) => (
        <div key={item.name} className="flex min-h-0 w-full flex-col items-center gap-2.5">
          <div
            className={`flex aspect-square min-h-0 flex-1 items-center justify-center rounded-lg border-2 border-white text-white ${item.iconPadding ?? "p-3"}`}
          >
            <item.Icon className="h-full w-full" />
          </div>
          {/* fixed two-line height, so a long name can't make its row taller
              than the same row in the next card */}
          <span className="h-8 shrink-0 text-center font-mono text-xs uppercase leading-tight tracking-wide text-white">
            {item.name}
          </span>
        </div>
      ))}
    </div>
  );
}

export function skillsCards({ layout }: CardOptions): SectionCard[] {
  return SKILLS_BOX_TITLES.map((title, i) => ({
    key: title,
    title,
    body: <SkillGrid items={SKILLS_BOX_ITEMS[i]} layout={layout} />,
  }));
}
