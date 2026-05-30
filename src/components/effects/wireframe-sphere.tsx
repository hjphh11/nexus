"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const PARTICLE_COUNT = 120;
const MAX_LINES = 200;

function hash(i: number, seed: number): number {
  const x = Math.sin(i * 127.1 + seed) * 43758.5453;
  return x - Math.floor(x);
}

function Scene({
  dispersion, mouseX, mouseY, zoom,
}: { dispersion: number; mouseX: number; mouseY: number; zoom: number }) {
  const { viewport } = useThree();
  const baseScale = Math.min(viewport.width, viewport.height) * 0.22;
  const scale = baseScale * zoom;

  return (
    <group scale={[scale, scale, scale]}>
      <DispersingSphere dispersion={dispersion} mouseX={mouseX} mouseY={mouseY} />
    </group>
  );
}

function DispersingSphere({
  dispersion, mouseX, mouseY,
}: { dispersion: number; mouseX: number; mouseY: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  const sphereMeshRef = useRef<THREE.Mesh>(null);
  const ringGroupRef = useRef<THREE.Group>(null);
  const rotRef = useRef({ x: 0, y: 0 });
  const timerRef = useRef(0);

  const { spherePos, scatteredPos, lineIndices } = useMemo(() => {
    const sphere: number[] = [];
    const scattered: number[] = [];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / PARTICLE_COUNT);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const r = 2.2;
      sphere.push(r * Math.cos(theta) * Math.sin(phi), r * Math.cos(phi), r * Math.sin(theta) * Math.sin(phi));
      scattered.push((hash(i, 1) - 0.5) * 10, (hash(i, 2) - 0.5) * 8, (hash(i, 3) - 0.5) * 6);
    }

    const pairs: number[] = [];
    for (let i = 0; i < PARTICLE_COUNT && pairs.length / 2 < MAX_LINES; i++) {
      for (let j = i + 1; j < PARTICLE_COUNT && pairs.length / 2 < MAX_LINES; j++) {
        const dx = scattered[i * 3] - scattered[j * 3];
        const dy = scattered[i * 3 + 1] - scattered[j * 3 + 1];
        const dz = scattered[i * 3 + 2] - scattered[j * 3 + 2];
        if (dx * dx + dy * dy + dz * dz < 5) pairs.push(i, j);
      }
    }
    return { spherePos: sphere, scatteredPos: scattered, lineIndices: pairs };
  }, []);

  const pointsGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3] = spherePos[i * 3];
      positions[i * 3 + 1] = spherePos[i * 3 + 1];
      positions[i * 3 + 2] = spherePos[i * 3 + 2];
    }
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [spherePos]);

  const linesGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(lineIndices.length * 3), 3));
    return geo;
  }, [lineIndices]);

  useFrame((_, delta) => {
    // Manual timer (avoids deprecated THREE.Clock)
    timerRef.current += delta;

    if (groupRef.current) {
      const targetY = (mouseX - 0.5) * Math.PI * 0.6;
      const targetX = (mouseY - 0.5) * Math.PI * 0.4;
      rotRef.current.y += delta * 0.06;
      rotRef.current.x += delta * 0.02;
      const lerp = 1 - Math.exp(-delta * 4);
      rotRef.current.y += (targetY - rotRef.current.y) * lerp;
      rotRef.current.x += (targetX - rotRef.current.x) * lerp;
      groupRef.current.rotation.y = rotRef.current.y;
      groupRef.current.rotation.x = rotRef.current.x;
    }
  });

  useFrame(() => {
    if (pointsRef.current) {
      const arr = pointsRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;
        arr[i3] = spherePos[i3] + (scatteredPos[i3] - spherePos[i3]) * dispersion;
        arr[i3 + 1] = spherePos[i3 + 1] + (scatteredPos[i3 + 1] - spherePos[i3 + 1]) * dispersion;
        arr[i3 + 2] = spherePos[i3 + 2] + (scatteredPos[i3 + 2] - spherePos[i3 + 2]) * dispersion;
      }
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
    if (linesRef.current && lineIndices.length > 0) {
      const arr = linesRef.current.geometry.attributes.position.array as Float32Array;
      for (let k = 0; k < lineIndices.length; k++) {
        const i3 = lineIndices[k] * 3;
        arr[k * 3] = spherePos[i3] + (scatteredPos[i3] - spherePos[i3]) * dispersion;
        arr[k * 3 + 1] = spherePos[i3 + 1] + (scatteredPos[i3 + 1] - spherePos[i3 + 1]) * dispersion;
        arr[k * 3 + 2] = spherePos[i3 + 2] + (scatteredPos[i3 + 2] - spherePos[i3 + 2]) * dispersion;
      }
      linesRef.current.geometry.attributes.position.needsUpdate = true;
      (linesRef.current.material as THREE.LineBasicMaterial).opacity = dispersion * 0.25;
    }
    if (sphereMeshRef.current) {
      (sphereMeshRef.current.material as THREE.MeshBasicMaterial).opacity = 0.08 * (1 - dispersion);
    }
    if (ringGroupRef.current) {
      ringGroupRef.current.children.forEach((child, idx) => {
        if (child instanceof THREE.Mesh) {
          (child.material as THREE.MeshBasicMaterial).opacity = [0.35, 0.25, 0.18][idx] * (1 - dispersion);
        }
      });
    }
  });

  return (
    <group ref={groupRef}>
      <mesh ref={sphereMeshRef}>
        <icosahedronGeometry args={[1.8, 3]} />
        <meshBasicMaterial color="#00f0ff" wireframe transparent opacity={0.08} depthWrite={false} />
      </mesh>
      <group ref={ringGroupRef}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2.3, 0.006, 16, 120]} />
          <meshBasicMaterial color="#00f0ff" transparent opacity={0.35} depthWrite={false} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 4]}>
          <torusGeometry args={[2.3, 0.004, 16, 120]} />
          <meshBasicMaterial color="#7c3aed" transparent opacity={0.25} depthWrite={false} />
        </mesh>
        <mesh rotation={[0, Math.PI / 3, 0]}>
          <torusGeometry args={[2.3, 0.004, 16, 120]} />
          <meshBasicMaterial color="#f43f5e" transparent opacity={0.18} depthWrite={false} />
        </mesh>
      </group>
      <points ref={pointsRef} geometry={pointsGeo}>
        <pointsMaterial color="#00f0ff" size={0.04} transparent opacity={0.7} depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
      <lineSegments ref={linesRef} geometry={linesGeo}>
        <lineBasicMaterial color="#00f0ff" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </lineSegments>
    </group>
  );
}

export function WireframeSphere({
  dispersion = 0, mouseX = 0.5, mouseY = 0.5, zoom = 1,
}: {
  dispersion?: number; mouseX?: number; mouseY?: number; zoom?: number;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return <div className="absolute inset-0 bg-transparent" />;

  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 50, near: 0.1, far: 20 }}
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      dpr={[1, 1.25]}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      performance={{ min: 0.3 }}
    >
      <Scene dispersion={dispersion} mouseX={mouseX} mouseY={mouseY} zoom={zoom} />
    </Canvas>
  );
}
