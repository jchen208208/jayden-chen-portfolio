/**
 * The soldering station, traced from
 * `designs/reference/soldering_kit_reference.webp` — drawn in that image's own
 * pixel space (476×280), so every coordinate below can be checked straight
 * against the reference. Shared by the desk (`DeskSvg`, which scales it down
 * onto the 3D printer) and the "Soldering" skill tile (`SolderingIcon` in
 * `skillItems`), so the two can never drift apart.
 *
 * Outline style like the rest of the desk: stroke comes from the parent
 * `<g>`/`<svg>`, every shape carries an opaque `paper` fill so parts in front
 * hide parts behind, and the reference's solid black details (the shaft's
 * vent holes) are small `ink` dots. Painted back to front:
 *
 *   spring → clamp → cord → iron → iron rest → base → buttons + dial
 */

/** the reference-space box the drawing occupies, stroke included — the
 *  skill icon uses it as its viewBox */
export const SOLDERING_BOUNDS = { x: 64, y: 36, w: 324, h: 210 };
/** underside of the two feet, in reference space */
export const SOLDERING_FEET_Y = 238;
/** the iron is drawn smaller than in the reference, relative to the base */
const IRON_SCALE = 0.75;

export default function SolderingStation({
  ink,
  paper,
  strokeWidth,
}: {
  ink: string;
  paper: string;
  /** the parent's line weight, in reference units — the cord is drawn heavier */
  strokeWidth: number;
}) {
  return (
    <>
      {/* coiled spring — a side-on helix rising along the tray's slope, its
          lead wire looping up out of the slope and its far end tucked under
          the clamp */}
      <path
        d="M88 198 C72 192 70 162 82 161
           L80.2 163.7 L79.2 168.5 L79.5 173.7 L81.3 178 L84.5 179.8
           L88.5 178.5 L92.5 174.3 L95.7 168 L97.5 161.3 L97.8 155.5 L96.8 152.2
           L95 152 L93.2 154.7 L92.2 159.5 L92.5 164.7 L94.3 169 L97.5 170.8
           L101.5 169.5 L105.5 165.3 L108.7 159 L110.5 152.3 L110.8 146.5 L109.8 143.2
           L108 143 L106.2 145.7 L105.2 150.5 L105.5 155.7 L107.3 160 L110.5 161.8
           L114.5 160.5 L118.5 156.3 L121.7 150 L123.5 143.3 L123.8 137.5 L122.8 134.2
           L121 134 L119.2 136.7 L118.2 141.5 L118.5 146.7 L120.3 151 L123.5 152.8
           L127.5 151.5 L131.5 147.3 L134.7 141 L136.5 134.3 L136.8 128.5 L135.8 125.2
           L134 125 L132.2 127.7 L131.2 132.5 L131.5 137.7 L133.3 142 L136.5 143.8
           L140.5 142.5 L144.5 138.3 L147.7 132 L149.5 125.3 L149.8 119.5 L148.8 116.2
           L147 116 L145.2 118.7 L144.2 123.5 L144.5 128.7 L146.3 133 L149.5 134.8
           L153.5 133.5 L157.5 129.3 L160.7 123 L162.5 116.3 L162.8 110.5 L161.8 107.2
           L160 107"
      />
      {/* clamp capping the top of the spring */}
      <path d="M148 105 L156 98 L174 121 L166 128 Z" fill={paper} />

      {/* cord — out of the strain relief, swinging round and back into the
          base's right edge (drawn before the base so the base covers its end) */}
      <path d="M355 147 C392 163 392 205 314 205" strokeWidth={strokeWidth * 1.35} />

      {/* the iron, laid out along its own axis (tip at the origin, +x toward
          the cord) and swung 24.5° into place, then shrunk relative to the
          base about the point where it rests on the stand. The line weight
          is scaled back up so the iron doesn't draw thinner than the rest */}
      <g
        transform={`translate(86 23) rotate(24.5) translate(201 3) scale(${IRON_SCALE}) translate(-201 -3)`}
        strokeWidth={strokeWidth / IRON_SCALE}
      >
        {/* strain relief */}
        <path d="M296 -11 L331 -6 Q335 -5.5 335 -2 L335 2 Q335 5.5 331 6 L296 11 Z" fill={paper} />
        {/* handle — a long box with softly rounded rear corners — and its four grip ridges */}
        <path d="M174 -15 L292 -14 Q302 -14 302 -4 L302 4 Q302 14 292 14 L174 15 Z" fill={paper} />
        <line x1={186} y1={4} x2={288} y2={3} opacity={0.3} />
        {[246, 257, 268, 279].map((gx) => (
          <line key={gx} x1={gx} y1={-11} x2={gx} y2={-5} />
        ))}
        {/* heating shaft tapering to the tip, with its vent holes */}
        <path d="M0 0 L146 -9 L146 9 Z" fill={paper} />
        {[
          [106, -3],
          [112, 3],
          [118, -3.5],
          [124, 2.5],
          [130, -3],
          [135, 3.5],
          [140, -2],
        ].map(([hx, hy]) => (
          <circle key={hx} cx={hx} cy={hy} r={2.4} fill={ink} stroke="none" />
        ))}
        {/* retaining ring near the tip */}
        <rect x={34} y={-12} width={4} height={24} rx={2} fill={paper} />
        {/* collar nut with its two slots, then the ring where it meets the handle */}
        <rect x={143} y={-19} width={24} height={38} rx={4} fill={paper} />
        <line x1={150} y1={-10} x2={158} y2={-10} />
        <line x1={150} y1={10} x2={158} y2={10} />
        <rect x={166} y={-24} width={12} height={48} rx={5} fill={paper} />
      </g>

      {/* iron rest — a tilted slab rising from behind the base and crossing
          in front of the handle, with a pivot bolt */}
      <path
        d="M228 163 L250 114 Q254 107 262 108 L282 111 Q294 113 293 126 L286 163 Z"
        fill={paper}
      />
      <circle cx={270} cy={125} r={6.5} fill={paper} />

      {/* base — the sloped sponge-tray wedge behind, then the front face,
          whose top edge runs from the wedge's foot up to the flat top */}
      <path d="M73 208 L172 136 L192 163 Z" fill={paper} />
      <path d="M73 208 L192 163 L306 163 Q313 163 313 170 L313 230 L73 230 Z" fill={paper} />
      <rect x={91} y={230} width={16} height={8} rx={1.5} fill={paper} />
      <rect x={279} y={230} width={16} height={8} rx={1.5} fill={paper} />

      {/* two indicator lights and the temperature dial */}
      <circle cx={198} cy={180} r={5.5} fill={paper} />
      <circle cx={198} cy={197} r={5.5} fill={paper} />
      <circle cx={242} cy={195} r={31} fill={paper} />
      <circle cx={242} cy={195} r={19} fill={paper} />
      <line x1={242} y1={179} x2={242} y2={190} />
      <line x1={220} y1={180} x2={224} y2={183} />

    </>
  );
}
