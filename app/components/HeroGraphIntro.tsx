"use client";

import React, { useMemo } from "react";
import { line as d3Line, area as d3Area, curveCatmullRom } from "d3-shape";

type Point = { x: number; y: number };

const sampleData = [10, 14, 18, 22, 19, 25, 30, 28, 34, 40];

const HeroGraphIntro: React.FC = () => {
  const width = 1200;
  const height = 260;

  const { linePath, areaPath } = useMemo(() => {
    if (!sampleData.length) return { linePath: "", areaPath: "" };

    const min = Math.min(...sampleData);
    const max = Math.max(...sampleData);
    const range = max === min ? 1 : max - min;

    const topPad = 20;
    const bottomPad = 20;
    const innerHeight = height - topPad - bottomPad;
    const baselineY = height - bottomPad;

    const points: Point[] = sampleData.map((value, i) => {
      const t = sampleData.length === 1 ? 0 : i / (sampleData.length - 1);
      const norm = (value - min) / range;
      const x = t * width;
      const y = topPad + (1 - norm) * innerHeight;
      return { x, y };
    });

    const lineGen = d3Line<Point>()
      .x((p) => p.x)
      .y((p) => p.y)
      .curve(curveCatmullRom.alpha(0.6));

    const areaGen = d3Area<Point>()
      .x((p) => p.x)
      .y1((p) => p.y)
      .y0(baselineY)
      .curve(curveCatmullRom.alpha(0.6));

    return {
      linePath: lineGen(points) || "",
      areaPath: areaGen(points) || "",
    };
  }, []);

  if (!linePath || !areaPath) return null;

  return (
    <section className="relative overflow-hidden bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-6xl px-4 pt-8 pb-10">
        <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 shadow-xl">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="pointer-events-none absolute inset-0 h-full w-full"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="heroFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="rgba(34,211,238,0.30)" />
                <stop offset="100%" stopColor="rgba(15,23,42,0)" />
              </linearGradient>

              <linearGradient id="heroLine" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>

            <g>
              <animateTransform
                attributeName="transform"
                type="translate"
                from="-80 0"
                to="0 0"
                dur="12s"
                repeatCount="indefinite"
              />

              <path d={areaPath} fill="url(#heroFill)" opacity="0.9" />
              <path
                d={linePath}
                fill="none"
                stroke="rgba(34,211,238,0.35)"
                strokeWidth="14"
                strokeLinecap="round"
              />
              <path
                d={linePath}
                fill="none"
                stroke="url(#heroLine)"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </g>
          </svg>

          <div className="relative z-10 px-6 py-10 sm:px-10 sm:py-12 lg:px-14 lg:py-16">
            <p className="mb-2 inline-flex items-center rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
              Data · Analytics · Science
            </p>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-slate-50">
              Hey, I’m George —
              <span className="block text-slate-300 text-lg sm:text-xl lg:text-2xl mt-1">
                I turn noisy data into clear decisions.
              </span>
            </h1>

            <p className="mt-4 max-w-xl text-sm sm:text-base text-slate-300">
              Data & analytics engineering with a focus on forecasting, collections, and operational rigor. This live graph mirrors the way I like to work: structured, visual, and always moving.
            </p>

            <div className="mt-6 flex flex-wrap gap-3 text-sm">
              <a
                href="#projects"
                className="inline-flex items-center rounded-full bg-slate-50 px-4 py-2 font-medium text-slate-900 shadow-sm hover:bg-slate-200 transition"
              >
                View my projects
              </a>
              <a
                href="#contact"
                className="inline-flex items-center rounded-full border border-slate-500/70 px-4 py-2 text-slate-100 hover:border-slate-300 hover:bg-slate-900/60 transition"
              >
                Let’s work together
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroGraphIntro;
