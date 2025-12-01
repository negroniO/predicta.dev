import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug")?.trim();
  const type = searchParams.get("type");
  const current = searchParams.get("current")?.trim() || null;

  if (!slug || !type) {
    return NextResponse.json({ available: false }, { status: 400 });
  }

  try {
    if (type === "project") {
      const exists = await prisma.project.findFirst({
        where: {
          slug,
          ...(current ? { slug: { not: current } } : {}),
        },
        select: { id: true },
      });
      return NextResponse.json({ available: !exists });
    }

    if (type === "category") {
      const exists = await prisma.category.findFirst({
        where: {
          slug,
          ...(current ? { slug: { not: current } } : {}),
        },
        select: { id: true },
      });
      return NextResponse.json({ available: !exists });
    }

    if (type === "page") {
      const exists = await prisma.page.findFirst({
        where: {
          slug,
          ...(current ? { slug: { not: current } } : {}),
        },
        select: { id: true },
      });
      return NextResponse.json({ available: !exists });
    }

    return NextResponse.json({ available: false }, { status: 400 });
  } catch (error) {
    console.error("[VALIDATE slug] error", error);
    return NextResponse.json({ available: false }, { status: 500 });
  }
}
