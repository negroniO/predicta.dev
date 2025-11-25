// app/homepage-server.tsx
import PageTransition from "./components/PageTransition";
import Link from "next/link";
import { prisma } from "@/app/lib/prisma";

export const revalidate = 60; // optional: ISR, revalidate homepage every 60s

export default async function HomePageServer() {
  const featuredProjects = await prisma.project.findMany({
    where: { featured: true },
    orderBy: [{ sortOrder: "asc" }, { year: "desc" }],
    take: 4, // change if you want more/less
  });

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-12">
        {/* Hero */}
        <section className="grid gap-8 md:grid-cols-[1.5fr_minmax(0,1fr)] items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-cyan-300/80">
              Data • Finance • Analytics
            </p>
            <h1 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight">
              Hi, I&apos;m George{" "}
              <span className="inline-block animate-pulse">👋</span>
            </h1>
            <p className="mt-3 text-sm md:text-base text-slate-300 leading-relaxed">
              I work at the intersection of <strong>FP&amp;A</strong>,{" "}
              <strong>credit control</strong>, and{" "}
              <strong>data science</strong>, building tools that improve
              collections, forecasting, and decision-making.
            </p>
            <p className="mt-2 text-sm text-slate-400">
              MSc in Data Analytics in Accounting &amp; Finance · FP&amp;A Analyst ·
              Python, SQL, BI, Machine Learning.
            </p>
            <div className="mt-5 flex flex-wrap gap-3 text-sm">
              <Link
                href="/projects"
                className="px-4 py-2 rounded-full bg-cyan-500/90 hover:bg-cyan-400 text-slate-950 font-medium shadow-lg shadow-cyan-500/25 transition transform hover:-translate-y-0.5 hover:shadow-cyan-400/40"
              >
                View Projects
              </Link>
              <Link
                href="/contact"
                className="px-4 py-2 rounded-full border border-slate-700/80 hover:border-cyan-400/80 text-slate-200 bg-slate-900/60 backdrop-blur-md transition transform hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/60"
              >
                Get in touch
              </Link>
            </div>
          </div>

          {/* Hero visual: animated line chart + stats */}
          <div className="rounded-2xl border border-slate-600/60 bg-slate-900/60 backdrop-blur-xl p-4 shadow-2xl shadow-black/60 relative overflow-hidden transition transform hover:-translate-y-1 hover:shadow-cyan-500/30">
            {/* Soft gradient glow background */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.22),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(94,234,212,0.16),_transparent_55%)]" />
            <div className="relative">
              <h2 className="text-sm font-medium text-slate-200 mb-1.5">
                Collections &amp; DSO snapshot
              </h2>
              <p className="text-xs text-slate-400 mb-3">
                Example of the type of forecasting and payment analytics I work on.
              </p>

              {/* Mini animated line chart (SVG) */}
              <div className="rounded-xl border border-slate-700/60 bg-slate-950/60 px-3 py-3 mb-3">
                <svg viewBox="0 0 240 80" className="w-full h-24">
                  <defs>
                    <linearGradient id="lineGradient" x1="0" x2="1" y1="0" y2="0">
                      <stop offset="0%" stopColor="#22d3ee" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                  </defs>

                  {/* Soft glow under the line */}
                  <path
                    d="M5,60 L40,50 L80,55 L120,35 L160,45 L200,30 L235,40"
                    fill="none"
                    stroke="rgba(56,189,248,0.25)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    opacity="0.35"
                  />

                  {/* Animated line */}
                  <path
                    d="M5,60 L40,50 L80,55 L120,35 L160,45 L200,30 L235,40"
                    fill="none"
                    stroke="url(#lineGradient)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray="260"
                  >
                    <animate
                      attributeName="stroke-dashoffset"
                      from="260"
                      to="0"
                      dur="1.6s"
                      repeatCount="indefinite"
                    />
                  </path>
                </svg>
              </div>

              {/* Stats under the chart */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border border-slate-700/70 bg-slate-900/70 px-3 py-2">
                  <p className="text-slate-400">Avg DSO (last 12m)</p>
                  <p className="text-base font-semibold text-slate-50 mt-1">
                    42 days
                  </p>
                </div>
                <div className="rounded-xl border border-slate-700/70 bg-slate-900/70 px-3 py-2">
                  <p className="text-slate-400">Recovery rate</p>
                  <p className="text-base font-semibold text-emerald-300 mt-1">
                    87.7%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Projects */}
        <section id="projects" className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">
            Featured projects
          </h2>
          <p className="text-sm text-slate-300">
            A selection of work focused on payment recovery, collections, and
            finance analytics.
          </p>

          <div className="space-y-4">
            {featuredProjects.length === 0 && (
              <p className="text-xs text-slate-500">
                No featured projects yet. Mark a project as featured in the admin
                panel to show it here.
              </p>
            )}

            {featuredProjects.map((project) => (
              <article
                key={project.id}
                className="rounded-2xl border border-slate-700/70 bg-slate-900/60 backdrop-blur-xl p-4 shadow-lg transition transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-500/25"
              >
                <h3 className="text-sm font-semibold">
                  {project.title}
                </h3>

                {project.subtitle && (
                  <p className="mt-1 text-sm text-slate-300">
                    {project.subtitle}
                  </p>
                )}

                {project.description && (
                  <p className="mt-2 text-xs text-slate-400">
                    {project.description.length > 260
                      ? project.description.slice(0, 260) + "…"
                      : project.description}
                  </p>
                )}

                {project.tags && project.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {project.tags.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-full border border-slate-700/70 bg-slate-900/70 text-[11px] text-slate-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-3 flex flex-wrap gap-3 text-xs">
                  <Link
                    href={`/projects/${project.slug}`}
                    className="text-cyan-300 hover:text-cyan-200 underline underline-offset-2"
                  >
                    Read case study
                  </Link>

                  {project.githubUrl && (
                    <Link
                      href={project.githubUrl}
                      target="_blank"
                      className="text-cyan-300 hover:text-cyan-200 underline underline-offset-2"
                    >
                      GitHub Repo
                    </Link>
                  )}

                  {project.liveUrl && (
                    <Link
                      href={project.liveUrl}
                      target="_blank"
                      className="text-cyan-300 hover:text-cyan-200 underline underline-offset-2"
                    >
                      Live App
                    </Link>
                  )}
                  
                  {project.coverImageUrl && (
                    <img
                      src={project.coverImageUrl}
                      alt={project.title}
                      className="w-full h-40 object-cover rounded-lg mb-3 border border-slate-700/60"
                    />
                  )}

                </div>
              </article>
            ))}
          </div>

          <div className="pt-1">
            <Link
              href="/projects"
              className="text-xs text-cyan-300 hover:text-cyan-200 underline underline-offset-2"
            >
              View all projects →
            </Link>
          </div>
        </section>

        {/* About teaser */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">A bit about me</h2>
          <p className="text-sm text-slate-300 max-w-3xl">
            I started on the operations side of finance — allocating payments,
            reconciling accounts, resolving disputes, and reducing DSO. Over time I
            moved into FP&amp;A and analytics, combining{" "}
            <strong>finance domain knowledge</strong> with{" "}
            <strong>Python, SQL, forecasting, and BI</strong> to build tools that
            teams actually use.
          </p>
          <p className="text-sm text-slate-400">
            You can read more about my background and how I like to work on the{" "}
            <Link
              href="/about"
              className="text-cyan-300 hover:text-cyan-200 underline underline-offset-2"
            >
              About
            </Link>{" "}
            page.
          </p>
        </section>
      </div>
    </PageTransition>
  );
}
