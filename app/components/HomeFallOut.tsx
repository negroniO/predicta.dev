// app/components/HomeFallOut.tsx
"use client";

import React, { useEffect, useState, useRef } from "react";
import CardShell from "./CardShell";

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
  const clean1 = c1.replace("#", "");
  const clean2 = c2.replace("#", "");
  const r1 = parseInt(clean1.slice(0, 2), 16);
  const g1 = parseInt(clean1.slice(2, 4), 16);
  const b1 = parseInt(clean1.slice(4, 6), 16);
  const r2 = parseInt(clean2.slice(0, 2), 16);
  const g2 = parseInt(clean2.slice(2, 4), 16);
  const b2 = parseInt(clean2.slice(4, 6), 16);

  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);

  return `rgb(${r}, ${g}, ${b})`;
}

const HomeFall: React.FC = () => {
  const width = 1200;
  const height = 160;
  const PARTICLE_COUNT = 60;

  const [particles, setParticles] = useState<Particle[]>([]);
  const [mode, setMode] = useState<"float" | "fall">("float");

  const lastTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const fallTriggeredRef = useRef(false);

  // Initialise particles
  useEffect(() => {
    const THEME_START = "#22d3ee";
    const THEME_END = "#a855f7";

    const initial: Particle[] = Array.from({ length: PARTICLE_COUNT }).map(
      (_, i) => {
        const t = PARTICLE_COUNT > 1 ? i / (PARTICLE_COUNT - 1) : 0;
        const color = interpolateColor(THEME_START, THEME_END, t);

        const x = Math.random() * width;
        const y = Math.random() * height;

        const angle = Math.random() * Math.PI * 2;
        const speed = 18 + Math.random() * 22; // calm float
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;

        return { x, y, vx, vy, r: 3.2, color };
      }
    );

    setParticles(initial);
  }, []);

  // Animation loop
  useEffect(() => {
    if (!particles.length) return;

    const MAX_SPEED = 45;
    const EDGE_MARGIN = 10;

    const loop = (time: number) => {
      if (lastTimeRef.current == null) lastTimeRef.current = time;
      const dt = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      setParticles((prev) =>
        prev.map((p) => {
          let { vx, vy, x, y, r } = p;

          if (mode === "float") {
            // gentle random drift
            const ax = (Math.random() - 0.5) * 10;
            const ay = (Math.random() - 0.5) * 10;

            vx += ax * dt;
            vy += ay * dt;

            const speed = Math.hypot(vx, vy);
            if (speed > MAX_SPEED) {
              const factor = MAX_SPEED / speed;
              vx *= factor;
              vy *= factor;
            }

            x += vx * dt;
            y += vy * dt;

            // wrap edges
            if (x < -EDGE_MARGIN) x = width + EDGE_MARGIN;
            else if (x > width + EDGE_MARGIN) x = -EDGE_MARGIN;

            if (y < -EDGE_MARGIN) y = height + EDGE_MARGIN;
            else if (y > height + EDGE_MARGIN) y = -EDGE_MARGIN;
          } else {
            // fall mode
            const gravity = 120; // px/s²
            vy += gravity * dt;
            vx *= 0.98;

            x += vx * dt;
            y += vy * dt;

            // shrink as they fall
            r = Math.max(0, r * (1 - 0.8 * dt));

            if (y > height + 50) {
              y = height + 60;
              vy = 0;
              vx = 0;
              r = 0;
            }
          }

          return { ...p, x, y, vx, vy, r };
        })
      );

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [particles.length, mode, width, height]);

  // Scroll to portfolio
  const handleScrollDown = () => {
    if (fallTriggeredRef.current) return;
    fallTriggeredRef.current = true;

    setMode("fall");

    setTimeout(() => {
      const el = document.getElementById("homepage-main");
      if (el) {
        const rect = el.getBoundingClientRect();
        const offset = 72; // roughly header height, tweak to taste
        const targetY = rect.top + window.scrollY - offset;

        window.scrollTo({ top: targetY, behavior: "smooth" });
      }
    }, 900);
  };

  if (!particles.length) return null;

  return (
    // Full-screen intro hero
    <section className="min-h-screen flex items-center justify-center px-4">
      <div className="mx-auto max-w-6xl px-4 py-10 w-full">
        <CardShell className="min-h-[380px] md:min-h-[440px] flex items-stretch">
          {/* Background SVG */}
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="pointer-events-none absolute inset-0 h-full w-full"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g>
              {/* subtle background sparkles */}
              {Array.from({ length: 20 }).map((_, i) => (
                <circle
                  key={`bg-${i}`}
                  cx={(i * 97) % width}
                  cy={30 + ((i * 53) % (height - 60))}
                  r={1.5}
                  fill="rgba(148,163,184,0.35)"
                />
              ))}

              {/* particles */}
              {particles.map(
                (p, i) =>
                  p.r > 0 && (
                    <circle
                      key={i}
                      cx={p.x}
                      cy={p.y}
                      r={p.r}
                      fill={p.color}
                      fillOpacity={0.9}
                    />
                  )
              )}
            </g>
          </svg>

          {/* HERO CONTENT */}
          <div className="relative z-10 px-6 py-10 sm:px-10 sm:py-12 lg:px-14 lg:py-16 flex flex-col justify-between w-full">
            <div>
              <p className="mb-2 inline-flex items-center rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
                Data · Analytics · Science
              </p>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground max-w-2xl">
                Hey, I’m George
                <span className="block text-foreground/80 text-lg sm:text-xl lg:text-2xl mt-2">
                  I build data-driven systems that turn raw numbers into clear
                  decisions.
                </span>
              </h1>

              <p className="mt-4 max-w-xl text-sm sm:text-base text-foreground/80">
                Welcome to my portfolio. Explore projects across forecasting,
                financial analytics, and interactive dashboards — all focused on
                making complex systems simple and usable.
              </p>
            </div>

              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={handleScrollDown}
                  className="btn btn-outline relative px-8 py-5 text-foreground"
                  aria-label="Scroll to portfolio"
                >
                  <svg
                    className="h-7 w-7 text-accent arrow-pulse"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="5"
                  >
                    <path d="M6 9l6 6 6-6M6 5l6 6 6-6" />
                  </svg>
                </button>
              </div>
          </div>
        </CardShell>
      </div>
    </section>
  );
};

export default HomeFall;
