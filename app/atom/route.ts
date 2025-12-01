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

  const updated =
    projects[0]?.updatedAt ?? projects[0]?.createdAt ?? new Date().toISOString();

  const entries = projects
    .map((p) => {
      const url = `${SITE}/projects/${p.slug}`;
      const desc = p.subtitle || p.description || "";
      return `
  <entry>
    <title><![CDATA[${p.title}]]></title>
    <link href="${url}" />
    <id>${url}</id>
    <updated>${new Date(p.updatedAt || p.createdAt).toISOString()}</updated>
    <summary><![CDATA[${desc}]]></summary>
  </entry>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>predicta.dev projects</title>
  <link href="${SITE}"/>
  <updated>${new Date(updated).toISOString()}</updated>
  <id>${SITE}/atom</id>
  ${entries}
</feed>`;

  return new Response(xml, {
    status: 200,
    headers: { "Content-Type": "application/atom+xml; charset=utf-8" },
  });
}
