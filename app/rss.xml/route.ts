// app/rss.xml/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export const runtime = "nodejs";

const siteUrl = "https://predicta.dev";

export async function GET() {
  const projects = await prisma.project.findMany({
    orderBy: [{ createdAt: "desc" }],
  });

  const items = projects
    .map((p) => {
      const url = `${siteUrl}/projects/${p.slug}`;
      const pubDate = p.createdAt.toUTCString();
      const updatedDate = p.updatedAt.toUTCString();
      const description = p.subtitle || p.description;

      return `
  <item>
    <title><![CDATA[${p.title}]]></title>
    <link>${url}</link>
    <guid isPermaLink="true">${url}</guid>
    <description><![CDATA[${description}]]></description>
    <pubDate>${pubDate}</pubDate>
    <lastBuildDate>${updatedDate}</lastBuildDate>
  </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>predicta.dev – Projects</title>
  <link>${siteUrl}</link>
  <description>FP&A, collections, DSO forecasting and analytics engineering projects by George Iordanous.</description>
  <language>en-gb</language>
  ${items}
</channel>
</rss>`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
