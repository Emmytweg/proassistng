"use client";

import dynamic from "next/dynamic";
import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface DotGlobeHeroProps extends React.ComponentPropsWithoutRef<"div"> {
  rotationSpeed?: number;
  globeRadius?: number;
}

type GlobeCanvasProps = {
  rotationSpeed: number;
  radius: number;
};

const GlobeCanvas = dynamic<GlobeCanvasProps>(
  () => import("./globe-canvas").then((mod) => mod.default),
  { ssr: false },
);

const DotGlobeHero = React.forwardRef<HTMLDivElement, DotGlobeHeroProps>(
  (
    { rotationSpeed = 0.003, globeRadius = 1.2, className, children, ...props },
    ref,
  ) => {
    const [showGlobe, setShowGlobe] = useState(false);

    useEffect(() => {
      const w = window as unknown as {
        requestIdleCallback?: (cb: () => void) => number;
        cancelIdleCallback?: (id: number) => void;
      };

      if (typeof w.requestIdleCallback === "function") {
        const idleId = w.requestIdleCallback(() => setShowGlobe(true));
        return () => {
          if (typeof w.cancelIdleCallback === "function") {
            w.cancelIdleCallback(idleId);
          }
        };
      }

      const timeoutId = window.setTimeout(() => setShowGlobe(true), 300);
      return () => window.clearTimeout(timeoutId);
    }, []);

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
        {showGlobe && (
          <div className="absolute inset-0 z-0 pointer-events-none">
            <GlobeCanvas rotationSpeed={rotationSpeed} radius={globeRadius} />
          </div>
        )}
      </div>
    );
  },
);

DotGlobeHero.displayName = "DotGlobeHero";

export { DotGlobeHero };
