"use client";

import React, { useEffect, useRef, useState } from "react";
import CardShell from "./CardShell";

type Paths = {
  main: string;
  mid: string;
  low: string;
};

type HoverState = {
  u: number;                       // 0..1 horizontal position
  target: "main" | "mid" | "low";  // which line is currently active
  dir: number;                     // -1 (cursor above line), 1 (below)
} | null;

type SpringState = {
  pos: number; // current bend factor (e.g. -1..1)
  vel: number; // current velocity
};

const MlHome: React.FC = () => {
  const width = 1200;
  const height = 420; // logical SVG height
  const POINTS = 120;

  const [paths, setPaths] = useState<Paths | null>(null);

  const rafRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // hover + active line info
  const hoverRef = useRef<HoverState>(null);

  // store time so we can compute dt and reuse in base wave
  const tRef = useRef(0);
  const lastTimeRef = useRef<number | null>(null);

  // spring state for each line
  const springsRef = useRef<{
    main: SpringState;
    mid: SpringState;
    low: SpringState;
  }>({
    main: { pos: 0, vel: 0 },
    mid: { pos: 0, vel: 0 },
    low: { pos: 0, vel: 0 },
  });

  const top = 24;
  const bottom = height - 26;
  const innerH = bottom - top;

  useEffect(() => {
    const makeWave = (
      id: "main" | "mid" | "low",
      base: number,
      amp: number,
      freq: number,
      speed: number,
      t: number,
      phase: number
    ) => {
      const parts: string[] = [];
      const hover = hoverRef.current;
      const spring = springsRef.current[id];

      // hover deformation config
      const hoverSigma = 0.16; // 0.08; // width of influence (fraction of width)
      const hoverAmp =  44; // 34;     // max bend in px

      const isActiveLine = hover && hover.target === id;

      for (let i = 0; i < POINTS; i++) {
        const u = i / (POINTS - 1);
        const x = u * width;

        const centerY = top + base * innerH;
        const baseY =
          centerY +
          Math.sin(u * freq * 2 * Math.PI + t * speed + phase) * amp;

        let bend = 0;
        if (isActiveLine && hover) {
          const du = u - hover.u;
          const falloff = Math.exp(
            -(du * du) / (2 * hoverSigma * hoverSigma)
          );

          // spring.pos is in [-something, +something], we use it as
          // gentle multiplier instead of abrupt sin(t) wiggle
          bend = hoverAmp * falloff * spring.pos;
        }

        const y = baseY + bend;
        parts.push(`${i === 0 ? "M" : "L"}${x},${y}`);
      }

      return parts.join(" ");
    };

    const loop = (time: number) => {
      if (lastTimeRef.current == null) {
        lastTimeRef.current = time;
      }
      const dt = (time - lastTimeRef.current) / 1000; // seconds
      lastTimeRef.current = time;

      // clamp dt a bit (for tab switching etc.)
      const safeDt = Math.min(dt, 0.05);

      const t = (time / 1000);
      tRef.current = t;

      const hover = hoverRef.current;

      // --- SPRING UPDATE FOR EACH LINE ---
      const k = 16; // 22;      // spring stiffness (higher = snappier)
      const damping = 7; // 8; // damping (higher = less oscillation)

      (["main", "mid", "low"] as const).forEach((id) => {
        const s = springsRef.current[id];
        // target is -1/0/1 depending on whether this is the active line
        let target = 0;
        if (hover && hover.target === id) {
          target = hover.dir; // -1 (above) or +1 (below)
        }

        const accel = k * (target - s.pos) - damping * s.vel;
        s.vel += accel * safeDt;
        s.pos += s.vel * safeDt;
      });

      // build paths using the updated spring state
      const mainPath = makeWave("main", 0.3, 52, 1.0, 0.9, t, 0.0);
      const midPath  = makeWave("mid",  0.52, 36, 0.85, 0.7, t, 1.4);
      const lowPath  = makeWave("low",  0.78, 26, 0.7,  0.55, t, 2.6);

      setPaths({ main: mainPath, mid: midPath, low: lowPath });
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // helper: compute base Y (without bending) for a given line at a given u
  const baseYForLine = (
    id: "main" | "mid" | "low",
    u: number,
    t: number
  ): number => {
    let base: number, amp: number, freq: number, speed: number, phase: number;

    if (id === "main") {
      base = 0.3;
      amp = 52;
      freq = 1.0;
      speed = 0.9;
      phase = 0.0;
    } else if (id === "mid") {
      base = 0.52;
      amp = 36;
      freq = 0.85;
      speed = 0.7;
      phase = 1.4;
    } else {
      base = 0.78;
      amp = 26;
      freq = 0.7;
      speed = 0.55;
      phase = 2.6;
    }

    const centerY = top + base * innerH;
    return (
      centerY +
      Math.sin(u * freq * 2 * Math.PI + t * speed + phase) * amp
    );
  };

  // mouse over the CONTAINER, not the svg
  const handleMouseMove: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    const xPx = e.clientX - rect.left;
    const yPx = e.clientY - rect.top;

    const u = xPx / rect.width;
    if (u < 0 || u > 1) {
      hoverRef.current = null;
      return;
    }

    // convert mouse y from px to SVG coordinate
    const ySvg = (yPx / rect.height) * height;
    const t = tRef.current;

    // compute which line is closest at this u
    const ids: ("main" | "mid" | "low")[] = ["main", "mid", "low"];
    let bestId: "main" | "mid" | "low" = "main";
    let bestDist = Infinity;
    let bestY = 0;

    for (const id of ids) {
      const lineY = baseYForLine(id, u, t);
      const dist = Math.abs(lineY - ySvg);
      if (dist < bestDist) {
        bestDist = dist;
        bestId = id;
        bestY = lineY;
      }
    }

    const dir = ySvg < bestY ? -1 : 1;

    hoverRef.current = { u, target: bestId, dir };
  };

  const handleMouseLeave: React.MouseEventHandler<HTMLDivElement> = () => {
    hoverRef.current = null;
  };

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

  if (!paths) return null;

  return (
    <section className="min-h-screen flex items-center justify-center px-4">
      <div className="mx-auto max-w-6xl px-4 py-10 w-full">
        {/* INTERACTION CONTAINER */}
        <div
          ref={containerRef}
          className="relative min-h-[380px] md:min-h-[440px]"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <CardShell className="relative h-full flex items-stretch overflow-hidden">
            {/* SVG BACKGROUND INSIDE THE CARD */}
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="pointer-events-none absolute inset-0 h-full w-full z-0"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="ml-main-line" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#22d3ee" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
                <radialGradient id="ml-signal-dot" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#e0f2fe" stopOpacity="1" />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* faint horizontal guides */}
              <g stroke="rgba(15,23,42,0.7)" strokeWidth="1">
                <line x1="0" y1="90" x2={width} y2="90" />
                <line x1="0" y1="130" x2={width} y2="130" />
              </g>

              {/* low + mid + main lines */}
              <path
                d={paths.low}
                fill="none"
                stroke="rgba(148,163,184,0.40)"
                strokeWidth={1.5}
                strokeLinecap="round"
              />
              <path
                d={paths.mid}
                fill="none"
                stroke="rgba(148,163,184,0.55)"
                strokeWidth={2}
                strokeLinecap="round"
              />
              <path
                id="ml-hero-line"
                d={paths.main}
                fill="none"
                stroke="url(#ml-main-line)"
                strokeWidth={3.5}
                strokeLinecap="round"
              />

              {/* moving signal dots along the main line */}
              {[0, 0.45].map((offset, idx) => (
                <circle key={idx} r={5} fill="url(#ml-signal-dot)">
                  <animateMotion
                    dur={`${14 + idx * 2}s`}
                    repeatCount="indefinite"
                    keyPoints="0;1"
                    keyTimes="0;1"
                    calcMode="linear"
                    begin={`${offset * 8}s`}
                    rotate="auto"
                  >
                    <mpath xlinkHref="#ml-hero-line" />
                  </animateMotion>
                </circle>
              ))}
            </svg>

            {/* HERO CONTENT ABOVE SVG */}
            <div className="relative z-10 px-6 py-10 sm:px-10 sm:py-12 lg:px-14 lg:py-16 flex flex-col justify-between w-full">
              <div>
                {/* Accessible heading (visually hidden to avoid repeating the big hero title) */}
                <h1 className="sr-only">George — Data, Analytics, and Science</h1>
                <p className="mb-2 inline-flex items-center rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
                  Data · Analytics · Science
                </p>
                
                <p className="mt-4 max-w-xl text-sm sm:text-base text-foreground/80">
                  Welcome — this is where I share the analytical tools, dashboards, and forecasting systems I build to turn complexity into clarity.
                </p>
              </div>

              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={handleScrollDown}
                  className="btn btn-outline relative px-5 py-3 text-foreground"
                  aria-label="Scroll to portfolio"
                >
                  <svg
                    className="h-6 w-6 text-accent arrow-pulse"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M6 9l6 6 6-6M6 5l6 6 6-6" />
                  </svg>
                </button>
              </div>
            </div>    
          </CardShell>
        </div>
      </div>
    </section>
  );
};

export default MlHome;
