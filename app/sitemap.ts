export const dynamic = "force-dynamic";
import { publicProjectWhere } from "@/app/lib/public-projects";
import { prisma } from "@/app/lib/prisma";
import type { MetadataRoute } from "next";

import { SITE_URL as site } from "@/app/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, pages] = await Promise.all([
    prisma.project.findMany({
      where: publicProjectWhere,
      select: { slug: true, updatedAt: true },
      orderBy: [{ sortOrder: "asc" }, { year: "desc" }],
    }),
    prisma.page.findMany({
      where: { status: "published", slug: { notIn: ["admin", "api", "projects"] } },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${site}/` },
    { url: `${site}/projects` },
    { url: `${site}/about` },
    { url: `${site}/contact` },
  ];

  const projectRoutes: MetadataRoute.Sitemap = projects.map((p) => ({
    url: `${site}/projects/${p.slug}`,
    lastModified: p.updatedAt,
  }));

  const pageRoutes: MetadataRoute.Sitemap = pages.map((p) => ({
    url: `${site}/${p.slug}`,
    lastModified: p.updatedAt,
  }));

  return [...new Map([...staticRoutes, ...projectRoutes, ...pageRoutes].map((entry) => [entry.url, entry])).values()];
}
