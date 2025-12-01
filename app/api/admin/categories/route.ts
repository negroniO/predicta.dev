import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { normalizeSlug, isValidSlug, parseIntOr } from "@/app/lib/validation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.redirect("/api/auth/signin?callbackUrl=/admin", { status: 302 });
  }

  const body = await req.formData();
  const name = (body.get("name") as string)?.trim();
  const slugRaw = (body.get("slug") as string)?.trim() || "";
  const slug = normalizeSlug(slugRaw);
  const sortOrderRaw = (body.get("sortOrder") as string) || "0";
  const sortOrder = parseIntOr(sortOrderRaw, 0);

  if (!name || !slug || !isValidSlug(slug)) {
    const url = new URL("/admin?error=missing_category_fields", req.url);
    return NextResponse.redirect(url, { status: 302 });
  }

  try {
    await prisma.category.create({
      data: { name, slug, sortOrder },
    });

    const url = new URL("/admin?category_created=1", req.url);
    return NextResponse.redirect(url, { status: 302 });
  } catch (error) {
    console.error("[POST /api/admin/categories] error", error);
    const url = new URL("/admin?error=category_create_failed", req.url);
    return NextResponse.redirect(url, { status: 302 });
  }
}
