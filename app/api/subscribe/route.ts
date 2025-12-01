import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { rateLimit } from "@/app/lib/rateLimit";

export const runtime = "nodejs";

function isValidEmail(email: string) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const ok = await rateLimit(`sub:${ip}`, 20, 60);
    if (!ok) {
      return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
    }

    const { email } = (await req.json()) as { email?: string };
    const trimmed = email?.trim().toLowerCase();

    if (!trimmed || !isValidEmail(trimmed)) {
      return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
    }

    await prisma.newsletterSubscriber.upsert({
      where: { email: trimmed },
      update: {},
      create: { email: trimmed },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[SUBSCRIBE] error", error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
