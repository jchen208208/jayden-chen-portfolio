import type { CSSProperties } from "react";
import { SKILLS_BOX_ITEMS, SKILLS_BOX_TITLES, type SkillItem } from "../skillItems";
import type { CardOptions, SectionCard } from "./shared";

/**
 * Each Skills card is a grid of icon tiles, three across, filling the card.
 *
 * Row layout: the card body is a size container, and everything is sized from
 * it. Tiles sit exactly `--g` apart, and `--g` in from the card's sides and
 * bottom (`TOP_GAPS` times that from its top, so the grid sits well clear of
 * the title), and
 * the tile is the largest square that allows while still fitting the longest
 * list's rows (`ROWS`) and labels. That keeps all three cards' tiles the same
 * size. The grid is pinned to the top of the card, so a shorter list, like
 * Hardware's single row, leaves its spare space at the bottom. If the card is
 * too short for width-sized tiles, they shrink to fit and the row centres
 * itself, so the side margins grow rather than the gaps.
 *
 * Stack layout has no outside height to divide, so tiles get a fixed size.
 */
const COLUMNS = 3;
const ROWS = Math.ceil(Math.max(...SKILLS_BOX_ITEMS.map((items) => items.length)) / COLUMNS);
/** how many `--g`s of space above the first row */
const TOP_GAPS = 3.5;
/** default icon inset inside its tile, as a fraction of the tile */
const ICON_INSET = 0.18;

const gridVars = {
  // the spacing between tiles, and between the tiles and the border
  "--g": "clamp(0.75rem, 4cqw, 1.5rem)",
  // label type — grows with the card, up from the old flat text-xs/text-sm
  "--fs": "clamp(16px, 3.8cqw, 23px)",
  // a label's block: gap above it plus room for two lines
  "--lab": "calc(0.75rem + var(--fs) * 2.5)",
  "--tile": `min(calc((100cqw - ${COLUMNS + 1} * var(--g)) / ${COLUMNS}), calc((100cqh - ${ROWS + TOP_GAPS} * var(--g)) / ${ROWS} - var(--lab)))`,
  gridTemplateColumns: `repeat(${COLUMNS}, var(--tile))`,
  gridAutoRows: "calc(var(--tile) + var(--lab))",
  columnGap: "var(--g)",
  rowGap: "var(--g)",
  padding: `calc(var(--g) * ${TOP_GAPS}) var(--g) var(--g)`,
  justifyContent: "center",
  alignContent: "start",
} as CSSProperties;

function RowTile({ item }: { item: SkillItem }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className="flex shrink-0 items-center justify-center rounded-lg border-2 border-white text-white"
        style={{
          width: "var(--tile)",
          height: "var(--tile)",
          padding: `calc(var(--tile) * ${item.iconInset ?? ICON_INSET})`,
        }}
      >
        <item.Icon className="h-full w-full" />
      </div>
      {/* wider than the tile (it may use the spacing either side), and two
          lines tall whether it needs them or not, so every row is the same */}
      <span
        className="mt-3 line-clamp-2 shrink-0 text-center font-[Consolas,Lucida_Console,DejaVu_Sans_Mono,Menlo,monospace] uppercase leading-[1.25] tracking-wide text-white"
        style={{
          fontSize: "var(--fs)",
          height: "calc(var(--fs) * 2.5)",
          width: "calc(var(--tile) + var(--g))",
        }}
      >
        {item.name}
      </span>
    </div>
  );
}

function SkillGrid({ items, layout }: { items: SkillItem[]; layout: CardOptions["layout"] }) {
  if (layout === "stack") {
    return (
      <div className="grid grid-cols-3 gap-x-4 gap-y-5 px-4 py-6">
        {items.map((item) => (
          <div key={item.name} className="flex flex-col items-center gap-2">
            <div
              className="flex size-16 items-center justify-center rounded-lg border-2 border-white text-white"
              style={{ padding: `${(item.iconInset ?? ICON_INSET) * 4}rem` }}
            >
              <item.Icon className="h-full w-full" />
            </div>
            <span className="line-clamp-2 text-center font-[Consolas,Lucida_Console,DejaVu_Sans_Mono,Menlo,monospace] text-xs uppercase leading-tight tracking-wide text-white">
              {item.name}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="min-h-0 flex-1" style={{ containerType: "size" }}>
      <div className="grid h-full w-full" style={gridVars}>
        {items.map((item) => (
          <RowTile key={item.name} item={item} />
        ))}
      </div>
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
