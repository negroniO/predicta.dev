"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  motion,
  AnimatePresence,
  useInView,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import Link from "next/link";

type Project = {
  id: number;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  tags: string[] | null;
  category?: string | null;
  year?: number | string | null;
};

const AUTO_DELAY_MS = 5000;

type Props = {
  projects: Project[];
};

// Typed variants with easing array (no TS error)
const cardVariants: Variants = {
  hidden: { opacity: 0, x: 120 },
  show: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.55, //0.55,
      delay: i * 0.35,          // 0s, 0.15s, 0.30s → 1–2–3
      ease: "easeOut" //[0.4, 0, 0.2, 1] // [0.16, 1, 0.3, 1],  // smooth “easeOut” style
    },
  }),
};

const FeaturedRowCarousel: React.FC<Props> = ({ projects }) => {

  const PAGE_SIZE = 3;
  const pageCount = Math.max(1, Math.ceil(projects.length / PAGE_SIZE));

  const [page, setPage] = useState(0);
  const [isHover, setIsHover] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useReducedMotion();

  // 👇 Observe the card row area
  const rowRef = useRef<HTMLDivElement | null>(null);
  const isInView = useInView(rowRef, {
    once: false,     // stop rotating while the section is off screen
    amount: 0.5,     // require ~50% of the row visible
  });

  // Keep the first cards visible in server HTML; only autoplay needs visibility.
  useEffect(() => {
    if (!isInView || pageCount <= 1 || isHover || isFocused || paused || reduceMotion) return;

    const id = window.setInterval(() => {
      setPage((prev) => (prev + 1) % pageCount);
    }, AUTO_DELAY_MS);

    return () => window.clearInterval(id);
  }, [pageCount, isHover, isFocused, paused, reduceMotion, isInView]);

  if (!projects.length) return null;

  // Compute the visible 3 projects for the current "page"
  const currentPage = Math.min(page, pageCount - 1);
  const start = currentPage * PAGE_SIZE;
  let visible = projects.slice(start, start + PAGE_SIZE);

  // Wrap around if needed on last page
  if (visible.length < PAGE_SIZE && projects.length > PAGE_SIZE) {
    visible = [...visible, ...projects.slice(0, PAGE_SIZE - visible.length)];
  }

  return (
    <section
      className="w-full"
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setIsFocused(false); }}
      aria-label="Featured projects"
      aria-roledescription="carousel"
    >
      {/* Sentinel to trigger in-view without showing empty space */}
      <div ref={rowRef} className="h-px w-full" />

      {/* The first cards are available without scrolling or JavaScript. */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={false}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, x: -80 }}
            transition={{ duration: reduceMotion ? 0 : 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="grid gap-4 md:gap-5 md:grid-cols-3"
          >
            {visible.map((project, index) => (
              <motion.article
                key={project.id}
                variants={cardVariants}
                initial={false}
                animate="show"
                custom={index} // drives the 1→2→3 cascading delay
                className="group rounded-2xl border border-card-border/80 bg-card/80 shadow-[0_10px_30px_-18px_rgba(34,211,238,0.25)] px-4 py-3 sm:px-5 sm:py-4 flex flex-col justify-between hover:-translate-y-1 hover:shadow-[0_15px_50px_-16px_rgba(34,211,238,0.35)] transition-transform transition-shadow duration-300 min-h-[220px]"
              >
                <div className="space-y-2">
                  {project.year && (
                    <p className="text-[10px] uppercase tracking-[0.2em] text-foreground/60">
                      {project.year}
                    </p>
                  )}
                  <h3 className="text-sm font-semibold text-foreground line-clamp-2">
                    {project.title}
                  </h3>
                  {(project.subtitle || project.description) && (
                    <p className="text-xs text-foreground/70 line-clamp-3">
                      {project.subtitle || project.description}
                    </p>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between text-[11px]">
                  <Link
                    href={`/projects/${project.slug}`}
                    className="btn btn-section btn-sm"
                  >
                    View case study
                  </Link>
                  {project.category && (
                    <span className="text-foreground/50 text-[10px]">
                      {project.category}
                    </span>
                  )}
                </div>
              </motion.article>
            ))}
          </motion.div>
        </AnimatePresence>

      {pageCount > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {Array.from({ length: pageCount }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { setPage(i); setPaused(true); }}
              aria-pressed={i === currentPage}
              className={`min-h-6 min-w-6 rounded-full transition-all ${
                i === currentPage
                  ? "w-5 bg-cyan-400"
                  : "w-2 bg-slate-600/70 hover:bg-slate-400/80"
              }`}
              aria-label={`Go to featured project set ${i + 1}`}
            />
          ))}
          <button type="button" onClick={() => setPaused((value) => !value)} className="text-xs text-cyan-300 underline px-2 motion-reduce:hidden" aria-label={paused ? "Resume featured project rotation" : "Pause featured project rotation"}>
              {paused ? "Resume" : "Pause"}
          </button>
        </div>
      )}
    </section>
  );
};

export default FeaturedRowCarousel;
