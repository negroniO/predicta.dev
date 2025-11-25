// app/api/projects/route.ts
export const runtime = "nodejs"; // ensure Prisma runs in Node, not Edge

import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma"; // from app/api/projects → app/lib/prisma

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: [{ sortOrder: "asc" }, { year: "desc" }],
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error("[GET /api/projects] ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
