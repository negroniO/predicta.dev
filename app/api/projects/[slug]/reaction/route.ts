import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { randomUUID } from "crypto";
import { rateLimit } from "@/app/lib/rateLimit";

export const runtime = "nodejs";

const COOKIE_NAME = "predicta_vid";

async function getOrSetVisitorId() {
  const store = await cookies();
  let vid = store.get(COOKIE_NAME)?.value;
  if (!vid) {
    vid = randomUUID();
    store.set(COOKIE_NAME, vid, {
      httpOnly: true,
      secure: true,
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
  const { slug } = await params;
  const vid = await getOrSetVisitorId();

  const project = await prisma.project.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!project) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
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
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const ok = await rateLimit(`react:${ip}`, 60, 60);
    if (!ok) {
      return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
    }

    const { slug } = await params;
    const { kind } = (await req.json()) as { kind?: string };
    if (kind !== "like" && kind !== "dislike") {
      return NextResponse.json({ ok: false, error: "bad_kind" }, { status: 400 });
    }

    const vid = await getOrSetVisitorId();
    const project = await prisma.project.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!project) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
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
    console.error("[PROJECT reaction] error", error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
