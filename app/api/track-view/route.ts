// app/api/track-view/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export const runtime = "nodejs";

function getDeviceType(
  ua: string | null
): "mobile" | "tablet" | "desktop" | "bot" | "unknown" {
  if (!ua) return "unknown";
  const l = ua.toLowerCase();

  if (/bot|crawler|spider|crawling/.test(l)) return "bot";
  if (/ipad|tablet/.test(l)) return "tablet";
  if (/mobi|iphone|android/.test(l)) return "mobile";
  if (/windows|macintosh|linux/.test(l)) return "desktop";
  return "unknown";
}

export async function POST(req: NextRequest) {
  try {
    let body: {
      slug?: string;
      path?: string;
      visitorId?: string;
      referrer?: string | null;
    };

    try {
      body = (await req.json()) || {};
    } catch (e) {
      console.error("[track-view] Failed to parse JSON body", e);
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { slug, path, visitorId, referrer: bodyReferrer } = body;

    if (!slug) {
      return NextResponse.json({ error: "Missing slug" }, { status: 400 });
    }

    const project = await prisma.project.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!project) {
      return NextResponse.json(
        { error: `Project not found for slug: ${slug}` },
        { status: 404 }
      );
    }

    const userAgent = req.headers.get("user-agent");
    const deviceType = getDeviceType(userAgent);
    const headerReferrer =
      req.headers.get("referer") || req.headers.get("referrer") || null;

    const finalReferrer = bodyReferrer || headerReferrer;

    // 🔍 Log what we're about to insert (only in dev)
    if (process.env.NODE_ENV !== "production") {
      console.log("[track-view] creating ProjectView", {
        projectId: project.id,
        path: path || `/projects/${slug}`,
        userAgent,
        referrer: finalReferrer,
        visitorId: visitorId || null,
        deviceType,
      });
    }

    await prisma.projectView.create({
      data: {
        projectId: project.id,
        path: path || `/projects/${slug}`,
        userAgent,
        referrer: finalReferrer,
        visitorId: visitorId || null,
        deviceType,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("[POST /api/track-view] error", error);

    // In dev, return more info so you can see the real issue
    if (process.env.NODE_ENV !== "production") {
      return NextResponse.json(
        {
          error: "Internal error",
          message: error?.message,
          name: error?.name,
          code: (error as any)?.code,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
