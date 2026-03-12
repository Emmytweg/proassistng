"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import React, { useRef } from "react";
import * as THREE from "three";
import { cn } from "@/lib/utils";

interface DotGlobeHeroProps extends React.ComponentPropsWithoutRef<"div"> {
  rotationSpeed?: number;
  globeRadius?: number;
}

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

const DotGlobeHero = React.forwardRef<HTMLDivElement, DotGlobeHeroProps>(
  (
    { rotationSpeed = 0.003, globeRadius = 1.2, className, children, ...props },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative w-full h-screen bg-background overflow-hidden",
          className,
        )}
        {...props}
      >
        {/* Content */}
        <div className="relative z-10 flex items-center justify-center h-full">
          {children}
        </div>

        {/* 3D Globe */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <Canvas camera={{ position: [0, 0, 3], fov: 50 }}>
            <ambientLight intensity={0.6} />
            <pointLight position={[10, 10, 10]} />
            <Globe rotationSpeed={rotationSpeed} radius={globeRadius} />
          </Canvas>
        </div>
      </div>
    );
  },
);

DotGlobeHero.displayName = "DotGlobeHero";

export { DotGlobeHero };
