"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, OrbitControls, Sphere } from "@react-three/drei";
import * as THREE from "three";

function JugaadCore() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.25;
    }
  });

  return (
    <group ref={groupRef}>
      <Float speed={2} rotationIntensity={0.4} floatIntensity={0.8}>
        <Sphere args={[1.2, 64, 64]} scale={1}>
          <MeshDistortMaterial
            color="#003262"
            emissive="#fdb515"
            emissiveIntensity={0.15}
            roughness={0.2}
            metalness={0.8}
            distort={0.35}
            speed={2}
          />
        </Sphere>
      </Float>

      {/* Orbiting rings — placeholder until real model is loaded */}
      {[1.6, 2.0, 2.4].map((radius, i) => (
        <mesh key={radius} rotation={[Math.PI / 2 + i * 0.3, i * 0.5, 0]}>
          <torusGeometry args={[radius, 0.02, 16, 100]} />
          <meshStandardMaterial
            color={i === 0 ? "#fdb515" : i === 1 ? "#60a5fa" : "#34d399"}
            emissive={i === 0 ? "#fdb515" : "#000"}
            emissiveIntensity={i === 0 ? 0.5 : 0}
            transparent
            opacity={0.7 - i * 0.15}
          />
        </mesh>
      ))}

      {/* Agent nodes orbiting */}
      {[
        { angle: 0, color: "#34d399", label: "food" },
        { angle: Math.PI * 0.4, color: "#a78bfa", label: "aid" },
        { angle: Math.PI * 0.8, color: "#f87171", label: "safe" },
        { angle: Math.PI * 1.2, color: "#e879f9", label: "well" },
        { angle: Math.PI * 1.6, color: "#38bdf8", label: "acad" },
      ].map(({ angle, color }) => (
        <mesh
          key={angle}
          position={[Math.cos(angle) * 2.2, Math.sin(angle * 0.5) * 0.4, Math.sin(angle) * 2.2]}
        >
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} />
        </mesh>
      ))}
    </group>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#fdb515" />
      <pointLight position={[-10, -5, -10]} intensity={0.5} color="#60a5fa" />
      <JugaadCore />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.8}
        maxPolarAngle={Math.PI / 1.8}
        minPolarAngle={Math.PI / 3}
      />
    </>
  );
}

export function ModelCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5.5], fov: 45 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
    >
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
    </Canvas>
  );
}

/**
 * To replace with your own 3D model:
 *
 * import { useGLTF } from "@react-three/drei";
 *
 * function YourModel() {
 *   const { scene } = useGLTF("/models/jugaad.glb");
 *   return <primitive object={scene} scale={1.5} />;
 * }
 *
 * Place your .glb file in frontend/public/models/
 */
