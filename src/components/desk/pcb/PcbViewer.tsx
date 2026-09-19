"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import type { CSSProperties } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { BOARDS, PALETTE, type BoardId } from "./board";
import { buildBoard, type BuiltBoard } from "./buildBoard";

/** a full turn every ~14s — slow enough to read the silkscreen as it passes */
const SPIN_RPS = 1 / 14;
/** Tipped well back towards horizontal — a flat-on board reads as a picture
 *  of a board, where a pitched one reads as an object with things standing
 *  off its face. ~40° — eased up from ~50° so both boards sit a little more
 *  upright. */
const TILT = -0.7;
/** A board is a flat thing, so a plain Y-spin passes dead edge-on twice a
 *  turn and all but vanishes. Rocking the tilt on its own slow clock means
 *  those crossings almost never coincide with a level board, so there's
 *  always some face catching the light. */
const TILT_ROCK = 0.15;
const TILT_RPS = 0.37 / (Math.PI * 2);
/** how far the board drifts up and down, in mm */
const BOB = 0.5;
/** `DeskStage` scales the whole desk up to ~1.35x as the page scrolls, and the
 *  canvas deliberately keeps its untransformed layout size (see `resize`
 *  below) — so at full zoom it's being stretched by that much. Rendering at a
 *  matching multiple of the device pixel ratio stops it going soft there. */
const DESK_MAX_ZOOM = 1.35;
/** the air left between neighbouring boards at their widest, in mm */
const BOARD_GAP = 15;
/** Drawn larger than true scale. The dongle is much smaller than SPARC, and
 *  side by side at real size it read as the lesser board. */
const BOARD_SCALE: Partial<Record<BoardId, number>> = { esp32: 1.2 };

/** One board: placed at `x` along the row, then tilted back, rocked, bobbed
 *  and spun exactly like every other board in the scene — they share one
 *  clock, so they always hold the same orientation. */
function Board({
  built,
  x,
  scale,
  still,
}: {
  built: BuiltBoard;
  x: number;
  scale: number;
  still: boolean;
}) {
  const tilt = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!spin.current || !tilt.current) return;
    if (still) return;
    const t = state.clock.elapsedTime;
    // driven off the shared clock (not accumulated per frame) so every board
    // sits at exactly the same angle on every frame
    spin.current.rotation.y = t * SPIN_RPS * Math.PI * 2;
    tilt.current.rotation.x = TILT + Math.sin(t * TILT_RPS * Math.PI * 2) * TILT_ROCK;
    // a shallow bob, out of phase with both, so the silhouette keeps changing
    // instead of repeating exactly once per turn
    tilt.current.position.y = Math.sin(t * 0.6) * BOB;
  });

  return (
    <group position={[x, 0, 0]} scale={scale}>
      <group ref={tilt} rotation={[TILT, 0, 0]}>
        <group ref={spin}>
          <primitive object={built.group} />
        </group>
      </group>
    </group>
  );
}

/** A studio environment generated on the GPU at mount — the metal shield can
 *  and the gold pads need something to reflect, and this costs one render
 *  pass instead of a fetched HDRI. */
function StudioEnv() {
  const gl = useThree((s) => s.gl);
  const target = useMemo(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const rt = pmrem.fromScene(new RoomEnvironment(), 0.04);
    pmrem.dispose(); // the generator's scratch buffers; `rt` is ours to keep
    return rt;
  }, [gl]);
  useEffect(() => () => target.dispose(), [target]);
  // `attach` sets `scene.environment` declaratively — R3F owns the write, so
  // it's put back if this ever unmounts
  return <primitive attach="environment" object={target.texture} />;
}

/**
 * How much room one board needs so it stays wholly inside the window through
 * every frame of the animation — not just the frame it happens to be on.
 *
 * The board's on-screen size is never its flat width and height: it's a box
 * (`w` × `h` × depth) being spun about Y and rocked about X, and both
 * rotations feed depth into the silhouette. So the worst case is derived
 * rather than guessed — spinning can grow the width to the board's own
 * diagonal with depth, and the tilt trades height for depth, which is checked
 * at both ends of the rock since neither end is reliably the wider one.
 * `halfDepth` comes from the built board, so a board with tall parts (SPARC's
 * 7 mm JST headers) gets the extra room it needs.
 */
function fitHalfExtents(w: number, h: number, halfDepth: number) {
  const hw = w / 2;
  const hh = h / 2;
  // Rotation about Y mixes width and depth; the peak over a full turn is the
  // hypotenuse, and it's also the deepest the board can be side-on.
  const spun = Math.hypot(hw, halfDepth);
  // Rotation about X then mixes that depth into height. Evaluate the rock's
  // extremes: the shallow end keeps more of the board's own height, the steep
  // end converts more depth into it.
  const halfH = Math.max(
    ...[Math.abs(TILT) - TILT_ROCK, Math.abs(TILT) + TILT_ROCK].map(
      (t) => hh * Math.cos(t) + spun * Math.sin(t),
    ),
  );
  return { halfW: spun, halfH: halfH + BOB };
}

