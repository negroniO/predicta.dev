// app/sitemap.ts
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: "https://predicta.dev",
      lastModified: now,
    },
    {
      url: "https://predicta.dev/projects",
      lastModified: now,
    },
    {
      url: "https://predicta.dev/about",
      lastModified: now,
    },
    {
      url: "https://predicta.dev/contact",
      lastModified: now,
    },
  ];
}
