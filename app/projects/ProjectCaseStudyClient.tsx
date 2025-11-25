"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { marked } from "marked";
import { useEffect, useState } from "react";

type NavProject = { slug: string; title: string };

type Project = {
  slug: string;
  title: string;
  subtitle: string | null;
  description: string;
  content: string | null;
  githubUrl: string | null;
  liveUrl: string | null;
  year: number;
  tags: string[] | null;
  techStack: string[] | null;
  status: string;
  readingTime?: number;
  createdAt: string | Date;
  updatedAt: string | Date;
  views?: number; // 👈 added
};

const container = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, staggerChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 },
  },
};

function formatDate(value: string | Date) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function ProjectCaseStudyClient({
  project,
  prevProject,
  nextProject,
  views = 0,
}: {
  project: Project;
  prevProject?: NavProject | null;
  nextProject?: NavProject | null;
  views?: number;
}) {
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function renderMarkdown() {
      if (project.content && project.content.trim().length > 0) {
        const parsed = await marked(project.content); // always resolves to string
        if (isMounted) setHtml(parsed);
      } else {
        if (isMounted) setHtml(null);
      }
    }

    renderMarkdown();

    return () => {
      isMounted = false;
    };
  }, [project.content]);

  const fallbackParagraphs =
    !project.content || project.content.trim().length === 0
      ? project.description
          ?.split(/\n{2,}/)
          .map((p) => p.trim())
          .filter(Boolean)
      : [];

  const readingLabel =
    project.readingTime && project.readingTime > 0
      ? `${project.readingTime} min`
      : "—";

  const publishedLabel = formatDate(project.createdAt);
  const updatedLabel = formatDate(project.updatedAt);

  // 🔧 JSON-LD structured data
  const baseUrl = "https://predicta.dev";
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: project.title,
    description: project.subtitle || project.description,
    datePublished: new Date(project.createdAt).toISOString(),
    dateModified: new Date(project.updatedAt).toISOString(),
    author: {
      "@type": "Person",
      name: "George Iordanous",
      url: baseUrl,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${baseUrl}/projects/${project.slug}`,
    },
    url: `${baseUrl}/projects/${project.slug}`,
    inLanguage: "en-GB",
    keywords: [
      ...(project.tags ?? []),
      ...(project.techStack ?? []),
    ].join(", "),
  };

  return (
    <>
      {/* JSON-LD for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <motion.div
        className="max-w-5xl mx-auto px-4 py-10 space-y-8"
        initial="hidden"
        animate="show"
        variants={container}
      >
        {/* Breadcrumb */}
        <motion.nav
          variants={item}
          className="text-[11px] text-slate-400 mb-1 flex flex-wrap items-center gap-1"
        >
          <Link href="/" className="hover:text-cyan-300">
            Home
          </Link>
          <span>/</span>
          <Link href="/projects" className="hover:text-cyan-300">
            Projects
          </Link>
          <span>/</span>
          <span className="text-slate-200">{project.title}</span>
        </motion.nav>

        {/* Header */}
        <motion.header variants={item} className="space-y-3">
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-300/80">
            Case Study
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            {project.title}
          </h1>
          {project.subtitle && (
            <p className="text-sm text-slate-300 max-w-2xl">
              {project.subtitle}
            </p>
          )}
        </motion.header>

        {/* Meta row under title: published / edited / reading / reads */}
        <motion.div
          variants={item}
          className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400 border-b border-slate-800 pb-3"
        >
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <span>
              <span className="uppercase tracking-[0.16em] text-slate-500">
                Published:
              </span>{" "}
              {publishedLabel}
            </span>
            <span>
              <span className="uppercase tracking-[0.16em] text-slate-500">
                Last edited:
              </span>{" "}
              {updatedLabel}
            </span>
            <span>
              <span className="uppercase tracking-[0.16em] text-slate-500">
                Reading time:
              </span>{" "}
              {readingLabel}
            </span>
          </div>

          {/* Reads pill (top-right) */}
          <div className="flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900/80 px-2.5 py-1 text-[11px] text-slate-200">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-3.5 w-3.5 text-cyan-300"
            >
              <path
                fill="currentColor"
                d="M12 5C7 5 2.73 8.11 1 12c1.73 3.89 6 7 11 7s9.27-3.11 11-7c-1.73-3.89-6-7-11-7Zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z"
              />
            </svg>
            <span className="font-medium">{views}</span>
            <span className="text-slate-400">reads</span>
          </div>
        </motion.div>

        {/* Tech stack row */}
        {project.techStack && project.techStack.length > 0 && (
          <motion.div
            variants={item}
            className="flex flex-wrap items-center gap-2 text-[11px] text-slate-300"
          >
            <span className="uppercase tracking-[0.16em] text-slate-500">
              Tech stack
            </span>
            <div className="flex flex-wrap gap-1.5">
              {project.techStack.map((tech) => (
                <span
                  key={tech}
                  className="px-2 py-1 rounded-full bg-slate-900/70 border border-slate-700/70 text-[11px]"
                >
                  {tech}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Tags row */}
        {project.tags && project.tags.length > 0 && (
          <motion.div
            variants={item}
            className="flex flex-wrap items-center gap-2 text-[11px] text-slate-300"
          >
            <span className="uppercase tracking-[0.16em] text-slate-500">
              Tags
            </span>
            <div className="flex flex-wrap gap-1.5">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 rounded-full bg-slate-900/70 border border-slate-700/70 text-[11px]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Overview – single column, no sidebar card */}
        <motion.section variants={item} className="space-y-4 text-sm pt-2">
          <h2 className="text-sm font-semibold text-slate-100">Overview</h2>

          {html ? (
            <div
              className="
                prose prose-invert max-w-none
                prose-headings:text-slate-100
                prose-p:text-slate-300
                prose-li:text-slate-300
                prose-strong:text-white
                prose-code:text-cyan-300
              "
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : fallbackParagraphs && fallbackParagraphs.length > 0 ? (
            fallbackParagraphs.map((p, idx) => <p key={idx}>{p}</p>)
          ) : (
            <p className="text-slate-400">
              No description has been added yet for this project.
            </p>
          )}

          {/* GitHub / Live links under content */}
          <div className="pt-4 flex flex-wrap gap-2 text-xs">
            {project.githubUrl && (
              <Link
                href={project.githubUrl}
                target="_blank"
                className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-900 text-xs font-medium hover:bg-slate-200"
              >
                GitHub Repo
              </Link>
            )}
            {project.liveUrl && (
              <Link
                href={project.liveUrl}
                target="_blank"
                className="px-3 py-1.5 rounded-full bg-cyan-400 text-slate-950 text-xs font-medium hover:bg-cyan-300"
              >
                Live App
              </Link>
            )}
          </div>
        </motion.section>

        {/* Back + prev/next */}
        <motion.section
          variants={item}
          className="pt-6 flex flex-col gap-3 text-xs border-t border-slate-800 mt-4"
        >
          <div className="flex justify-between items-center flex-wrap gap-2">
            <Link
              href="/projects"
              className="text-slate-300 hover:text-cyan-300 underline underline-offset-2"
            >
              ← Back to all projects
            </Link>

            <div className="flex gap-3">
              {prevProject && (
                <Link
                  href={`/projects/${prevProject.slug}`}
                  className="text-slate-300 hover:text-cyan-300 underline underline-offset-2"
                >
                  ← {prevProject.title}
                </Link>
              )}
              {nextProject && (
                <Link
                  href={`/projects/${nextProject.slug}`}
                  className="text-slate-300 hover:text-cyan-300 underline underline-offset-2"
                >
                  {nextProject.title} →
                </Link>
              )}
            </div>
          </div>
        </motion.section>
      </motion.div>
    </>
  );
}
