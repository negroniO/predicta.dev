"use client";

import React, { useEffect, useRef } from "react";
import { area, curveCatmullRom } from "d3-shape";

type WaveAreaProps = {
  width?: number;
  height?: number;
  color?: string;
  background?: string;
};

const WaveArea: React.FC<WaveAreaProps> = ({
  width = 600,
  height = 250,
  color = "#4fc3f7",
  background = "#050816",
}) => {
  const pathRef = useRef<SVGPathElement | null>(null);

  useEffect(() => {
    const numPoints = 40;          // resolution of the wave
    const baseY = height * 0.6;    // baseline of the wave
    const amplitude = height * 0.15;
    const noiseAmp = height * 0.06;
    const speed = 0.03;            // horizontal wave speed
    const randomPhaseSpeed = 0.015;

    const generatePath = (phase: number, randomPhase: number) => {
      const points: [number, number][] = [];

      for (let i = 0; i < numPoints; i++) {
        const t = i / (numPoints - 1); // 0 → 1
        const x = t * width;

        // Base smooth sine wave
        const wave = Math.sin(t * Math.PI * 4 + phase); // 2 full waves

        // Extra “random-ish” variation using another sine with different frequency
        const randomish =
          Math.sin(t * Math.PI * 9 + randomPhase) *
          Math.cos(t * Math.PI * 5 + randomPhase * 1.7);

        const y =
          baseY -
          wave * amplitude -          // main wave
          randomish * noiseAmp;       // irregular up & down

        points.push([x, y]);
      }

      const areaGen = area<[number, number]>()
        .x((d) => d[0])
        .y0(height)                  // bottom of area
        .y1((d) => d[1])
        .curve(curveCatmullRom.alpha(0.8)); // smooth curve

      return areaGen(points) ?? "";
    };

    let frameId: number;
    let phase = 0;
    let randomPhase = 0;

    const animate = () => {
      phase += speed;
      randomPhase += randomPhaseSpeed;

      const d = generatePath(phase, randomPhase);
      if (pathRef.current) {
        pathRef.current.setAttribute("d", d);
      }

      frameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [width, height]);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background */}
      <rect width={width} height={height} fill={background} />

      <defs>
        <linearGradient id="waveFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.8} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* Area wave */}
      <path
        ref={pathRef}
        fill="url(#waveFill)"
        stroke={color}
        strokeWidth={2}
      />
    </svg>
  );
};

export default WaveArea;
