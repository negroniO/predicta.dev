// app/projects/ProjectsPageClient.tsx
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Project = {
  id: number;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string;
  year: number;
  tags: string[] | null;
  githubUrl: string | null;
  liveUrl: string | null;
  views?: number;
  category?: string | null;
  coverImageUrl?: string | null;
  reactions?: number;
};

export default function ProjectsPageClient({ projects }: { projects: Project[] }) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const normalizedQuery = query.trim().toLowerCase();

  const categories = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set).sort();
  }, [projects]);

  const filteredProjects = useMemo(() => {
    let result = projects;

    if (activeCategory) {
      result = result.filter((p) => p.category === activeCategory);
    }

    if (!normalizedQuery) return result;

    return result.filter((p) => {
      const haystack =
        (p.title ?? "") +
        " " +
        (p.subtitle ?? "") +
        " " +
        (p.description ?? "") +
        " " +
        (p.tags ?? []).join(" ");
      return haystack.toLowerCase().includes(normalizedQuery);
    });
  }, [projects, normalizedQuery, activeCategory]);

  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / pageSize));
  const pagedProjects = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredProjects.slice(start, start + pageSize);
  }, [filteredProjects, page, pageSize]);

  const suggestions = useMemo(() => {
    if (!normalizedQuery) return [];
    return projects
      .filter(
        (p) =>
          p.title.toLowerCase().includes(normalizedQuery) ||
          (p.tags ?? []).some((t) => t.toLowerCase().includes(normalizedQuery))
      )
      .slice(0, 6);
  }, [projects, normalizedQuery]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
      {/* Header */}
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.25em] text-accent/80">
          Portfolio
        </p>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
          Projects
        </h1>
        <p className="text-sm text-foreground/80 max-w-2xl">
          A deeper look at the projects I&apos;ve built across{" "}
          <strong>payment recovery</strong>, <strong>collections</strong>,{" "}
          <strong>cash flow forecasting</strong>, and{" "}
          <strong>analytics engineering</strong>.
        </p>
      </header>

      {/* Search + category filters */}
      <section className="space-y-3">
        <div className="relative max-w-md">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 100)}
            placeholder="Search by title, tag, or topic..."
            className="w-full rounded-full bg-card/70 border border-card-border px-4 py-2 text-xs text-foreground placeholder:text-foreground/60 outline-none focus:border-accent focus:ring-1 focus:ring-accent/60"
          />

          {/* Search suggestions dropdown */}
          {focused && suggestions.length > 0 && (
            <div className="absolute z-20 mt-1 w-full rounded-xl border border-card-border bg-card/95 shadow-xl shadow-black/40 max-h-64 overflow-auto">
              {suggestions.map((p) => (
                <Link
                  key={p.id}
                  href={`/projects/${p.slug}`}
                  onMouseDown={(e) => e.preventDefault()}
                  className="flex items-center justify-between px-3 py-2 text-xs hover:bg-slate-800/80 transition"
                >
                  <div className="flex flex-col">
                    <span className="text-foreground">{p.title}</span>
                    {p.subtitle && (
                      <span className="text-[11px] text-slate-400 line-clamp-1">
                        {p.subtitle}
                      </span>
                    )}
                  </div>
                  {p.tags && p.tags.length > 0 && (
                    <span className="ml-3 text-[10px] text-slate-500 hidden md:inline">
                      {p.tags.slice(0, 3).join(" • ")}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Category pills */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5 text-[11px]">
            <button
              type="button"
              onClick={() => setActiveCategory(null)}
              className={
                "px-2.5 py-1 rounded-full border text-xs " +
                (activeCategory === null
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-card-border bg-card/70 text-foreground/80 hover:border-accent")
              }
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={
                  "px-2.5 py-1 rounded-full border text-xs " +
                  (activeCategory === cat
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-card-border bg-card/70 text-foreground/80 hover:border-accent")
                }
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        <p className="text-[11px] text-foreground/60">
          Showing{" "}
          <span className="text-slate-200">{filteredProjects.length}</span> of{" "}
          <span className="text-slate-200">{projects.length}</span> projects
          {activeCategory && (
            <>
              {" "}
              in <span className="text-cyan-300">{activeCategory}</span>
            </>
          )}
          {normalizedQuery && (
            <>
              {" "}
              for <span className="text-cyan-300">“{query}”</span>
            </>
          )}
          .
        </p>
      </section>

      {/* Project Cards – overlay hero style */}
      <section className="space-y-4">
        {pagedProjects.map((p) => (
          <article
            key={p.id}
            className="group rounded-lg border border-card-border/70 bg-card/90 backdrop-blur-xl shadow-lg shadow-black/40 transition transform hover:-translate-y-0.5 hover:shadow-accent/25 overflow-hidden"
          >
            {/* Image + overlay header */}
            <div className="relative h-32 md:h-36 w-full overflow-hidden rounded-t-2xl">
              {p.coverImageUrl ? (
                <img
                  src={p.coverImageUrl}
                  alt={p.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900" />
              )}

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />

              {/* Floating title */}
              <div className="absolute bottom-2 left-3 right-3 flex justify-between items-end">
                <div className="space-y-0.5">
                  <h2 className="text-sm font-semibold text-slate-50">
                    {p.title}
                  </h2>

                  <div className="flex items-center gap-2 text-[10px] text-foreground/70">
                    {p.category && (
                      <span className="rounded-full border border-card-border/70 bg-card/70 px-2 py-0.5 text-[10px] uppercase tracking-wide text-foreground/80">
                        {p.category}
                      </span>
                    )}
                    <span>{p.year}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full border border-card-border/70 bg-card/70 px-2 py-0.5 text-[11px] text-foreground/80">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-3 w-3 text-cyan-300"
                      aria-hidden="true"
                    >
                      <path
                        fill="currentColor"
                        d="M12 5C7 5 2.73 8.11 1 12c1.73 3.89 6 7 11 7s9.27-3.11 11-7c-1.73-3.89-6-7-11-7zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8z"
                      />
                    </svg>
                    <span>{p.views ?? 0}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-card-border/70 bg-card/70 px-2 py-0.5 text-[11px] text-foreground/80">
                    👍 {p.reactions ?? 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-4 space-y-2.5">
              <p className="text-sm text-foreground/85 line-clamp-2">
                {p.subtitle || p.description}
              </p>

              {p.tags && p.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 text-[11px]">
                  {p.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-full border border-card-border/70 bg-card/70 text-foreground/80 shadow-inner shadow-black/10"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-3 text-xs pt-1">
                <Link
                  href={`/projects/${p.slug}`}
                  className="btn btn-section btn-sm"
                >
                  View case study
                </Link>

                {p.githubUrl && (
                  <Link
                    href={p.githubUrl}
                    target="_blank"
                    className="btn btn-section btn-sm"
                  >
                    GitHub Repo
                  </Link>
                )}
                {p.liveUrl && (
                  <Link
                    href={p.liveUrl}
                    target="_blank"
                    className="btn btn-section btn-sm"
                  >
                    Live App
                  </Link>
                )}
              </div>
            </div>
          </article>
        ))}

        {filteredProjects.length === 0 && (
          <p className="text-sm text-slate-400">
            No projects match{" "}
            <span className="text-cyan-300">“{query}”</span>. Try a different
            keyword like <span className="text-slate-200">“ML”</span>,{" "}
            <span className="text-slate-200">“forecasting”</span>, or{" "}
            <span className="text-slate-200">“SQL”</span>.
          </p>
        )}
      </section>

      {/* Footer note */}
      <div className="pt-4 text-xs text-slate-400">
        <p>
          More projects (e.g. SQL notebooks, BI dashboards, and smaller
          experiments) are available on{" "}
          <Link
            href="https://github.com/negroniO"
            target="_blank"
            className="text-cyan-300 hover:text-cyan-200 underline underline-offset-2"
          >
            GitHub
          </Link>
          .
        </p>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-300 pt-4">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-full border border-slate-700 px-3 py-1 disabled:opacity-60 hover:border-cyan-400"
            >
              ← Prev
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-full border border-slate-700 px-3 py-1 disabled:opacity-60 hover:border-cyan-400"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
