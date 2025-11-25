// app/feed.xml/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const base = "https://predicta.dev";

  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      slug: true,
      title: true,
      subtitle: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      content: true,
    },
  });

  const itemsXml = projects
    .map((p) => {
      const url = `${base}/projects/${p.slug}`;
      const published = p.createdAt.toUTCString();
      const updated = p.updatedAt.toUTCString();

      const rawDesc = p.subtitle || p.description || "";
      const descEscaped = rawDesc
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

      return `
  <item>
    <title>${p.title}</title>
    <link>${url}</link>
    <guid>${url}</guid>
    <description>${descEscaped}</description>
    <pubDate>${published}</pubDate>
    <lastBuildDate>${updated}</lastBuildDate>
  </item>`;
    })
    .join("");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>predicta.dev – Projects</title>
  <link>${base}</link>
  <description>Projects by George Iordanous – FP&amp;A, collections analytics, DSO forecasting, and ML in finance.</description>
  <language>en-gb</language>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
  ${itemsXml}
</channel>
</rss>`;

  return new NextResponse(rss, {
    status: 200,
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "s-maxage=600, stale-while-revalidate",
    },
  });
}
