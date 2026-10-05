import { publicProjectWhere } from "@/app/lib/public-projects";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { randomUUID } from "crypto";
import { enforceRateLimit } from "@/app/lib/rateLimit";
import { apiError, ApiError, readJson, textField } from "@/app/lib/api";
import { isValidSlug } from "@/app/lib/validation";

export const runtime = "nodejs";

const COOKIE_NAME = "predicta_vid";

async function getOrSetVisitorId() {
  const store = await cookies();
  let vid = store.get(COOKIE_NAME)?.value;
  if (!vid || !/^[a-f0-9-]{36}$/i.test(vid)) {
    vid = randomUUID();
    store.set(COOKIE_NAME, vid, {
      httpOnly: true,
      secure: new URL(process.env.NEXTAUTH_URL || "https://predicta.dev").protocol === "https:",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: "/",
    });
  }
  return vid;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
  const { slug } = await params;
  if (!isValidSlug(slug) || slug.length > 160) throw new ApiError("invalid_slug");
  const vid = await getOrSetVisitorId();

  const project = await prisma.project.findFirst({
    where: { slug, ...publicProjectWhere },
    select: { id: true },
  });
  if (!project) {
    throw new ApiError("not_found", 404);
  }

  const [mine, counts] = await Promise.all([
    prisma.projectReaction.findUnique({
      where: { projectId_visitorId: { projectId: project.id, visitorId: vid } },
    }),
    prisma.projectReaction.groupBy({
      by: ["kind"],
      where: { projectId: project.id },
      _count: { kind: true },
    }),
  ]);

  const likeCount = counts.find((c) => c.kind === "like")?._count.kind ?? 0;
  const dislikeCount = counts.find((c) => c.kind === "dislike")?._count.kind ?? 0;

  return NextResponse.json({
    ok: true,
    likeCount,
    dislikeCount,
    mine: mine?.kind ?? null,
  });
  } catch (error) { return apiError(error, "reaction_read"); }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await enforceRateLimit(req, "reaction", 60);
    const { slug } = await params;
    const body = await readJson(req);
    const kind = textField(body.kind, "kind", 10, true);
    if (!isValidSlug(slug) || slug.length > 160) throw new ApiError("invalid_slug");
    if (kind !== "like" && kind !== "dislike") {
      throw new ApiError("bad_kind");
    }

    const vid = await getOrSetVisitorId();
    const project = await prisma.project.findFirst({
      where: { slug, ...publicProjectWhere },
      select: { id: true },
    });
    if (!project) {
      throw new ApiError("not_found", 404);
    }

    await prisma.projectReaction.upsert({
      where: { projectId_visitorId: { projectId: project.id, visitorId: vid } },
      update: { kind },
      create: { projectId: project.id, visitorId: vid, kind },
    });

    const counts = await prisma.projectReaction.groupBy({
      by: ["kind"],
      where: { projectId: project.id },
      _count: { kind: true },
    });

    const likeCount = counts.find((c) => c.kind === "like")?._count.kind ?? 0;
    const dislikeCount = counts.find((c) => c.kind === "dislike")?._count.kind ?? 0;

    return NextResponse.json({
      ok: true,
      likeCount,
      dislikeCount,
      mine: kind,
    });
  } catch (error) {
    return apiError(error, "reaction");
  }
}
