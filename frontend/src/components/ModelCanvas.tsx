"use client";

import { Suspense, useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sphere } from "@react-three/drei";
import { EffectComposer, Bloom, ChromaticAberration } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";

/* ─── Orb ─── */
function CoreOrb() {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef  = useRef<THREE.ShaderMaterial | null>(null);

  const material = useMemo(() => {
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime:   { value: 0 },
        uColor1: { value: new THREE.Color("#fdb515") },
        uColor2: { value: new THREE.Color("#001a40") },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vWorldPos;
        uniform float uTime;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec3 p = position;
          float n = sin(p.x * 3.2 + uTime * 0.55)
                  * cos(p.y * 2.8 + uTime * 0.38)
                  * sin(p.z * 2.2 + uTime * 0.47);
          p += normal * n * 0.075;
          vWorldPos = (modelMatrix * vec4(p, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vWorldPos;
        uniform float uTime;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        void main() {
          vec3 viewDir = normalize(cameraPosition - vWorldPos);
          float fresnel = pow(1.0 - clamp(dot(vNormal, viewDir), 0.0, 1.0), 2.2);
          float pulse = 0.5 + 0.5 * sin(uTime * 0.7);
          vec3 base = mix(uColor2, uColor1 * 0.35, fresnel * 0.5 + pulse * 0.08);
          vec3 rim  = uColor1 * pow(fresnel, 2.0) * 0.7;
          gl_FragColor = vec4(base + rim, 1.0);
        }
      `,
    });
    matRef.current = mat;
    return mat;
  }, []);

  useFrame(({ clock }) => {
    if (matRef.current) {
      (matRef.current.uniforms.uTime as { value: number }).value = clock.elapsedTime;
    }
  });

  return (
    <Sphere ref={meshRef} args={[1.15, 128, 128]}>
      <primitive object={material} attach="material" />
    </Sphere>
  );
}

/* ─── Animated rings ─── */
const RINGS = [
  { radius: 1.65, tube: 0.007, tilt: [Math.PI / 2, 0, 0],           color: "#fdb515", emissive: 1.2, speed: 0.18 },
  { radius: 2.10, tube: 0.005, tilt: [Math.PI / 2.2, 0.4, 0.2],     color: "#60a5fa", emissive: 0.6, speed: -0.12 },
  { radius: 2.55, tube: 0.004, tilt: [Math.PI / 3.2, 0.9, 0.6],     color: "#a78bfa", emissive: 0.4, speed: 0.09 },
  { radius: 2.95, tube: 0.003, tilt: [Math.PI / 2.8, -0.5, 0.3],    color: "#38bdf8", emissive: 0.25, speed: -0.07 },
] as const;

function Rings() {
  const refs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    RINGS.forEach(({ speed }, i) => {
      const m = refs.current[i];
      if (m) m.rotation.z = t * speed;
    });
  });

  return (
    <>
      {RINGS.map(({ radius, tube, tilt, color, emissive }, i) => (
        <mesh
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          rotation={tilt as unknown as [number, number, number]}
        >
          <torusGeometry args={[radius, tube, 16, 160]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={emissive}
            transparent
            opacity={i === 0 ? 0.9 : 0.35 - i * 0.05}
          />
        </mesh>
      ))}
    </>
  );
}

/* ─── Orbiting nodes ─── */
const NODES = [
  { speed: 0.38,  r: 2.1,  yAmp: 0.28, color: "#34d399", phase: 0,    size: 0.09 },
  { speed: 0.27,  r: 2.45, yAmp: 0.45, color: "#a78bfa", phase: 1.26, size: 0.08 },
  { speed: 0.50,  r: 1.92, yAmp: 0.18, color: "#f87171", phase: 2.51, size: 0.07 },
  { speed: 0.33,  r: 2.32, yAmp: 0.55, color: "#fdb515", phase: 3.77, size: 0.10 },
  { speed: 0.44,  r: 2.02, yAmp: 0.38, color: "#38bdf8", phase: 5.03, size: 0.07 },
  { speed: 0.22,  r: 2.72, yAmp: 0.60, color: "#e879f9", phase: 4.20, size: 0.06 },
];

function Node({ speed, r, yAmp, color, phase, size }: (typeof NODES)[0]) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime * speed + phase;
    if (ref.current) {
      ref.current.position.set(
        Math.cos(t) * r,
        Math.sin(t * 0.65) * yAmp,
        Math.sin(t) * r
      );
      ref.current.scale.setScalar(1 + Math.sin(t * 1.8) * 0.09);
    }
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[size, 16, 16]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.2} roughness={0} metalness={0} />
    </mesh>
  );
}

/* ─── Particle field ─── */
function Particles({ count = 120 }) {
  const ref = useRef<THREE.Points>(null);

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const palette = [
      new THREE.Color("#fdb515"),
      new THREE.Color("#60a5fa"),
      new THREE.Color("#a78bfa"),
      new THREE.Color("#ffffff"),
    ];
    for (let i = 0; i < count; i++) {
      const r = 4.0 + Math.random() * 3.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
      const c = palette[Math.floor(Math.random() * palette.length)];
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    return [pos, col];
  }, [count]);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.elapsedTime * 0.03;
      ref.current.rotation.x = Math.sin(clock.elapsedTime * 0.01) * 0.15;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color"    args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        vertexColors
        size={0.028}
        sizeAttenuation
        transparent
        opacity={0.5}
        depthWrite={false}
      />
    </points>
  );
}

/* ─── Scene ─── */
function Scene() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.elapsedTime * 0.08;
    }
  });

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.15} />
      <pointLight position={[5, 5, 5]}    intensity={1.4} color="#fdb515" />
      <pointLight position={[-6, -3, -6]} intensity={0.7} color="#60a5fa" />
      <pointLight position={[0, 7, 2]}    intensity={0.4} color="#a78bfa" />
      <pointLight position={[3, -5, 4]}   intensity={0.25} color="#34d399" />

      <Particles />

      <group ref={groupRef}>
        <CoreOrb />
        <Rings />
        {NODES.map((node, i) => <Node key={i} {...node} />)}
      </group>

      {/* Bloom + subtle chromatic aberration */}
      <EffectComposer>
        <Bloom
          intensity={0.4}
          luminanceThreshold={0.6}
          luminanceSmoothing={0.8}
          mipmapBlur
        />
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={new THREE.Vector2(0.0006, 0.0006)}
          radialModulation={false}
          modulationOffset={0}
        />
      </EffectComposer>

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.4}
        maxPolarAngle={Math.PI / 1.65}
        minPolarAngle={Math.PI / 3.2}
      />
    </>
  );
}

/* ─── Canvas ─── */
export function ModelCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 1.8, 6.5], fov: 40 }}
      gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
      style={{ background: "transparent" }}
      dpr={[1, 2]}
    >
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
    </Canvas>
  );
}
