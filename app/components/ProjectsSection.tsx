// app/components/ProjectsSection.tsx
import { prisma } from "../lib/prisma";
import Link from "next/link";

export default async function ProjectsSection() {
  const projects = await prisma.project.findMany({
    where: { featured: true },
    orderBy: [{ sortOrder: "asc" }, { year: "desc" }],
  });

  return (
    <>
      {projects.map((project) => (
        <article
          key={project.id}
          className="rounded-2xl border border-slate-700/70 bg-slate-900/60 backdrop-blur-xl p-6 shadow-lg transition transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-500/25"
        >
          <h3 className="text-sm font-semibold">{project.title}</h3>

          {project.subtitle && (
            <p className="mt-1 text-sm text-slate-300">{project.subtitle}</p>
          )}

          {/* Description block behaves like your original case study blocks */}
          <p className="mt-1 text-sm text-slate-300 whitespace-pre-line">
            {project.description}
          </p>

          {/* Tags */}
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {project.tags?.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 rounded-full border border-slate-700/70 bg-slate-900/70 text-slate-300"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Links */}
          <div className="mt-3 flex flex-wrap gap-4 text-xs">
            {project.liveUrl && (
              <Link
                href={project.liveUrl}
                target="_blank"
                className="text-cyan-300 hover:text-cyan-200 underline underline-offset-2"
              >
                Live App
              </Link>
            )}

            {project.githubUrl && (
              <Link
                href={project.githubUrl}
                target="_blank"
                className="text-cyan-300 hover:text-cyan-200 underline underline-offset-2"
              >
                GitHub Repo
              </Link>
            )}

            {/* Auto Linked Case Study */}
            <Link
              href={`/projects/${project.slug}`}
              className="text-cyan-300 hover:text-cyan-200 underline underline-offset-2"
            >
              Read case study
            </Link>
          </div>
        </article>
      ))}
    </>
  );
}
