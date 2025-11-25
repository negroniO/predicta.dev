// app/sitemap.ts
import type { MetadataRoute } from "next";
import { prisma } from "@/app/lib/prisma";

const siteUrl = "https://predicta.dev";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: now,
    },
    {
      url: `${siteUrl}/projects`,
      lastModified: now,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: now,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: now,
    },
    {
      url: `${siteUrl}/rss.xml`,
      lastModified: now,
    },
  ];

  const projects = await prisma.project.findMany({
    select: { slug: true, updatedAt: true },
  });

  const projectRoutes: MetadataRoute.Sitemap = projects.map((p) => ({
    url: `${siteUrl}/projects/${p.slug}`,
    lastModified: p.updatedAt,
  }));

  return [...staticRoutes, ...projectRoutes];
}
