import { prisma } from "@/app/lib/prisma";
import type { MetadataRoute } from "next";

const site = "https://predicta.dev";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, pages] = await Promise.all([
    prisma.project.findMany({
      select: { slug: true, updatedAt: true },
      orderBy: [{ sortOrder: "asc" }, { year: "desc" }],
    }),
    prisma.page.findMany({
      where: { status: "published" },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${site}/`, lastModified: new Date() },
    { url: `${site}/projects`, lastModified: new Date() },
    { url: `${site}/about`, lastModified: new Date() },
    { url: `${site}/contact`, lastModified: new Date() },
  ];

  const projectRoutes: MetadataRoute.Sitemap = projects.map((p) => ({
    url: `${site}/projects/${p.slug}`,
    lastModified: p.updatedAt,
  }));

  const pageRoutes: MetadataRoute.Sitemap = pages.map((p) => ({
    url: `${site}/${p.slug}`,
    lastModified: p.updatedAt,
  }));

  return [...staticRoutes, ...projectRoutes, ...pageRoutes];
}
