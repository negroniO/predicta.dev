import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
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
  const slug = (body.get("slug") as string)?.trim();
  const subtitle = (body.get("subtitle") as string)?.trim() || null;
  const description = (body.get("description") as string)?.trim() || "";
  const content = (body.get("content") as string)?.trim() || null;
  const status = (body.get("status") as string)?.trim() || "In Progress";
  const year = parseInt(
    (body.get("year") as string) || `${new Date().getFullYear()}`,
    10
  );
  const sortOrder = parseInt(
    (body.get("sortOrder") as string) || "999",
    10
  );

  const tagsRaw = (body.get("tags") as string) || "";
  const tags = tagsRaw
    ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  const githubUrl = ((body.get("githubUrl") as string) || "").trim() || null;
  const liveUrl = ((body.get("liveUrl") as string) || "").trim() || null;
  const featured = body.get("featured") !== null;

  if (!title || !slug) {
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
        techStack: [],
        githubUrl,
        liveUrl,
        coverImageUrl, // store the uploaded image URL
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
