"use client";

import { Suspense, useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, OrbitControls, Sphere } from "@react-three/drei";
import * as THREE from "three";

const AGENT_NODES = [
  { speed: 0.4,  radius: 2.1, yAmplitude: 0.3, color: "#34d399", phase: 0 },
  { speed: 0.28, radius: 2.4, yAmplitude: 0.5, color: "#a78bfa", phase: 1.26 },
  { speed: 0.52, radius: 1.9, yAmplitude: 0.2, color: "#f87171", phase: 2.51 },
  { speed: 0.35, radius: 2.3, yAmplitude: 0.6, color: "#e879f9", phase: 3.77 },
  { speed: 0.45, radius: 2.0, yAmplitude: 0.4, color: "#38bdf8", phase: 5.03 },
];

function Particles({ count = 60 }) {
  const ref = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 4.5 + Math.random() * 2.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, [count]);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.035;
      ref.current.rotation.x = state.clock.elapsedTime * 0.012;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#fdb515"
        size={0.025}
        sizeAttenuation
        transparent
        opacity={0.35}
        depthWrite={false}
      />
    </points>
  );
}

function AgentNode({ speed, radius, yAmplitude, color, phase }: (typeof AGENT_NODES)[0]) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime * speed + phase;
    const x = Math.cos(t) * radius;
    const y = Math.sin(t * 0.7) * yAmplitude;
    const z = Math.sin(t) * radius;
    if (ref.current) {
      ref.current.position.set(x, y, z);
      const s = 1 + Math.sin(t * 2) * 0.07;
      ref.current.scale.setScalar(s);
    }
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.09, 16, 16]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={1.0}
        roughness={0.1}
        metalness={0.1}
      />
    </mesh>
  );
}

function JugaadCore() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.15;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Central orb */}
      <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
        <Sphere args={[1.1, 128, 128]}>
          <MeshDistortMaterial
            color="#03173d"
            emissive="#fdb515"
            emissiveIntensity={0.22}
            roughness={0.1}
            metalness={0.9}
            distort={0.22}
            speed={1.5}
          />
        </Sphere>
      </Float>

      {/* Inner gold ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.55, 0.007, 16, 120]} />
        <meshStandardMaterial
          color="#fdb515"
          emissive="#fdb515"
          emissiveIntensity={0.9}
          transparent
          opacity={0.55}
        />
      </mesh>

      {/* Tilted accent rings */}
      {[
        { r: 2.0, rot: [Math.PI / 2.4, 0.3, 0.1] as [number, number, number], color: "#60a5fa" },
        { r: 2.5, rot: [Math.PI / 3,   0.8, 0.5] as [number, number, number], color: "#a78bfa" },
      ].map(({ r, rot, color }, i) => (
        <mesh key={i} rotation={rot}>
          <torusGeometry args={[r, 0.005, 16, 120]} />
          <meshStandardMaterial color={color} transparent opacity={0.18} />
        </mesh>
      ))}

      {/* Orbiting nodes */}
      {AGENT_NODES.map((node, i) => (
        <AgentNode key={i} {...node} />
      ))}
    </group>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[6, 6, 6]} intensity={2} color="#fdb515" />
      <pointLight position={[-8, -4, -8]} intensity={0.8} color="#60a5fa" />
      <pointLight position={[0, 8, 0]} intensity={0.4} color="#ffffff" />
      <Particles />
      <JugaadCore />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.5}
        maxPolarAngle={Math.PI / 1.6}
        minPolarAngle={Math.PI / 3.5}
      />
    </>
  );
}

export function ModelCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 1.5, 6], fov: 42 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
      dpr={[1, 2]}
    >
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
    </Canvas>
  );
}
