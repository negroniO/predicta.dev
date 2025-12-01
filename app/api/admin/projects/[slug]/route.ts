import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  normalizeSlug,
  isValidSlug,
  parseIntOr,
  splitCsv,
} from "@/app/lib/validation";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.redirect("/api/auth/signin?callbackUrl=/admin", { status: 302 });
  }

  const { slug } = await context.params;
  const body = await req.formData();
  const action = (body.get("_action") as string) || "update";

  // DELETE
  if (action === "delete") {
    try {
      await prisma.project.delete({
        where: { slug },
      });

      const url = new URL("/admin?deleted=1", req.url);
      return NextResponse.redirect(url, { status: 302 });
    } catch (error) {
      console.error("[DELETE project] error", error);

      const url = new URL("/admin?error=delete_failed", req.url);
      return NextResponse.redirect(url, { status: 302 });
    }
  }

  // UPDATE
  try {
    // 1) Handle cover image upload
    const coverImageFile = body.get("coverImage") as File | null;
    let coverImageUrl: string | null = null;

    if (coverImageFile && coverImageFile.size > 0) {
      const uploadForm = new FormData();
      uploadForm.append("file", coverImageFile);

      const uploadUrl = new URL("/api/upload/cover", req.url);

      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        body: uploadForm,
      });

      if (!uploadResponse.ok) {
        console.error("[UPLOAD cover] failed", await uploadResponse.text());
      } else {
        const json = (await uploadResponse.json()) as { url: string };
        coverImageUrl = json.url;
      }
    }

    // 2) Normal fields
    const title = (body.get("title") as string)?.trim();
    const newSlugRaw = (body.get("slug") as string)?.trim();
    const newSlug = newSlugRaw ? normalizeSlug(newSlugRaw) : "";
    const subtitle = (body.get("subtitle") as string)?.trim() || null;
    const description = (body.get("description") as string)?.trim() || "";
    const content = (body.get("content") as string)?.trim() || null;
    const status = (body.get("status") as string)?.trim() || "In Progress";

    const yearRaw = (body.get("year") as string) || "";
    const year = yearRaw
      ? parseIntOr(yearRaw, new Date().getFullYear())
      : new Date().getFullYear();

    const sortOrderRaw = (body.get("sortOrder") as string) || "";
    const sortOrder = sortOrderRaw ? parseIntOr(sortOrderRaw, 999) : 999;

    const tags = splitCsv(body.get("tags") as string);
    const techStack = splitCsv(body.get("techStack") as string);

    const categoryIdRaw = (body.get("category") as string) || "";
    const categoryId =
      categoryIdRaw && !Number.isNaN(parseInt(categoryIdRaw, 10))
        ? parseInt(categoryIdRaw, 10)
        : null;

    const githubUrl = ((body.get("githubUrl") as string) || "").trim() || null;
    const liveUrl = ((body.get("liveUrl") as string) || "").trim() || null;
    const featured = body.get("featured") !== null;

    if (!title || !newSlug || !isValidSlug(newSlug)) {
      const url = new URL(`/admin/edit/${slug}?error=missing_fields`, req.url);
      return NextResponse.redirect(url, { status: 302 });
    }

    await prisma.project.update({
      where: { slug },
      data: {
        title,
        slug: newSlug,
        subtitle,
        description,
        content,
        status,
        year,
        featured,
        sortOrder,
        tags,
        techStack,
        githubUrl,
        liveUrl,
        ...(coverImageUrl ? { coverImageUrl } : {}), // only override if new image
        ...(categoryId !== null
          ? { category: { connect: { id: categoryId } } }
          : { category: { disconnect: true } }),
      },
    });

    const url = new URL("/admin?updated=1", req.url);
    return NextResponse.redirect(url, { status: 302 });
  } catch (error) {
    console.error("[UPDATE project] error", error);

    const url = new URL(`/admin/edit/${slug}?error=update_failed`, req.url);
    return NextResponse.redirect(url, { status: 302 });
  }
}
