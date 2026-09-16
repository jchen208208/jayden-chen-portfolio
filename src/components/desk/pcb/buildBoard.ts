/**
 * Builds the board as three.js objects: the FR-4 slab with its painted copper
 * layers, plus a body for every populated component.
 *
 * Everything is built once, imperatively, and handed to R3F as a single
 * `<primitive>`. The board never changes, so there's nothing for the
 * reconciler to diff frame to frame — it just spins the group.
 */

import * as THREE from "three";
import {
  BOARD,
  BOARD_T,
  PCB,
  partLocalPadBounds,
  rad,
  toX,
  toY,
  type Part,
} from "./board";
import { paintLayer } from "./paintLayer";

/** how far the painted artwork floats above the laminate — enough to beat
 *  z-fighting at this camera distance, far too little to see */
const ART_LIFT = 0.006;

function boardShape() {
  const shape = new THREE.Shape();
  BOARD.outline.forEach(([x, y], i) => {
    const px = toX(x);
    const py = toY(y);
    if (i === 0) shape.moveTo(px, py);
    else shape.lineTo(px, py);
  });
  shape.closePath();
  return shape;
}

/** ShapeGeometry/ExtrudeGeometry both emit raw x/y as UVs; remap them to the
 *  board's bounding box so the painted layer lands 1:1 on the laminate */
function fitUvsToBounds(geo: THREE.BufferGeometry) {
  geo.computeBoundingBox();
  const bb = geo.boundingBox!;
  const w = bb.max.x - bb.min.x;
  const h = bb.max.y - bb.min.y;
  const pos = geo.attributes.position;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = (pos.getX(i) - bb.min.x) / w;
    uv[i * 2 + 1] = (pos.getY(i) - bb.min.y) / h;
  }
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
}

function layerTexture(side: "F" | "B") {
  const tex = new THREE.CanvasTexture(paintLayer(side));
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/* ---------- component bodies ---------- */

const mat = {
  ceramic: new THREE.MeshStandardMaterial({ color: "#c2a276", roughness: 0.55 }),
  resistor: new THREE.MeshStandardMaterial({ color: "#1b1c20", roughness: 0.5 }),
  termination: new THREE.MeshStandardMaterial({
    color: "#a8aeb6",
    roughness: 0.38,
    metalness: 0.6,
  }),
  plastic: new THREE.MeshStandardMaterial({ color: "#131519", roughness: 0.45 }),
  // A real RF can is stamped tinplate, not chrome. Kept mostly non-metallic
  // on purpose: at high metalness its big flat face just mirrors the studio
  // environment's white wall straight back at the camera, and the module
  // turns into a blank card twice a revolution.
  shield: new THREE.MeshStandardMaterial({
    color: "#4a4f57",
    roughness: 0.55,
    metalness: 0.3,
  }),
  substrate: new THREE.MeshStandardMaterial({ color: "#14181b", roughness: 0.7 }),
  button: new THREE.MeshStandardMaterial({ color: "#2b2e33", roughness: 0.4 }),
  led: new THREE.MeshStandardMaterial({
    color: PCB.accent,
    emissive: new THREE.Color(PCB.accent),
    // bright enough to read as lit, low enough to keep its colour instead
    // of clipping to white
    emissiveIntensity: 1.2,
    roughness: 0.25,
  }),
};

const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);

/** a body sitting on the board: `d` tall, resting on z = 0 and growing along
 *  `dir` (+1 front side, -1 back side) */
function slab(
  g: THREE.Group,
  material: THREE.Material,
  w: number,
  h: number,
  d: number,
  dir: number,
  x = 0,
  y = 0,
  z0 = 0,
) {
  const m = new THREE.Mesh(box(w, h, d), material);
  m.position.set(x, y, dir * (z0 + d / 2));
  m.castShadow = true;
  g.add(m);
  return m;
}

