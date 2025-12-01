import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { clampDateRange } from "@/app/lib/validation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.redirect("/api/auth/signin?callbackUrl=/admin", { status: 302 });
  }

  const { searchParams } = new URL(req.url);
  const startParam = searchParams.get("start");
  const endParam = searchParams.get("end");

  const start = startParam ? new Date(startParam) : (() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d;
  })();
  const end = endParam ? new Date(endParam) : new Date();

  if (Number.isNaN(start.getTime())) {
    start.setDate(start.getDate() - 30);
  }
  if (Number.isNaN(end.getTime())) {
    end.setTime(Date.now());
  }
  end.setHours(23, 59, 59, 999);
  ({ start, end } = clampDateRange(start, end, 90));

  const views = await prisma.projectView.findMany({
    where: { createdAt: { gte: start, lte: end } },
    select: {
      createdAt: true,
      path: true,
      referrer: true,
      deviceType: true,
      project: { select: { slug: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const rows = [
    ["createdAt", "projectSlug", "path", "referrer", "deviceType"].join(","),
    ...views.map((v) =>
      [
        v.createdAt.toISOString(),
        v.project.slug,
        JSON.stringify(v.path ?? ""),
        JSON.stringify(v.referrer ?? ""),
        JSON.stringify(v.deviceType ?? ""),
      ].join(",")
    ),
  ].join("\n");

  return new Response(rows, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=analytics.csv",
    },
  });
}
