import { apiError, positiveInt, textField } from "@/app/lib/api";
import { publicProjectWhere } from "@/app/lib/public-projects";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
  const query = textField(req.nextUrl.searchParams.get("q"), "q", 200);
  const limit = positiveInt(req.nextUrl.searchParams.get("limit"), 20, 50);

  if (query.length < 2) {
    return NextResponse.json([], { status: 200 });
  }

  // Simple search using ILIKE
  const projects = await prisma.project.findMany({
    where: {
      ...publicProjectWhere,
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { subtitle: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { content: { contains: query, mode: "insensitive" } },
        { tags: { has: query.toLowerCase() } },
      ],
    },
    select: {
      slug: true,
      title: true,
      subtitle: true,
      tags: true,
    },
    orderBy: [{ year: "desc" }, { id: "asc" }],
    take: limit,
  });

  return NextResponse.json(projects, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error, "project_search"); }
}
