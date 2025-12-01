import { prisma } from "@/app/lib/prisma";

export const runtime = "nodejs";

const SITE = "https://predicta.dev";

export async function GET() {
  const projects = await prisma.project.findMany({
    orderBy: [{ sortOrder: "asc" }, { year: "desc" }],
    select: {
      slug: true,
      title: true,
      subtitle: true,
      description: true,
      updatedAt: true,
      createdAt: true,
    },
  });

  const items = projects
    .map((p) => {
      const url = `${SITE}/projects/${p.slug}`;
      const desc = p.subtitle || p.description || "";
      return `
  <item>
    <title><![CDATA[${p.title}]]></title>
    <link>${url}</link>
    <guid>${url}</guid>
    <pubDate>${new Date(p.createdAt).toUTCString()}</pubDate>
    <description><![CDATA[${desc}]]></description>
  </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>predicta.dev projects</title>
    <link>${SITE}</link>
    <description>Projects by George Iordanous (predicta.dev)</description>
    <language>en-gb</language>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