/** the meander antenna printed on the WROOM module's substrate */
function antennaTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 160;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#14181b";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.strokeStyle = "#c98a4a";
  ctx.lineWidth = 8;
  ctx.lineJoin = "miter";
  ctx.beginPath();
  // inverted-F feed, then a meander running across the tip of the module
  ctx.moveTo(128, 154);
  ctx.lineTo(128, 130);
  ctx.lineTo(26, 130);
  let up = true;
  for (let x = 26; x <= 230; x += 26) {
    ctx.lineTo(x, up ? 24 : 130);
    ctx.lineTo(x + 13, up ? 24 : 130);
    up = !up;
  }
  ctx.stroke();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function buildPart(p: Part): THREE.Group | null {
  const g = new THREE.Group();
  const dir = p.side === "F" ? 1 : -1;
  const b = p.box;

  // ESP32-S3-WROOM-1 — substrate, RF shield can, and the antenna at whichever
  // end carries no pads (derived from the footprint rather than assumed)
  if (p.lib.includes("ESP32-S3-WROOM")) {
    const w = b?.w ?? 18;
    const h = b?.h ?? 25.5;
    slab(g, mat.substrate, w, h, 0.8, dir);

    const padY = partLocalPadBounds(p);
    const lowGap = padY ? padY.lo - -h / 2 : 7.5;
    const highGap = padY ? h / 2 - padY.hi : 0;
    const antennaAtLow = lowGap >= highGap;
    const antLen = Math.max(5, Math.min(9, antennaAtLow ? lowGap : highGap));
    const antCenter = antennaAtLow ? -h / 2 + antLen / 2 : h / 2 - antLen / 2;

    // shield can fills what's left, inset from the substrate edges
    const canLen = h - antLen - 0.4;
    const canCenter = antennaAtLow ? h / 2 - canLen / 2 - 0.2 : -h / 2 + canLen / 2 + 0.2;
    slab(g, mat.shield, w - 2.2, canLen, 2.3, dir, 0, canCenter, 0.8);

    const ant = new THREE.Mesh(
      new THREE.PlaneGeometry(w - 2, antLen - 0.6),
      new THREE.MeshStandardMaterial({ map: antennaTexture(), roughness: 0.5 }),
    );
    ant.position.set(0, antCenter, dir * (0.8 + 0.01));
    if (dir < 0) ant.rotation.y = Math.PI;
    g.add(ant);
    return g;
  }

  // SOT-223 regulator — body plus its tab and three gull-wing leads
  if (p.lib.includes("SOT-223")) {
    const w = b?.w ?? 3.7;
    const h = b?.h ?? 6.7;
    slab(g, mat.plastic, w * 0.92, h * 0.62, 1.6, dir, b?.cx ?? 0, b?.cy ?? 0);
    return g;
  }

  // tactile push button — black base with a round plunger
  if (p.lib.includes("SW_Tactile")) {
    const w = b?.w ?? 6.1;
    const h = b?.h ?? 3.7;
    slab(g, mat.plastic, w, h, 1.5, dir);
    const plunger = new THREE.Mesh(
      new THREE.CylinderGeometry(Math.min(w, h) * 0.27, Math.min(w, h) * 0.27, 0.9, 24),
      mat.button,
    );
    plunger.rotation.x = Math.PI / 2;
    plunger.position.z = dir * (1.5 + 0.45);
    g.add(plunger);
    return g;
  }

  // everything else is a two-terminal chip package
  if (!b) return null;
  const isLed = p.lib.includes("LED");
  const body = isLed ? mat.led : p.lib.includes("Resistor") ? mat.resistor : mat.ceramic;
  const height = isLed ? 0.75 : p.lib.includes("Resistor") ? 0.55 : 0.95;
  slab(g, body, b.w, b.h, height, dir, b.cx, b.cy);
  // metal terminations cap the two ends of the package's long axis, standing
  // a hair proud of the body so they catch the light separately
  const alongX = b.w >= b.h;
  const span = alongX ? b.w : b.h;
  const capLen = span * 0.2;
  for (const s of [-1, 1]) {
    const off = s * (span / 2 - capLen / 2);
    slab(
      g,
      mat.termination,
      alongX ? capLen : b.w + 0.04,
      alongX ? b.h + 0.04 : capLen,
      height + 0.04,
      dir,
      b.cx + (alongX ? off : 0),
      b.cy + (alongX ? 0 : off),
      -0.02,
    );
  }
  return g;
}

/* ---------- the whole thing ---------- */

export function buildBoard(): { group: THREE.Group; dispose: () => void } {
  const group = new THREE.Group();
  const shape = boardShape();
  const disposables: { dispose: () => void }[] = [];

  // FR-4 slab. ExtrudeGeometry groups the flat caps (0) separately from the
  // side walls (1), so the cut edge can show bare laminate while the faces
  // stay soldermask-dark under the painted artwork.
  const slabGeo = new THREE.ExtrudeGeometry(shape, { depth: BOARD_T, bevelEnabled: false });
  slabGeo.translate(0, 0, -BOARD_T / 2);
  const slabMesh = new THREE.Mesh(slabGeo, [
    new THREE.MeshStandardMaterial({ color: PCB.mask, roughness: 0.75 }),
    new THREE.MeshStandardMaterial({ color: "#9a8b56", roughness: 0.85 }),
  ]);
  group.add(slabMesh);
  disposables.push(slabGeo);

  // the two painted copper layers, as flat skins on the slab's faces
  for (const side of ["F", "B"] as const) {
    const geo = new THREE.ShapeGeometry(shape);
    fitUvsToBounds(geo);
    const tex = layerTexture(side);
    const material = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.42,
      // the gold pads pick up a little specular metalness without turning the
      // soldermask into a mirror
      metalness: 0.18,
      // the back skin is only ever seen from behind the slab
      side: side === "F" ? THREE.FrontSide : THREE.BackSide,
    });
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.z = side === "F" ? BOARD_T / 2 + ART_LIFT : -(BOARD_T / 2 + ART_LIFT);
    group.add(mesh);
    disposables.push(geo, material, tex);
  }

  for (const p of BOARD.parts) {
    const g = buildPart(p);
    if (!g) continue;
    g.position.set(toX(p.x), toY(p.y), (p.side === "F" ? 1 : -1) * (BOARD_T / 2));
    g.rotation.z = rad(p.rot);
    group.add(g);
    g.traverse((o) => {
      if (o instanceof THREE.Mesh) disposables.push(o.geometry);
    });
  }

  return {
    group,
    dispose: () => disposables.forEach((d) => d.dispose()),
  };
}
