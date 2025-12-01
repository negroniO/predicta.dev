"use client";

import React, { useEffect, useState } from "react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  color: string;
};

// Helper: interpolate between two hex colors (0 ≤ t ≤ 1)
function interpolateColor(c1: string, c2: string, t: number): string {
  const parseHex = (hex: string) => {
    const clean = hex.replace("#", "");
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return [r, g, b];
  };

  const [r1, g1, b1] = parseHex(c1);
  const [r2, g2, b2] = parseHex(c2);

  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);

  return `rgb(${r}, ${g}, ${b})`;
}

const IdealGasCycle: React.FC = () => {
  // Full hero area for motion
  const width = 1200;
  const height = 160;

  const PARTICLE_COUNT = 40;

  const [particles, setParticles] = useState<Particle[]>([]);

  // Initialise particles once
  useEffect(() => {
    const THEME_START = "#22d3ee"; // cyan
    const THEME_END = "#a855f7";   // violet

    const initial: Particle[] = Array.from({ length: PARTICLE_COUNT }).map(
      (_, i) => {
        const t = PARTICLE_COUNT > 1 ? i / (PARTICLE_COUNT - 1) : 0;
        const color = interpolateColor(THEME_START, THEME_END, t);

        const x = Math.random() * width;
        const y = Math.random() * height;

        const angle = Math.random() * Math.PI * 2;
        const speed = 15 + Math.random() * 25; // slower, more “spacey”
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;

        return {
          x,
          y,
          vx,
          vy,
          r: 3.2,
          color,
        };
      }
    );

    setParticles(initial);
  }, []);

  // Animation: free movement with wrap-around, slight random acceleration
  useEffect(() => {
    if (!particles.length) return;

    let rafId: number;
    let lastTime = performance.now();

    const MAX_SPEED = 45; // clamp speed so it doesn’t explode
    const EDGE_MARGIN = 10; // allow a little offscreen before wrap

    const loop = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      setParticles((prev) =>
        prev.map((p) => {
          // small random acceleration → organic drifting
          const ax = (Math.random() - 0.5) * 20; // px/s²
          const ay = (Math.random() - 0.5) * 20;

          let vx = p.vx + ax * dt;
          let vy = p.vy + ay * dt;

          // clamp speed
          const speed = Math.hypot(vx, vy);
          if (speed > MAX_SPEED) {
            const factor = MAX_SPEED / speed;
            vx *= factor;
            vy *= factor;
          }

          let x = p.x + vx * dt;
          let y = p.y + vy * dt;

          // wrap-around horizontally
          if (x < -EDGE_MARGIN) x = width + EDGE_MARGIN;
          else if (x > width + EDGE_MARGIN) x = -EDGE_MARGIN;

          // wrap-around vertically
          if (y < -EDGE_MARGIN) y = height + EDGE_MARGIN;
          else if (y > height + EDGE_MARGIN) y = -EDGE_MARGIN;

          return {
            ...p,
            x,
            y,
            vx,
            vy,
          };
        })
      );

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [particles.length]);

  if (!particles.length) return null;

  return (
    <section className="relative overflow-hidden bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-6xl px-4 pt-8 pb-10">
        <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 shadow-xl">
          {/* Background SVG for the hero card */}
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="pointer-events-none absolute inset-0 h-full w-full"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g>
              {/* subtle horizontal drift like the sparkline hero */}
              <animateTransform
                attributeName="transform"
                type="translate"
                from="-40 0"
                to="0 0"
                dur="10s"
                repeatCount="indefinite"
              />

              {/* background sparkles */}
              {Array.from({ length: 20 }).map((_, i) => (
                <circle
                  key={`bg-${i}`}
                  cx={(i * 97) % width}
                  cy={30 + ((i * 53) % (height - 60))}
                  r={1.5}
                  fill="rgba(148,163,184,0.35)"
                />
              ))}

              {/* free-floating gradient particles */}
              {particles.map((p, i) => (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r={p.r}
                  fill={p.color}
                  fillOpacity={0.95}
                />
              ))}
            </g>
          </svg>

          {/* HERO CONTENT (updated copy: no more "gas" wording) */}
          <div className="relative z-10 px-6 py-10 sm:px-10 sm:py-12 lg:px-14 lg:py-16">
            <p className="mb-2 inline-flex items-center rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
              Data · Analytics · Science
            </p>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-slate-50">
              Hey, I’m George
              <span className="block text-slate-300 text-lg sm:text-xl lg:text-2xl mt-1">
                Data analytics &amp; forecasting.
              </span>
            </h1>

            <p className="mt-4 max-w-xl text-sm sm:text-base text-slate-300">
              I work at the intersection of data, finance, and analytics —
              building models, dashboards, and tools that turn raw numbers into
              decisions. The background visual shows free-floating particles
              moving through space, echoing the dynamic systems I like to build.
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

export default IdealGasCycle;
