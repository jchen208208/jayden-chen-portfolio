import { DESK_PATHS, DESK_VIEWBOX, SCREENS } from "@/lib/desk";

/**
 * The flat desk, drawn in one light key on black. Decorative only — every
 * interactive element is a real <Link> in the sibling overlay layer. Placeholder
 * geometry: retrace `DESK_PATHS` / `SCREENS` from the reference image later.
 */
export default function DeskSvg({ className }: { className?: string }) {
  const { w, h } = DESK_VIEWBOX;
  const DESK_Y = 600; // top of the desk surface — where stands land

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={className}
      aria-hidden
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="desk-surface" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1b1f26" />
          <stop offset="1" stopColor="#12151b" />
        </linearGradient>
        <linearGradient id="desk-glass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0c0e12" />
          <stop offset="1" stopColor="#070809" />
        </linearGradient>
      </defs>

      {/* ── stands + laptop bases (behind the desk edge) ─────────────────── */}
      {SCREENS.map((s) => {
        const cx = s.x + s.w / 2;
        const bezelBottom = s.y + s.h + 10;
        if (s.kind === "monitor") {
          return (
            <g key={`stand-${s.id}`} fill="#171b22" stroke="#242a33" strokeWidth="2">
              <rect x={cx - 12} y={bezelBottom} width="24" height={DESK_Y - bezelBottom} />
              <rect x={cx - 90} y={DESK_Y - 12} width="180" height="16" rx="4" />
            </g>
          );
        }
        return (
          <path
            key={`base-${s.id}`}
            d={`M${s.x - 16} ${bezelBottom} L${s.x + s.w + 16} ${bezelBottom} L${
              s.x + s.w + 34
            } ${bezelBottom + 16} L${s.x - 34} ${bezelBottom + 16} Z`}
            fill="#1a1e26"
            stroke="#242a33"
            strokeWidth="2"
          />
        );
      })}

      {/* ── the desk ────────────────────────────────────────────────────── */}
      <path d={DESK_PATHS.legL} fill="#0b0d11" />
      <path d={DESK_PATHS.legR} fill="#0b0d11" />
      <path d={DESK_PATHS.deskTop} fill="url(#desk-surface)" stroke="#262b33" strokeWidth="2" />
      <path d={DESK_PATHS.deskFront} fill="#0e1116" stroke="#20242c" strokeWidth="2" />

      {/* ── hardware side: a bare PCB flat on the desk (left) ────────────── */}
      <g>
        <path d="M96 636 L306 628 L322 672 L108 682 Z" fill="#0c1411" stroke="var(--accent-skills)" strokeOpacity="0.35" strokeWidth="2" />
        <g stroke="var(--accent-skills)" strokeOpacity="0.25" strokeWidth="2" fill="none">
          <path d="M128 648 L200 645 L214 663" />
          <path d="M150 672 L232 668 L258 650" />
        </g>
        <g fill="#1c2530">
          <rect x="176" y="640" width="30" height="16" />
          <rect x="238" y="650" width="20" height="14" />
          <circle cx="150" cy="666" r="4" />
          <circle cx="286" cy="642" r="4" />
        </g>
      </g>

      {/* ── hardware side: a 3D printer on the desk (right) ──────────────── */}
      <g stroke="#2b323d" strokeWidth="2" fill="#0f131a">
        <rect x="1258" y="430" width="182" height="170" rx="6" />
        <rect x="1276" y="470" width="146" height="96" fill="#080a0d" />
        <line x1="1276" y1="492" x2="1422" y2="492" stroke="#39414d" />
        <rect x="1338" y="482" width="22" height="18" fill="#161b22" />
        <rect x="1266" y="566" width="166" height="14" fill="#12161d" />
      </g>
      <line x1="1349" y1="500" x2="1349" y2="556" stroke="var(--accent-skills)" strokeOpacity="0.4" strokeWidth="3" />

      {/* ── screen bodies + glass (drawn last, always on top) ────────────── */}
      {SCREENS.map((s) => {
        const b = 10;
        return (
          <g key={`screen-${s.id}`}>
            <rect
              x={s.x - b}
              y={s.y - b}
              width={s.w + b * 2}
              height={s.h + b * 2}
              rx="10"
              fill="#0d0f13"
              stroke="#2a3039"
              strokeWidth="2"
            />
            <rect x={s.x} y={s.y} width={s.w} height={s.h} rx="3" fill="url(#desk-glass)" />
          </g>
        );
      })}
    </svg>
  );
}
