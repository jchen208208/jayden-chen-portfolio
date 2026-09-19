import { SKILLS_BOX_ITEMS, SKILLS_BOX_TITLES, type SkillItem } from "../skillItems";
import type { CardOptions, SectionCard } from "./shared";

/** every card gets as many rows as the longest list needs, three to a row,
 *  so rows are the same height in all three cards and icons line up across
 *  them — a shorter list simply leaves its last rows empty */
const COLUMNS = 3;
const ROWS = Math.ceil(Math.max(...SKILLS_BOX_ITEMS.map((items) => items.length)) / COLUMNS);

/**
 * Row layout: the card's height is dictated from outside, so the grid takes
 * what's left of it and divides that into `ROWS` equal rows, and each icon
 * tile is as big as its cell leaves room for — the largest square that fits
 * both the cell's width and what's left of its height once the label has
 * taken its share (`min(100cqw, 100cqh)` against a size container).
 *
 * The vertical padding is deliberately uneven: each label reserves two lines
 * (`h-8`) but most use one, and moving 8px from the
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
    <div
      className="grid min-h-0 flex-1 grid-cols-3 justify-items-center gap-x-5 gap-y-5 px-6 pt-8 pb-4"
      style={{ gridTemplateRows: `repeat(${ROWS}, minmax(0, 1fr))` }}
    >
      {items.map((item) => (
        <div key={item.name} className="flex min-h-0 w-full flex-col items-center gap-2.5">
          <div
            className="flex min-h-0 w-full flex-1 items-center justify-center"
            style={{ containerType: "size" }}
          >
            <div
              className={`flex aspect-square items-center justify-center rounded-lg border-2 border-white text-white ${item.iconPadding ?? "p-3"}`}
              style={{ width: "min(100cqw, 100cqh)" }}
            >
              <item.Icon className="h-full w-full" />
            </div>
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
