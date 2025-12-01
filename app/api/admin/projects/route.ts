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

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.redirect("/api/auth/signin?callbackUrl=/admin", { status: 302 });
  }

  const body = await req.formData();

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
      console.error("[UPLOAD cover create] failed", await uploadResponse.text());
    } else {
      const json = (await uploadResponse.json()) as { url: string };
      coverImageUrl = json.url;
    }
  }

  // 2) Normal fields
  const title = (body.get("title") as string)?.trim();
  const slugRaw = (body.get("slug") as string)?.trim();
  const slug = slugRaw ? normalizeSlug(slugRaw) : "";
  const subtitle = (body.get("subtitle") as string)?.trim() || null;
  const description = (body.get("description") as string)?.trim() || "";
  const content = (body.get("content") as string)?.trim() || null;
  const status = (body.get("status") as string)?.trim() || "In Progress";
  const year = parseIntOr(
    (body.get("year") as string) || `${new Date().getFullYear()}`,
    new Date().getFullYear()
  );
  const sortOrder = parseIntOr((body.get("sortOrder") as string) || "999", 999);

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

  if (!title || !slug || !isValidSlug(slug)) {
    const url = new URL("/admin?error=missing_title_or_slug", req.url);
    return NextResponse.redirect(url, { status: 302 });
  }

  try {
    await prisma.project.create({
      data: {
        title,
        slug,
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
        coverImageUrl, // store the uploaded image URL
        ...(categoryId
          ? {
              category: {
                connect: { id: categoryId },
              },
            }
          : {}),
      },
    });

    const url = new URL("/admin?created=1", req.url);
    return NextResponse.redirect(url, { status: 302 });
  } catch (error) {
    console.error("[POST /api/admin/projects] error", error);

    const url = new URL("/admin?error=create_failed", req.url);
    return NextResponse.redirect(url, { status: 302 });
  }
}
