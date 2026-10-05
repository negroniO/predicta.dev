import { NextResponse } from "next/server";
import { prisma } from "./prisma";
import { apiError, httpUrl, readJson, referrerOrigin, textField } from "./api";
import { enforceRateLimit } from "./rateLimit";

export async function trackClick(req: Request): Promise<Response> {
  try {
    // Both aliases share a quota, so switching endpoints cannot bypass it.
    await enforceRateLimit(req, "click", 60);
    const body = await readJson(req);
    const href = httpUrl(textField(body.href, "href", 2048, true), true);
    await prisma.contactClick.create({ data: {
      href, referrer: referrerOrigin(req.headers.get("referer")),
      userAgent: textField(req.headers.get("user-agent"), "userAgent", 1024) || null,
    } });
    return NextResponse.json({ ok: true });
  } catch (error) { return apiError(error, "track_click"); }
}
