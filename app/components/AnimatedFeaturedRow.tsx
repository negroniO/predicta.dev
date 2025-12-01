// app/components/AnimatedFeaturedRow.tsx
"use client";

import React from "react";
import { motion, type Variants } from "framer-motion";
import Link from "next/link";

// SAME shape as your FeaturedProject in the carousel
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

type Props = {
  projects: Project[];
};

const containerVariants: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.18,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, x: 180 },
  show: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut" as const,
    },
  },
};

const AnimatedFeaturedRow: React.FC<Props> = ({ projects }) => {
  const visibleProjects = projects.slice(0, 3);
  if (visibleProjects.length === 0) return null;

  return (
    <motion.div
      className="grid gap-4 md:gap-5 md:grid-cols-3 mt-4"
      variants={containerVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.45 }}
    >
      {visibleProjects.map((project) => (
        <motion.article
          key={project.id}
          variants={cardVariants}
          className="group rounded-2xl border border-cardBorder bg-card/80 shadow-lg px-4 py-4 sm:px-5 sm:py-5 flex flex-col justify-between hover:-translate-y-1 hover:shadow-xl hover:border-accent/70 transition-transform transition-shadow duration-300"
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
  );
};

export default AnimatedFeaturedRow;
