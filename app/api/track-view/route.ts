import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { publicProjectWhere } from "@/app/lib/public-projects";
import { apiError, ApiError, readJson, textField, referrerOrigin } from "@/app/lib/api";
import { isValidSlug } from "@/app/lib/validation";
import { enforceRateLimit } from "@/app/lib/rateLimit";

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
    await enforceRateLimit(req, "view", 120);
    const body = await readJson(req);
    const slug = textField(body.slug, "slug", 160, true);
    if (!isValidSlug(slug)) throw new ApiError("invalid_slug");
    const path = textField(body.path, "path", 2048) || `/projects/${slug}`;
    if (!path.startsWith("/") || path.startsWith("//")) throw new ApiError("invalid_path");
    const visitorId = textField(body.visitorId, "visitorId", 100) || null;
    const userAgent = textField(req.headers.get("user-agent"), "userAgent", 1024) || null;
    const referrer = referrerOrigin(body.referrer ?? req.headers.get("referer"));
    const project = await prisma.project.findFirst({ where: { slug, ...publicProjectWhere }, select: { id: true } });
    if (!project) throw new ApiError("not_found", 404);
    await prisma.projectView.create({ data: { projectId: project.id, path, visitorId, userAgent, referrer, deviceType: getDeviceType(userAgent) } });
    return NextResponse.json({ ok: true });
  } catch (error) { return apiError(error, "track_view"); }
}
