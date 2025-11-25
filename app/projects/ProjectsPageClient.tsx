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
};

export default function ProjectsPageClient({ projects }: { projects: Project[] }) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

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
        <p className="text-xs uppercase tracking-[0.25em] text-cyan-300/80">
          Portfolio
        </p>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
          Projects
        </h1>
        <p className="text-sm text-slate-300 max-w-2xl">
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
            className="w-full rounded-full bg-slate-900/70 border border-slate-700 px-4 py-2 text-xs text-slate-100 placeholder:text-slate-500 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/60"
          />

          {focused && suggestions.length > 0 && (
            <div className="absolute z-20 mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/95 shadow-xl shadow-black/40 max-h-64 overflow-auto">
              {suggestions.map((p) => (
                <Link
                  key={p.id}
                  href={`/projects/${p.slug}`}
                  onMouseDown={(e) => e.preventDefault()}
                  className="flex items-center justify-between px-3 py-2 text-xs hover:bg-slate-800/80 transition"
                >
                  <div className="flex flex-col">
                    <span className="text-slate-100">{p.title}</span>
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
          <div className="flex flex-wrap gap-2 text-[11px]">
            <button
              type="button"
              onClick={() => setActiveCategory(null)}
              className={
                "px-2.5 py-1 rounded-full border text-xs " +
                (activeCategory === null
                  ? "border-cyan-400 bg-cyan-500/10 text-cyan-200"
                  : "border-slate-700 bg-slate-900/70 text-slate-300 hover:border-cyan-400")
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
                    ? "border-cyan-400 bg-cyan-500/10 text-cyan-200"
                    : "border-slate-700 bg-slate-900/70 text-slate-300 hover:border-cyan-400")
                }
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        <p className="text-[11px] text-slate-500">
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

      {/* Project Cards */}
      <section className="space-y-5">
        {filteredProjects.map((p) => (
          <article
            key={p.id}
            className="rounded-2xl border border-slate-600/60 bg-slate-900/60 backdrop-blur-xl p-5 shadow-lg shadow-black/40 transition transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-500/30"
          >
            <div className="flex justify-between items-center flex-wrap gap-2">
              <h2 className="text-sm md:text-base font-semibold text-slate-50">
                {p.title}
              </h2>

              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                {p.category && (
                  <span className="rounded-full border border-slate-700/70 bg-slate-900/70 px-2 py-1 text-[10px] uppercase tracking-[0.12em]">
                    {p.category}
                  </span>
                )}
                <span>{p.year}</span>
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-700/70 bg-slate-900/70 px-2 py-1">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-3 w-3 text-cyan-300"
                  >
                    <path
                      fill="currentColor"
                      d="M12 5C7 5 2.73 8.11 1 12c1.73 3.89 6 7 11 7s9.27-3.11 11-7c-1.73-3.89-6-7-11-7zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8z"
                    />
                    <circle cx="12" cy="12" r="2" fill="currentColor" />
                  </svg>
                  <span className="text-slate-200">{p.views ?? 0}</span>
                  <span className="hidden sm:inline">reads</span>
                </span>
              </div>
            </div>

            <p className="mt-2 text-sm text-slate-300">
              {p.subtitle || p.description}
            </p>

            {p.tags && p.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                {p.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 rounded-full border border-slate-700/70 bg-slate-900/60 text-slate-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-3 text-xs">
              <Link
                href={`/projects/${p.slug}`}
                className="px-3 py-1.5 rounded-full bg-cyan-500/90 hover:bg-cyan-400 text-slate-950 font-medium shadow-md shadow-cyan-500/30 transition"
              >
                View case study
              </Link>

              {p.githubUrl && (
                <Link
                  href={p.githubUrl}
                  target="_blank"
                  className="text-cyan-300 hover:text-cyan-200 underline underline-offset-2 transition"
                >
                  GitHub Repo
                </Link>
              )}
              {p.liveUrl && (
                <Link
                  href={p.liveUrl}
                  target="_blank"
                  className="text-cyan-300 hover:text-cyan-200 underline underline-offset-2 transition"
                >
                  Live App
                </Link>
              )}
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
    </div>
  );
}
