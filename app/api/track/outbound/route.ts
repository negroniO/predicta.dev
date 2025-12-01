import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { href } = (await req.json()) as { href?: string };
    if (!href) return NextResponse.json({ ok: false }, { status: 400 });

    await prisma.contactClick.create({
      data: {
        href,
        referrer: req.headers.get("referer"),
        userAgent: req.headers.get("user-agent"),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[TRACK outbound] error", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
