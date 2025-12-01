"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { marked } from "marked";
import { useEffect, useState } from "react";
import ShareButtons from "./ShareButtons";
import TrackedLink from "@/app/components/TrackedLink";
import ReactionButtons from "./ReactionButtons";
import RelatedProjects from "./RelatedProjects";

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
  category?: string | null; // 👈 added, matches Prisma model
  readingTime?: number;
  createdAt: string | Date;
  updatedAt: string | Date;
  coverImageUrl?: string | null;
  views?: number;
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
  related = [],
}: {
  project: Project;
  prevProject?: NavProject | null;
  nextProject?: NavProject | null;
  views?: number;
  related?: NavProject[];
}) {
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function renderMarkdown() {
      if (project.content && project.content.trim().length > 0) {
        const parsed = await marked(project.content); // resolves to string
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
    keywords: [...(project.tags ?? []), ...(project.techStack ?? [])].join(", "),
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
          className="text-[11px] text-foreground/60 mb-1 flex flex-wrap items-center gap-1"
        >
          <Link href="/" className="hover:text-accent">
            Home
          </Link>
          <span>/</span>
          <Link href="/projects" className="hover:text-accent">
            Projects
          </Link>
          <span>/</span>
          <span className="text-foreground">{project.title}</span>
        </motion.nav>

        {/* Hero with overlay card (Option C) */}
        <motion.section
          variants={item}
          className="relative overflow-hidden rounded-2xl border border-card-border/70 bg-card/80"
        >
          {/* Background image */}
          {project.coverImageUrl && (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${project.coverImageUrl})` }}
            />
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-card via-card/80 to-card/30" />

          {/* Floating card content */}
          <div className="relative px-5 py-6 md:px-8 md:py-8 flex flex-col md:flex-row md:items-end gap-4">
            <div className="flex-1 space-y-3">
              <p className="text-[11px] uppercase tracking-[0.25em] text-accent/80">
                Case Study
              </p>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
                {project.title}
              </h1>
              {project.subtitle && (
                <p className="text-sm text-foreground/85 max-w-2xl">
                  {project.subtitle}
                </p>
              )}

              {/* Meta row: published / edited / reading */}
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-foreground/80">
                <span>
                  <span className="uppercase tracking-[0.16em] text-foreground/60">
                    Published:
                  </span>{" "}
                  {publishedLabel}
                </span>
                <span>
                  <span className="uppercase tracking-[0.16em] text-foreground/60">
                    Last edited:
                  </span>{" "}
                  {updatedLabel}
                </span>
                <span>
                  <span className="uppercase tracking-[0.16em] text-foreground/60">
                    Reading time:
                  </span>{" "}
                  {readingLabel}
                </span>
              </div>
            </div>

            {/* Right side: reads + chips */}
            <div className="flex flex-col items-end gap-2 text-[11px]">
              {/* Reads pill */}
              <div className="flex items-center gap-1 rounded-full border border-card-border bg-card/80 px-2.5 py-1 text-[11px] text-foreground shadow-md shadow-black/40">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-3.5 w-3.5 text-accent"
                >
                  <path
                    fill="currentColor"
                    d="M12 5C7 5 2.73 8.11 1 12c1.73 3.89 6 7 11 7s9.27-3.11 11-7c-1.73-3.89-6-7-11-7Zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z"
                  />
                </svg>
                <span className="font-medium">{views}</span>
                <span className="text-foreground/70">reads</span>
              </div>

              {/* Category + status chips (optional) */}
              <div className="flex flex-wrap justify-end gap-2">
                {project.category && (
                  <span className="rounded-full border border-card-border/70 bg-card/80 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-foreground/90">
                    {project.category}
                  </span>
                )}
                {project.status && (
                  <span className="rounded-full border border-card-border/70 bg-card/80 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-foreground/80">
                    {project.status}
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.section>

        {/* Tech stack row */}
        {project.techStack && project.techStack.length > 0 && (
          <motion.div
            variants={item}
            className="flex flex-wrap items-center gap-2 text-[11px] text-foreground/80"
          >
            <span className="uppercase tracking-[0.16em] text-foreground/60">
              Tech stack
            </span>
            <div className="flex flex-wrap gap-1.5">
              {project.techStack.map((tech) => (
                <span
                  key={tech}
                  className="px-2 py-1 rounded-full bg-card/70 border border-card-border/70 text-[11px] text-foreground/85"
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
            className="flex flex-wrap items-center gap-2 text-[11px] text-foreground/80"
          >
            <span className="uppercase tracking-[0.16em] text-foreground/60">
              Tags
            </span>
            <div className="flex flex-wrap gap-1.5">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 rounded-full bg-card/70 border border-card-border/70 text-[11px] text-foreground/85"
                >
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Overview – single column */}
        <motion.section variants={item} className="space-y-4 text-sm pt-2">
          <h2 className="text-sm font-semibold text-foreground">Overview</h2>

          {html ? (
            <div
              className="
                prose prose-invert max-w-none
                prose-headings:text-foreground
                prose-p:text-foreground/80
                prose-li:text-foreground/80
                prose-strong:text-foreground
                prose-code:text-accent
              "
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : fallbackParagraphs && fallbackParagraphs.length > 0 ? (
            fallbackParagraphs.map((p, idx) => <p key={idx}>{p}</p>)
          ) : (
            <p className="text-foreground/60">
              No description has been added yet for this project.
            </p>
          )}

          {/* GitHub / Live links under content */}
          <div className="pt-4 flex flex-wrap gap-2 text-xs">
            {project.githubUrl && (
              <TrackedLink
                href={`${project.githubUrl}?utm_source=predicta&utm_medium=project&utm_campaign=${project.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline btn-sm"
              >
                GitHub Repo
              </TrackedLink>
            )}
            {project.liveUrl && (
              <TrackedLink
                href={`${project.liveUrl}?utm_source=predicta&utm_medium=project&utm_campaign=${project.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline btn-sm"
              >
                Live App
              </TrackedLink>
            )}
          </div>
        </motion.section>

        {/* Share */}
        <motion.section variants={item} className="pt-2">
          <ShareButtons slug={project.slug} title={project.title} />
          <div className="pt-2">
            <ReactionButtons slug={project.slug} />
          </div>
        </motion.section>

        {/* Back + prev/next */}
        <motion.section
          variants={item}
          className="pt-6 flex flex-col gap-3 text-xs border-t border-card-border/60 mt-4"
        >
          <div className="flex justify-between items-center flex-wrap gap-2">
            <Link
              href="/projects"
              className="text-foreground/80 hover:text-accent underline underline-offset-2"
            >
              ← Back to all projects
            </Link>

            <div className="flex gap-3">
              {prevProject && (
                <Link
                  href={`/projects/${prevProject.slug}`}
                  className="text-foreground/80 hover:text-accent underline underline-offset-2"
                >
                  ← {prevProject.title}
                </Link>
              )}
              {nextProject && (
                <Link
                  href={`/projects/${nextProject.slug}`}
                  className="text-foreground/80 hover:text-accent underline underline-offset-2"
                >
                  {nextProject.title} →
                </Link>
              )}
            </div>
          </div>
          {related && related.length > 0 && (
            <div className="pt-3">
              <RelatedProjects currentSlug={project.slug} related={related} />
            </div>
          )}
        </motion.section>
      </motion.div>
    </>
  );
}
