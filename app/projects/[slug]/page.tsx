// app/projects/[slug]/page.tsx
import { prisma } from "@/app/lib/prisma";
import { notFound } from "next/navigation";
import ReadingProgress from "@/app/components/ReadingProgress";
import ProjectCaseStudyClient from "../ProjectCaseStudyClient";
import TrackProjectView from "./TrackProjectView";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const project = await prisma.project.findUnique({
    where: { slug },
    select: { title: true, subtitle: true },
  });

  if (!project) {
    return { title: "Project not found | predicta.dev" };
  }

  return {
    title: `${project.title} | predicta.dev`,
    description: project.subtitle ?? "Project case study on predicta.dev",
    alternates: {
      canonical: `/projects/${slug}`,
    },
  };
}

// helper for reading time
function estimateReadingTime(text: string | null | undefined): number {
  if (!text) return 0;
  const words = text.trim().split(/\s+/).length;
  if (!words) return 0;
  return Math.max(1, Math.round(words / 200)); // 200 wpm
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [project, ordered] = await Promise.all([
    prisma.project.findUnique({
      where: { slug },
      include: {
        _count: { select: { views: true } },
      },
    }),
    prisma.project.findMany({
      orderBy: [{ sortOrder: "asc" }, { year: "desc" }],
      select: { slug: true, title: true },
    }),
  ]);

  if (!project) {
    notFound();
  }

  const index = ordered.findIndex((p) => p.slug === slug);
  const prevProject = index > 0 ? ordered[index - 1] : null;
  const nextProject =
    index !== -1 && index < ordered.length - 1 ? ordered[index + 1] : null;

  const readingTime = estimateReadingTime(project.content || project.description);
  const views = project._count.views;

  return (
    <>
      {/* Invisible analytics */}
      <TrackProjectView slug={slug} />
      <ReadingProgress />
      <ProjectCaseStudyClient
        project={{
          ...project,
          readingTime,
        } as any}
        prevProject={prevProject}
        nextProject={nextProject}
        views={views}
      />
    </>
  );
}
