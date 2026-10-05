import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { apiError, ApiError, readJson, textField } from "@/app/lib/api";
import { enforceRateLimit } from "@/app/lib/rateLimit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    await enforceRateLimit(req, "subscribe", 20);
    const body = await readJson(req);
    const email = textField(body.email, "email", 254, true).toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new ApiError("invalid_email");
    await prisma.newsletterSubscriber.upsert({ where: { email }, update: {}, create: { email } });
    return NextResponse.json({ ok: true });
  } catch (error) { return apiError(error, "subscribe"); }
}
