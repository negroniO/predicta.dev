import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { apiError, positiveInt } from "@/app/lib/api";
import { publicProjectWhere } from "@/app/lib/public-projects";

export const runtime = "nodejs";
export async function GET(req: NextRequest) {
  try {
    const limit = positiveInt(req.nextUrl.searchParams.get("limit"), 50, 100);
    const cursor = positiveInt(req.nextUrl.searchParams.get("cursor"), 0, 2_000_000_000);
    const projects = await prisma.project.findMany({
      where: publicProjectWhere,
      orderBy: [{ sortOrder: "asc" }, { year: "desc" }, { id: "asc" }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: { id: true, slug: true, title: true, subtitle: true, description: true, year: true,
        status: true, featured: true, tags: true, techStack: true, githubUrl: true, liveUrl: true,
        coverImageUrl: true, categoryId: true, sortOrder: true, createdAt: true, updatedAt: true },
    });
    const hasNext = projects.length > limit;
    const page = projects.slice(0, limit);
    return NextResponse.json(page, { headers: {
      "Cache-Control": "no-store", ...(hasNext ? { "X-Next-Cursor": String(page[page.length - 1].id) } : {}),
    } });
  } catch (error) { return apiError(error, "project_list"); }
}
