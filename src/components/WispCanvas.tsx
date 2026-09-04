"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/* -------------------------------------------------------------------------- */
/*  Drifting spirit wisps — GPU particles                                      */
/* -------------------------------------------------------------------------- */

const WISP_COUNT = 700;

const wispVertex = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;

  attribute float aSeed;
  attribute float aScale;
  attribute float aSpeed;

  varying float vAlpha;
  varying float vTint;

  void main() {
    vec3 pos = position;

    // slow upward drift, wrapping through a 14-unit tall column
    float rise = mod(uTime * aSpeed + aSeed * 14.0, 14.0);
    pos.y = position.y + rise - 7.0;

    // lateral + depth sway
    pos.x += sin(uTime * 0.35 * aSpeed + aSeed * 6.28) * 0.6;
    pos.z += cos(uTime * 0.28 * aSpeed + aSeed * 3.14) * 0.6;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // flicker + fade near the top/bottom of the column
    float flicker = 0.6 + 0.4 * sin(uTime * 3.0 * aSpeed + aSeed * 20.0);
    float edge = smoothstep(0.0, 3.0, rise) * (1.0 - smoothstep(11.0, 14.0, rise));
    vAlpha = flicker * edge;
    vTint = fract(aSeed * 3.37);

    gl_PointSize = aScale * uPixelRatio * (260.0 / -mvPosition.z);
  }
`;

const wispFragment = /* glsl */ `
  precision mediump float;

  uniform vec3 uColorA; // teal wisp
  uniform vec3 uColorB; // warm gold

  varying float vAlpha;
  varying float vTint;

  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;

    float core = smoothstep(0.5, 0.0, d);
    float glow = pow(core, 2.5);

    vec3 color = mix(uColorA, uColorB, smoothstep(0.35, 0.85, vTint));
    gl_FragColor = vec4(color, glow * vAlpha * 1.7);
  }
`;

/** Deterministic PRNG (mulberry32) — pure, and keeps SSR/client identical. */
function makeRng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function Wisps() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const { positions, seeds, scales, speeds } = useMemo(() => {
    const positions = new Float32Array(WISP_COUNT * 3);
    const seeds = new Float32Array(WISP_COUNT);
    const scales = new Float32Array(WISP_COUNT);
    const speeds = new Float32Array(WISP_COUNT);
    const rand = makeRng(0x5eed);

    for (let i = 0; i < WISP_COUNT; i++) {
      positions[i * 3 + 0] = (rand() - 0.5) * 16;
      positions[i * 3 + 1] = (rand() - 0.5) * 14;
      positions[i * 3 + 2] = (rand() - 0.5) * 8 - 2;
      seeds[i] = rand();
      scales[i] = 0.4 + rand() * 1.8;
      speeds[i] = 0.3 + rand() * 0.9;
    }
    return { positions, seeds, scales, speeds };
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: {
        value: typeof window !== "undefined" ? Math.min(window.devicePixelRatio, 2) : 1,
      },
      uColorA: { value: new THREE.Color("#9df9e4") },
      uColorB: { value: new THREE.Color("#ffd27a") },
    }),
    [],
  );

  useFrame((_, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta;
    }
  });

  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSeed" args={[seeds, 1]} />
        <bufferAttribute attach="attributes-aScale" args={[scales, 1]} />
        <bufferAttribute attach="attributes-aSpeed" args={[speeds, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={wispVertex}
        fragmentShader={wispFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* -------------------------------------------------------------------------- */
/*  Volumetric god rays — additive light shafts                                */
/* -------------------------------------------------------------------------- */

const rayVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const rayFragment = /* glsl */ `
  precision mediump float;
  uniform float uTime;
  uniform float uPhase;
  uniform vec3 uColor;
  varying vec2 vUv;

  void main() {
    // bright at the top, fading down; feathered horizontally
    float vertical = pow(1.0 - vUv.y, 1.35);
    float horizontal = smoothstep(0.0, 0.42, vUv.x) * smoothstep(1.0, 0.58, vUv.x);
    float breathe = 0.6 + 0.4 * sin(uTime * 0.4 + uPhase);
    float intensity = vertical * horizontal * breathe;
    gl_FragColor = vec4(uColor, intensity * 0.42);
  }
`;

function GodRay({
  position,
  rotation,
  scale,
  phase,
  color,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  phase: number;
  color: string;
}) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPhase: { value: phase },
      uColor: { value: new THREE.Color(color) },
    }),
    [phase, color],
  );

  useFrame((_, delta) => {
    if (materialRef.current) materialRef.current.uniforms.uTime.value += delta;
  });

  return (
    <mesh position={position} rotation={rotation} scale={scale}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={rayVertex}
        fragmentShader={rayFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

/* -------------------------------------------------------------------------- */
/*  Parallax rig — the whole field leans toward the pointer                    */
/* -------------------------------------------------------------------------- */

function ParallaxRig({ children }: { children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null);
  const { pointer } = useThree();

  useFrame(() => {
    if (!group.current) return;
    group.current.rotation.y += (pointer.x * 0.12 - group.current.rotation.y) * 0.04;
    group.current.rotation.x += (-pointer.y * 0.08 - group.current.rotation.x) * 0.04;
    group.current.position.x += (pointer.x * 0.4 - group.current.position.x) * 0.04;
    group.current.position.y += (pointer.y * 0.25 - group.current.position.y) * 0.04;
  });

  return <group ref={group}>{children}</group>;
}

/* -------------------------------------------------------------------------- */

function Scene() {
  return (
    <>
      <color attach="background" args={["#04100f"]} />
      <fog attach="fog" args={["#04100f", 6, 18]} />

      <ParallaxRig>
        <GodRay
          position={[-3, 2, -4]}
          rotation={[0, 0, 0.18]}
          scale={[3.5, 12, 1]}
          phase={0}
          color="#ffe9b8"
        />
        <GodRay
          position={[1.5, 3, -5]}
          rotation={[0, 0, -0.12]}
          scale={[2.6, 13, 1]}
          phase={2.1}
          color="#8ff0dc"
        />
        <GodRay
          position={[4, 2.5, -3]}
          rotation={[0, 0, 0.26]}
          scale={[2.2, 11, 1]}
          phase={4.3}
          color="#ffd27a"
        />
        <Wisps />
      </ParallaxRig>
    </>
  );
}

export default function WispCanvas() {
  return (
    <div className="fixed inset-0 -z-10 bg-teal-deep">
      <Canvas
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        camera={{ position: [0, 0, 6], fov: 55 }}
      >
        <Scene />
      </Canvas>
      {/* Vignette + bloom-ish wash, done cheaply in CSS over the canvas. */}
      <div className="pointer-events-none absolute inset-0 [background:radial-gradient(120%_90%_at_50%_15%,transparent_40%,rgba(2,10,9,0.55)_100%)]" />
    </div>
  );
}
