"use client";

import React, { useEffect, useRef, useState } from "react";
import { line as d3Line, curveCatmullRom } from "d3-shape";

type Point = { x: number; y: number };

const HeroSparklineAtoms1: React.FC = () => {
  const width = 1200;
  const height = 160;

  // --- Time-series config ---
  const POINT_COUNT = 80;          // number of points in the line
  const MIN_Y = 30;                // chart lower bound (SVG y)
  const MAX_Y = height - 30;       // chart upper bound (SVG y)
  const INITIAL_Y = (MIN_Y + MAX_Y) / 2;
  const STEP_INTERVAL = 90;        // ms between new “ticks”
  const VOLATILITY = 14;           // larger = more up/down movement

  const [linePath, setLinePath] = useState<string>("");

  const dataRef = useRef<number[]>(
    Array.from({ length: POINT_COUNT }, () => INITIAL_Y)
  );
  const lastTimestampRef = useRef<number>(0);
  const rafRef = useRef<number>();

  useEffect(() => {
    const lineGen = d3Line<Point>()
      .x((p) => p.x)
      .y((p) => p.y)
      .curve(curveCatmullRom.alpha(0.6));

    const updatePathFromData = () => {
      const data = dataRef.current;
      const points: Point[] = data.map((v, i) => {
        const t = i / (POINT_COUNT - 1); // 0..1 across width
        return {
          x: t * width,
          y: v,
        };
      });

      const d = lineGen(points) || "";
      setLinePath(d);
    };

    const tick = (timestamp: number) => {
      if (!lastTimestampRef.current) {
        lastTimestampRef.current = timestamp;
      }

      const elapsed = timestamp - lastTimestampRef.current;

      if (elapsed >= STEP_INTERVAL) {
        const data = dataRef.current;
        const lastValue = data[data.length - 1];

        // Random walk step
        const delta = (Math.random() - 0.5) * VOLATILITY;
        let nextValue = lastValue + delta;

        // Clamp to [MIN_Y, MAX_Y]
        if (nextValue < MIN_Y) nextValue = MIN_Y;
        if (nextValue > MAX_Y) nextValue = MAX_Y;

        const newData = [...data.slice(1), nextValue];
        dataRef.current = newData;

        updatePathFromData();
        lastTimestampRef.current = timestamp;
      }

      rafRef.current = window.requestAnimationFrame(tick);
    };

    // Initial render
    updatePathFromData();
    rafRef.current = window.requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
    };
  }, [HEIGHT, width]); // HEIGHT isn’t defined; safe to remove or replace with `height`
  // better: use [] as deps because width/height are constants

  if (!linePath) return null;

  return (
    <section className="relative overflow-hidden bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-6xl px-4 pt-8 pb-10">
        <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 shadow-xl">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="pointer-events-none absolute inset-0 h-full w-full"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
          >
            <defs>
              <linearGradient id="sparkLineGradient" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>

              <radialGradient id="atomGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#e0f2fe" stopOpacity="1" />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
              </radialGradient>
            </defs>

            <g>
              {/* You can remove this translate animation if it feels like “too much” now */}
              <animateTransform
                attributeName="transform"
                type="translate"
                from="-40 0"
                to="0 0"
                dur="12s"
                repeatCount="indefinite"
              />

              {/* Shadow / background stroke */}
              <path
                id="spark-line"
                d={linePath}
                fill="none"
                stroke="rgba(15,23,42,0.9)"
                strokeWidth="10"
                strokeLinecap="round"
              />

              {/* Main gradient stroke */}
              <path
                d={linePath}
                fill="none"
                stroke="url(#sparkLineGradient)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Atoms moving along the path */}
              {[0, 0.3, 0.6].map((offset, idx) => (
                <circle key={idx} r={4} fill="url(#atomGlow)">
                  <animateMotion
                    dur={`${8 + idx * 1.5}s`}
                    repeatCount="indefinite"
                    keyPoints="0;1"
                    keyTimes="0;1"
                    calcMode="linear"
                    begin={`${offset * 4}s`}
                    rotate="auto"
                  >
                    <mpath xlinkHref="#spark-line" />
                  </animateMotion>
                  <animate
                    attributeName="r"
                    values="3.5;5;3.5"
                    dur="2s"
                    repeatCount="indefinite"
                    begin={`${offset * 2}s`}
                  />
                  <animate
                    attributeName="fill"
                    values="#e0f2fe;#22d3ee;#a855f7;#e0f2fe"
                    dur="4s"
                    repeatCount="indefinite"
                  />
                </circle>
              ))}

              {/* Background sparkles */}
              {Array.from({ length: 20 }).map((_, i) => (
                <circle
                  key={`bg-${i}`}
                  cx={(i * 97) % width}
                  cy={30 + ((i * 53) % (height - 60))}
                  r={1.5}
                  fill="rgba(148,163,184,0.35)"
                />
              ))}
            </g>
          </svg>

          <div className="relative z-10 px-6 py-10 sm:px-10 sm:py-12 lg:px-14 lg:py-16">
            <p className="mb-2 inline-flex items-center rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
              Data · Analytics · Science
            </p>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-slate-50">
              Hey, I’m George
              <span className="block text-slate-300 text-lg sm:text-xl lg:text-2xl mt-1">
                Data analytics & forecasting.
              </span>
            </h1>

            <p className="mt-4 max-w-xl text-sm sm:text-base text-slate-300">
              I work at the intersection of data, finance, and analytics —
              building models, dashboards, and tools that turn raw numbers into
              decisions. This sparkline nods to the kind of systems I like to build: simple on the surface, rich underneath.
            </p>

            <div className="mt-6 flex flex-wrap gap-3 text-sm">
              <a
                href="#projects"
                className="inline-flex items-center rounded-full bg-slate-50 px-4 py-2 font-medium text-slate-900 shadow-sm hover:bg-slate-200 transition"
              >
                Explore my work
              </a>
              <a
                href="#contact"
                className="inline-flex items-center rounded-full border border-slate-500/70 px-4 py-2 text-slate-100 hover:border-slate-300 hover:bg-slate-900/60 transition"
              >
                Let&apos;s connect
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSparklineAtoms1;
