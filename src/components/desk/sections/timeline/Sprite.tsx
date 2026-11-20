import { INK, toPaths } from "../pixelArt";

/** a letter-grid drawing (`pixelArt.ts`) as crisp inline SVG, in the
 *  theme's light */
export function Sprite({
  rows,
  px,
  className,
}: {
  rows: readonly string[];
  px: number;
  className?: string;
}) {
  const w = rows[0].length;
  const h = rows.length;
  return (
    <svg
      aria-hidden
      className={className}
      viewBox={`0 0 ${w} ${h}`}
      width={w * px}
      height={h * px}
      shapeRendering="crispEdges"
    >
      {toPaths(rows).map((s) => (
        <path key={s.letter} d={s.d} fill={INK[s.letter]} />
      ))}
    </svg>
  );
}

/** two beamed eighth notes, each head with a glint */
export const NOTES = [
  ".....dddddddddddd",
  ".....dppppppppppd",
  ".....dppppppppppd",
  ".....dpddddddddpd",
  ".....dpd......dpd",
  ".....dpd......dpd",
  ".....dpd......dpd",
  ".....dpd......dpd",
  ".....dpd......dpd",
  ".....dpd......dpd",
  ".....dpd......dpd",
  ".....dpd......dpd",
  ".dddddpd..dddddpd",
  "dpwppppd.dpwppppd",
  "dppppppd.dppppppd",
  ".dppppd...dppppd.",
  "..dddd.....dddd..",
] as const;
