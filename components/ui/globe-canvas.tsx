"use client";

import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const Globe: React.FC<{ rotationSpeed: number; radius: number }> = ({
  rotationSpeed,
  radius,
}) => {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += rotationSpeed;
      groupRef.current.rotation.x += rotationSpeed * 0.2;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshBasicMaterial
          color="hsl(var(--primary))"
          transparent
          opacity={0.15}
          wireframe
        />
      </mesh>
    </group>
  );
};

export default function GlobeCanvas({
  rotationSpeed,
  radius,
}: {
  rotationSpeed: number;
  radius: number;
}) {
  return (
    <Canvas camera={{ position: [0, 0, 3], fov: 50 }}>
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} />
      <Globe rotationSpeed={rotationSpeed} radius={radius} />
    </Canvas>
  );
}
