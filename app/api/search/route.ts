import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q")?.trim() || "";

  if (query.length < 2) {
    return NextResponse.json([], { status: 200 });
  }

  // Simple search using ILIKE
  const projects = await prisma.project.findMany({
    where: {
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
    orderBy: { year: "desc" },
  });

  return NextResponse.json(projects);
}
