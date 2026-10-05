/**
 * The soldering station, traced from
 * `designs/reference/soldering_kit_reference.webp` — drawn in that image's own
 * pixel space (476×280), so every coordinate below can be checked straight
 * against the reference. `DeskSvg` scales it down onto the 3D printer.
 *
 * Kept to the desk's level of detail (the 3D printer's): the parts that say
 * what it is — the spring holder, the iron on its rest, the base with its
 * lights and dial — without the reference's finest marks (vent holes, a
 * second ring and slotted nut on the shaft, extra grip ridges).
 *
 * Outline style like the rest of the desk: stroke comes from the parent
 * `<g>`/`<svg>`, and every shape carries an opaque `paper` fill so parts in
 * front hide parts behind. Painted back to front:
 *
 *   spring → clamp → cord → iron → iron rest → base → lights + dial
 */

/** underside of the two feet, in reference space */
export const SOLDERING_FEET_Y = 238;
/** the iron is drawn smaller than in the reference, relative to the base */
const IRON_SCALE = 0.75;

export default function SolderingStation({
  paper,
  strokeWidth,
}: {
  paper: string;
  /** the parent's line weight, in reference units — the cord is drawn heavier */
  strokeWidth: number;
}) {
  return (
    <>
      {/* coiled spring — four turns rising along the tray's slope, its lead
          wire looping up out of the slope and its far end tucked under the
          clamp */}
      <path
        d="M88 198 C72 192 70 162 82 161
           L79 164.6 L76.5 170.4 L75.7 176.3 L77.1 180.9 L80.9 182.3 L86.6 179.8
           L92.9 174 L98.7 165.9 L102.7 157.7 L104.4 150.9 L103.9 147.3 L101.5 147.5
           L98.5 151.1 L96 156.9 L95.2 162.8 L96.6 167.4 L100.4 168.8 L106.1 166.3
           L112.4 160.5 L118.2 152.4 L122.2 144.2 L123.9 137.4 L123.4 133.8 L121 134
           L118 137.6 L115.5 143.4 L114.7 149.3 L116.1 153.9 L119.9 155.3 L125.6 152.8
           L131.9 147 L137.7 138.9 L141.7 130.7 L143.4 123.9 L142.9 120.3 L140.5 120.5
           L137.5 124.1 L135 129.9 L134.2 135.8 L135.6 140.4 L139.4 141.8 L145.1 139.3
           L151.4 133.5 L157.2 125.4 L161.2 117.2 L162.9 110.4 L162.4 106.8 L160 107"
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
        {/* handle — a long box with softly rounded rear corners — and two grip ridges */}
        <path d="M174 -15 L292 -14 Q302 -14 302 -4 L302 4 Q302 14 292 14 L174 15 Z" fill={paper} />
        {[255, 272].map((gx) => (
          <line key={gx} x1={gx} y1={-11} x2={gx} y2={-5} />
        ))}
        {/* heating shaft: a straight rod, pointed only at the very tip */}
        <path d="M0 0 L16 -4.5 L146 -4.5 L146 4.5 L16 4.5 Z" fill={paper} />
        {/* collar nut, then the ring where it meets the handle */}
        <rect x={143} y={-19} width={24} height={38} rx={4} fill={paper} />
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
    </>
  );
}