/** Backs the camera off far enough to hold the whole row of boards. */
function FitCamera({ halfW, halfH }: { halfW: number; halfH: number }) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  // Layout effect, not a passive one: a passive effect lands after the first
  // frame is already on screen, so the board flashed at the default camera
  // distance — far too big for the monitor — before snapping into place.
  useLayoutEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const vFov = (cam.fov * Math.PI) / 180;
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * cam.aspect);
    const dist = Math.max(halfH / Math.tan(vFov / 2), halfW / Math.tan(hFov / 2));
    // a little air so it reads as sitting in the window, not wedged into it
    cam.position.set(0, 0, dist * 1.05);
    cam.lookAt(0, 0, 0);
    cam.updateProjectionMatrix();
  }, [camera, size, halfW, halfH]);
  return null;
}

/** Builds every board once and lays them out left to right, each given the
 *  width its own worst-case silhouette needs plus `BOARD_GAP` between. */
function layoutRow(ids: BoardId[]) {
  const items: { id: BoardId; built: BuiltBoard; x: number; scale: number; halfH: number }[] = [];
  let cursor = 0;
  for (const id of ids) {
    const board = BOARDS[id];
    const built = buildBoard(board);
    const scale = BOARD_SCALE[id] ?? 1;
    const fit = fitHalfExtents(board.w, board.h, built.halfDepth);
    const halfW = fit.halfW * scale;
    items.push({ id, built, x: cursor + halfW, scale, halfH: fit.halfH * scale });
    cursor += halfW * 2 + BOARD_GAP;
  }
  const total = cursor - BOARD_GAP;
  return {
    items: items.map((it) => ({ ...it, x: it.x - total / 2 })),
    halfW: total / 2,
    halfH: Math.max(...items.map((it) => it.halfH)),
  };
}

function useBoardRow(ids: BoardId[]) {
  const key = ids.join(",");
  const row = useMemo(() => layoutRow(key.split(",") as BoardId[]), [key]);
  useEffect(() => () => row.items.forEach((it) => it.built.dispose()), [row]);
  return row;
}

function Boards({ ids, still }: { ids: BoardId[]; still: boolean }) {
  const row = useBoardRow(ids);
  return (
    <>
      <FitCamera halfW={row.halfW} halfH={row.halfH} />
      {row.items.map((it) => (
        <Board key={it.id} built={it.built} x={it.x} scale={it.scale} still={still} />
      ))}
    </>
  );
}

export default function PcbViewer({
  boards = ["esp32"],
  className,
  style,
  running = true,
}: {
  /** the boards to show, left to right, all turning together */
  boards?: BoardId[];
  className?: string;
  style?: CSSProperties;
  /** false parks the render loop entirely — this lives on the landing page,
   *  and there's no reason to spin a GPU for a board nobody is looking at */
  running?: boolean;
}) {
  const still = usePrefersReducedMotion();
  return (
    <div className={className} style={style}>
      <Canvas
        dpr={Math.min(3, (globalThis.devicePixelRatio || 1) * DESK_MAX_ZOOM)}
        frameloop={running && !still ? "always" : "demand"}
        gl={{ antialias: true, alpha: true }}
        camera={{ fov: 34, near: 1, far: 400 }}
        // The desk is inside an ancestor that `DeskStage` scales as you
        // scroll. R3F sizes its canvas from getBoundingClientRect, which
        // INCLUDES that scale, and then writes the result back as the
        // canvas's own CSS pixel size — which the ancestor then scales
        // again. Left alone the board swells and drifts off the monitor in
        // 50ms debounced steps as you scroll. `offsetSize` measures the
        // untransformed layout box instead, and the scroll listener that
        // drove the stepping isn't needed once size stops depending on it.
        resize={{ offsetSize: true, scroll: false, debounce: { scroll: 0, resize: 0 } }}
        // The studio environment below is a bright white room. At full
        // strength it drowns the directional lights — the RF can turns into a
        // flat white card and the soldermask goes pale — so it's dialled back
        // to being a source of shape and highlights rather than of exposure.
        scene={{ environmentIntensity: 0.5 }}
        // the overlay behind this is already `--paper`, so the canvas only
        // needs to carry the board itself
        style={{ background: "transparent" }}
      >
        <StudioEnv />
        {/* Lit above the usual 1-ish intensities: the board is a dark object
            on a black page and the renderer's filmic tone mapping pulls the
            midtones down further. Weighted towards the directional lights,
            though — the board's back is nearly all ground pour, and with much
            more ambient in the mix it flattens into a pale shapeless slab. */}
        <ambientLight intensity={0.8} />
        {/* key light from the upper left, the way the desk lamp falls */}
        <directionalLight position={[-14, 18, 26]} intensity={2.3} />
        {/* rim light picking out the board's edge */}
        <directionalLight position={[16, -6, -18]} intensity={1.9} color={PALETTE.accent} />
        {/* fill from the front so the back of the board isn't a void when it
            turns past the camera */}
        <directionalLight position={[10, 4, 20]} intensity={0.7} />
        <Boards ids={boards} still={still} />
      </Canvas>
    </div>
  );
}
