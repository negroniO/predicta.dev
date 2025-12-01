"use client";

import React, { useEffect, useMemo, useState } from "react";
import CardShell from "./CardShell";

type RawPoint = { x: number; y: number };

type MlScatterLiveProps = {
  /** Optional real data. If provided, we do NOT random-jitter. */
  data?: RawPoint[];
};

const MlScatterLive: React.FC<MlScatterLiveProps> = ({ data }) => {
  const width = 1200;
  const height = 260;

  const padding = {
    left: 60,
    right: 24,
    top: 30,
    bottom: 40,
  };

  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // If `data` not provided, we manage our own random, animated data
  const [internalData, setInternalData] = useState<RawPoint[] | null>(null);

  // Initialise internal random data once (if no real data)
  useEffect(() => {
    if (data && data.length > 0) return; // using real data, skip

    const points: RawPoint[] = Array.from({ length: 30 }).map((_, i) => {
      const x = i + 1; // 1..30
      // base linear trend + noise
      const y = 0.4 * x + 0.8 + (Math.random() - 0.5) * 2.2;
      return { x, y };
    });
    setInternalData(points);
  }, [data]);

  // Animate internal data: gentle jitter in y over time
  useEffect(() => {
    if (data && data.length > 0) return; // real data, no random animation
    if (!internalData) return;

    const interval = setInterval(() => {
      setInternalData((prev) => {
        if (!prev) return prev;
        return prev.map((p) => {
          const jitter = (Math.random() - 0.5) * 0.25; // small y jitter
          return { ...p, y: p.y + jitter };
        });
      });
    }, 900); // ms – tweak speed

    return () => clearInterval(interval);
  }, [data, internalData]);

  // pick which dataset to use
  const rawData = data && data.length > 0 ? data : internalData ?? [];

  const { points, linePath } = useMemo(() => {
    if (!rawData.length) {
      return { points: [] as { svgX: number; svgY: number }[], linePath: "" };
    }

    const xs = rawData.map((p) => p.x);
    const ys = rawData.map((p) => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const scaleX = (x: number) =>
      padding.left + ((x - minX) / (maxX - minX || 1)) * plotWidth;

    // SVG y increases downward, so invert
    const scaleY = (y: number) =>
      padding.top +
      (1 - (y - minY) / (maxY - minY || 1)) * plotHeight;

    // simple linear regression: y = a + b x
    const n = rawData.length;
    const meanX = xs.reduce((s, v) => s + v, 0) / n;
    const meanY = ys.reduce((s, v) => s + v, 0) / n;

    let num = 0;
    let den = 0;
    for (let i = 0; i < n; i++) {
      const dx = xs[i] - meanX;
      const dy = ys[i] - meanY;
      num += dx * dy;
      den += dx * dx;
    }
    const b = den === 0 ? 0 : num / den; // slope
    const a = meanY - b * meanX; // intercept

    const x1 = minX;
    const y1 = a + b * x1;
    const x2 = maxX;
    const y2 = a + b * x2;

    const linePath =
      `M ${scaleX(x1)},${scaleY(y1)} ` +
      `L ${scaleX(x2)},${scaleY(y2)}`;

    const scaledPoints = rawData.map((p) => ({
      svgX: scaleX(p.x),
      svgY: scaleY(p.y),
    }));

    return { points: scaledPoints, linePath };
  }, [rawData, padding.left, padding.right, padding.top, padding.bottom, plotWidth, plotHeight]);

  const handleScrollDown = () => {
    const el = document.getElementById("homepage-main");
    if (el) {
      const rect = el.getBoundingClientRect();
      const offset = 72;
      window.scrollTo({
        top: rect.top + window.scrollY - offset,
        behavior: "smooth",
      });
    }
  };

  const hasData = rawData.length > 0;

  return (
    <section className="min-h-[340px] flex items-center justify-center px-4">
      <div className="mx-auto max-w-6xl px-4 py-8 w-full">
        <CardShell className="relative flex flex-col md:flex-row items-stretch overflow-hidden">
          {/* SCATTERPLOT BACKGROUND */}
          {hasData && (
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="pointer-events-none absolute inset-0 h-full w-full z-0"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="scatter-reg-line" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#22d3ee" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>

              {/* axes */}
              <g stroke="rgba(148,163,184,0.35)" strokeWidth="1">
                {/* y-axis */}
                <line
                  x1={padding.left}
                  y1={padding.top}
                  x2={padding.left}
                  y2={height - padding.bottom}
                />
                {/* x-axis */}
                <line
                  x1={padding.left}
                  y1={height - padding.bottom}
                  x2={width - padding.right}
                  y2={height - padding.bottom}
                />
              </g>

              {/* gridlines */}
              <g stroke="rgba(15,23,42,0.8)" strokeWidth="1">
                {[0.25, 0.5, 0.75].map((k) => {
                  const y =
                    padding.top + k * (height - padding.top - padding.bottom);
                  return (
                    <line
                      key={`h-${k}`}
                      x1={padding.left}
                      y1={y}
                      x2={width - padding.right}
                      y2={y}
                      strokeDasharray="4 6"
                    />
                  );
                })}
              </g>

              {/* regression line */}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke="url(#scatter-reg-line)"
                  strokeWidth={3}
                  strokeLinecap="round"
                />
              )}

              {/* scatter points */}
              <g>
                {points.map((p, i) => (
                  <circle
                    key={i}
                    cx={p.svgX}
                    cy={p.svgY}
                    r={3}
                    fill="rgba(148,163,184,0.9)"
                  >
                    {/* subtle breathing effect per point */}
                    <animate
                      attributeName="r"
                      values="2.6;3.4;2.6"
                      dur={`${2 + (i % 5) * 0.4}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                ))}
              </g>
            </svg>
          )}

          {/* TEXT CONTENT */}
          <div className="relative z-10 w-full px-6 py-8 sm:px-10 sm:py-10 lg:px-12 lg:py-12 flex flex-col justify-between">
            <div className="max-w-xl">
              <p className="mb-2 inline-flex items-center rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
                Regression · Live fit · Signal
              </p>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-foreground">
                Fitting models as the data moves
              </h2>

              <p className="mt-3 text-sm sm:text-base text-foreground/80">
                As the scatterpoints shift, the regression line constantly
                refits. That&apos;s the core of applied ML work: real data is messy
                and dynamic, so the model needs to respond — not just once, but
                continuously.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3 text-xs sm:text-sm">
              <button
                type="button"
                onClick={handleScrollDown}
                className="inline-flex items-center gap-2 rounded-full border border-card-border/70 bg-card/70 px-4 py-2 text-foreground hover:border-accent hover:text-accent transition"
              >
                <span>Scroll to portfolio</span>
                <span className="text-sm">⌄</span>
              </button>
              <span className="inline-flex items-center rounded-full border border-slate-700/70 bg-slate-900/60 px-3 py-1 text-[11px] text-slate-300">
                Linear regression · Dynamic data
              </span>
            </div>
          </div>
        </CardShell>
      </div>
    </section>
  );
};

export default MlScatterLive;
