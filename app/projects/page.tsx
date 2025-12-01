// app/projects/page.tsx
import { prisma } from "@/app/lib/prisma";
import PageTransition from "../components/PageTransition";
import ProjectsPageClient from "./ProjectsPageClient";

export const metadata = {
  title: "Projects | predicta.dev",
  description:
    "Projects by George Iordanous – payment recovery ML, collections analytics, DSO forecasting, and SQL/BI work in finance and payments.",
  alternates: {
    canonical: "/projects",
  },
};

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
      orderBy: [{ sortOrder: "asc" }, { year: "desc" }],
      include: {
        category: true,
        _count: { select: { views: true, reactions: true } },
      },
    });

  return (
    <PageTransition>
      <ProjectsPageClient
        projects={projects.map((p) => ({
          id: p.id,
          slug: p.slug,
          title: p.title,
          subtitle: p.subtitle,
          description: p.description,
          year: p.year,
          tags: p.tags,
          githubUrl: p.githubUrl,
          liveUrl: p.liveUrl,
          views: p._count.views,
          reactions: p._count.reactions,
          category: p.category?.name ?? null,
          coverImageUrl: p.coverImageUrl ?? null,   // 👈 add this
        }))}
      />
    </PageTransition>
  );
}
