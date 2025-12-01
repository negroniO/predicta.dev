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
    select: { title: true, subtitle: true, coverImageUrl: true },
  });

  if (!project) {
    return { title: "Project not found | predicta.dev" };
  }

  return {
    title: `${project.title} | predicta.dev`,
    description: project.subtitle ?? "Project case study on predicta.dev",
    openGraph: {
      title: `${project.title} | predicta.dev`,
      description: project.subtitle ?? "Project case study on predicta.dev",
      url: `https://predicta.dev/projects/${slug}`,
      images: project.coverImageUrl
        ? [{ url: project.coverImageUrl, width: 1200, height: 630, alt: project.title }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${project.title} | predicta.dev`,
      description: project.subtitle ?? "Project case study on predicta.dev",
      images: project.coverImageUrl ? [project.coverImageUrl] : undefined,
    },
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
      select: {
        id: true,
        slug: true,
        title: true,
        subtitle: true,
        description: true,
        content: true,
        status: true,
        year: true,
        sortOrder: true,
        tags: true,
        techStack: true,
        githubUrl: true,
        liveUrl: true,
        coverImageUrl: true,
        categoryId: true,
        createdAt: true,
        updatedAt: true,
        category: { select: { name: true } },
        _count: { select: { views: true, reactions: true } },
      },
    }),
    prisma.project.findMany({
      orderBy: [{ sortOrder: "asc" }, { year: "desc" }],
      select: { slug: true, title: true, tags: true, category: { select: { name: true } } },
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
  const projectForClient = {
    ...project,
    category: project.category?.name ?? null,
    reactions: project._count.reactions,
  };

  const related = ordered
    .filter((p) => p.slug !== slug)
    .filter((p) => {
      const tags = p.tags ?? [];
      const currentTags = project.tags ?? [];
      const overlap = tags.some((t) => currentTags.includes(t));
      const catMatch = project.category?.name && p.category?.name === project.category.name;
      return overlap || catMatch;
    })
    .slice(0, 3)
    .map((p) => ({ slug: p.slug, title: p.title }));

  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Home",
                  item: "https://predicta.dev/",
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: "Projects",
                  item: "https://predicta.dev/projects",
                },
                {
                  "@type": "ListItem",
                  position: 3,
                  name: project.title,
                  item: `https://predicta.dev/projects/${slug}`,
                },
              ],
            },
            {
              "@context": "https://schema.org",
              "@type": "CreativeWork",
              name: project.title,
              description: project.subtitle || project.description || undefined,
              url: `https://predicta.dev/projects/${slug}`,
              image: project.coverImageUrl || undefined,
            },
          ]),
        }}
      />
      {/* Invisible analytics */}
      <TrackProjectView slug={slug} />
      <ReadingProgress />
      <ProjectCaseStudyClient
        project={{
          ...projectForClient,
          readingTime,
        } as any}
        prevProject={prevProject}
        nextProject={nextProject}
        views={views}
        related={related}
      />
    </>
  );
}
