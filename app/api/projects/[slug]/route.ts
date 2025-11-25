// app/api/projects/[slug]/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

// Note: params is a Promise in Next.js 16 with Turbopack
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  console.log("[API] /api/projects/[slug] slug =", slug);

  try {
    const project = await prisma.project.findUnique({
      where: { slug },
    });

    if (!project) {
      console.warn("[API] Project not found for slug:", slug);
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error(`[GET /api/projects/${slug}] ERROR:`, error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
