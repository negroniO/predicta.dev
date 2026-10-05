import { apiError, textField } from "@/app/lib/api";
import { authorizeAdminRequest } from "@/app/lib/admin";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const denied = await authorizeAdminRequest(req);
  if (denied) return denied;
  try {
  const { searchParams } = new URL(req.url);
  const slug = textField(searchParams.get("slug"), "slug", 160);
  const type = searchParams.get("type");
  const current = textField(searchParams.get("current"), "current", 160) || null;

  if (!slug || !type) {
    return NextResponse.json({ available: false }, { status: 400 });
  }

    if (type === "project") {
      const exists = await prisma.project.findFirst({
        where: {
          slug,
          ...(current ? { NOT: { slug: current } } : {}),
        },
        select: { id: true },
      });
      return NextResponse.json({ available: !exists });
    }

    if (type === "category") {
      const exists = await prisma.category.findFirst({
        where: {
          slug,
          ...(current ? { NOT: { slug: current } } : {}),
        },
        select: { id: true },
      });
      return NextResponse.json({ available: !exists });
    }

    if (type === "page") {
      const exists = await prisma.page.findFirst({
        where: {
          slug,
          ...(current ? { NOT: { slug: current } } : {}),
        },
        select: { id: true },
      });
      return NextResponse.json({ available: !exists });
    }

    return NextResponse.json({ available: false }, { status: 400 });
  } catch (error) {
    return apiError(error, "slug_validation");
  }
}
