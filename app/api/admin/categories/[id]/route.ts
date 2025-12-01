import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.redirect("/api/auth/signin?callbackUrl=/admin", { status: 302 });
  }

  const { id } = await params;
  const categoryId = parseInt(id, 10);

  if (!categoryId || Number.isNaN(categoryId)) {
    const url = new URL("/admin?error=bad_category_id", req.url);
    return NextResponse.redirect(url, { status: 302 });
  }

  try {
    const inUse = await prisma.project.count({
      where: { categoryId },
    });

    if (inUse > 0) {
      const url = new URL("/admin?error=category_in_use", req.url);
      return NextResponse.redirect(url, { status: 302 });
    }

    await prisma.category.delete({
      where: { id: categoryId },
    });

    const url = new URL("/admin?category_deleted=1", req.url);
    return NextResponse.redirect(url, { status: 302 });
  } catch (error) {
    console.error("[DELETE category] error", error);
    const url = new URL("/admin?error=category_delete_failed", req.url);
    return NextResponse.redirect(url, { status: 302 });
  }
}
