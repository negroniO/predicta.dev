import { prisma } from "./prisma";
import { publicProjectWhere } from "./public-projects";
import { SITE_URL } from "./site";
import { renderFeed } from "./feed-format";

export async function feedResponse(format: "rss" | "atom"): Promise<Response> {
  const projects = await prisma.project.findMany({
    where: publicProjectWhere,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 30,
    select: { slug: true, title: true, subtitle: true, description: true, createdAt: true, updatedAt: true },
  });
  return new Response(renderFeed(projects, format, SITE_URL), {
    headers: { "Content-Type": `application/${format}+xml; charset=utf-8`, "Cache-Control": "no-store" },
  });
}
