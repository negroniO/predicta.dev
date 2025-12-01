import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { normalizeSlug, isValidSlug } from "@/app/lib/validation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.redirect("/api/auth/signin?callbackUrl=/admin/pages", {
      status: 302,
    });
  }

  const body = await req.formData();
  const title = (body.get("title") as string)?.trim();
  const slugRaw = (body.get("slug") as string)?.trim();
  const slug = slugRaw ? normalizeSlug(slugRaw) : "";
  const content = (body.get("content") as string)?.trim() || "";
  const excerpt = (body.get("excerpt") as string)?.trim() || null;
  const status = (body.get("status") as string)?.trim() || "published";

  if (!title || !slug || !isValidSlug(slug)) {
    const url = new URL("/admin/pages?error=missing_fields", req.url);
    return NextResponse.redirect(url, { status: 302 });
  }

  if (status !== "published" && status !== "draft") {
    const url = new URL("/admin/pages?error=bad_status", req.url);
    return NextResponse.redirect(url, { status: 302 });
  }

  try {
    await prisma.page.create({
      data: { title, slug, content, excerpt, status },
    });

    const url = new URL("/admin/pages?created=1", req.url);
    return NextResponse.redirect(url, { status: 302 });
  } catch (error) {
    console.error("[POST /api/admin/pages] error", error);
    const url = new URL("/admin/pages?error=create_failed", req.url);
    return NextResponse.redirect(url, { status: 302 });
  }
}
