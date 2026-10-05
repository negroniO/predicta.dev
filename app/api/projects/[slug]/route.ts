import { apiError, ApiError } from "@/app/lib/api";
import { isValidSlug } from "@/app/lib/validation";
import { publicProjectWhere } from "@/app/lib/public-projects";
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


  try {
    if (slug.length > 160 || !isValidSlug(slug)) throw new ApiError("invalid_slug");
    const project = await prisma.project.findFirst({
      where: { slug, ...publicProjectWhere },
    });

    if (!project) {
      throw new ApiError("not_found", 404);
    }

    return NextResponse.json(project);
  } catch (error) {
    return apiError(error, "project_read");
  }
}
