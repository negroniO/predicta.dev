// app/rss/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export const runtime = "nodejs";

const SITE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ?? "https://predicta.dev";

function escapeXml(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  // Only include non-draft projects
  const projects = await prisma.project.findMany({
    where: {
      status: {
        in: ["Completed", "In Progress"],
      },
    },
    orderBy: { createdAt: "desc" },
    take: 30, // last 30 case studies
  });

  const itemsXml = projects
    .map((p) => {
      const link = `${SITE_URL}/projects/${p.slug}`;
      const title = escapeXml(p.title);
      const description = escapeXml(p.subtitle ?? p.description);
      const pubDate = p.createdAt.toUTCString();
      const updated = p.updatedAt.toUTCString();

      return `
  <item>
    <title>${title}</title>
    <link>${link}</link>
    <guid isPermaLink="true">${link}</guid>
    <description>${description}</description>
    <pubDate>${pubDate}</pubDate>
    <lastBuildDate>${updated}</lastBuildDate>
  </item>`;
    })
    .join("");

  const now = new Date().toUTCString();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>predicta.dev – Projects by George Iordanous</title>
  <link>${SITE_URL}</link>
  <description>Case studies in payment recovery, collections, forecasting, and analytics engineering.</description>
  <language>en-gb</language>
  <lastBuildDate>${now}</lastBuildDate>
  ${itemsXml}
</channel>
</rss>`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
